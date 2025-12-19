require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const File = require('./models/File');

const app = express();
app.use(cors({
    origin: ["http://localhost:5173", "https://dev-sync-ivory.vercel.app"],
    credentials: true
}));
app.use(express.json());

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error(err));

// 2. Configure Cloudflare R2 (S3 Compatible)
const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

// Setup Multer for file handling
const upload = multer({ storage: multer.memoryStorage() });

// --- ROUTES ---

// Route 1: Upload a File (Private to User + Optional Password)
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const { userId, password } = req.body; 

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const uniqueKey = `${Date.now()}-${file.originalname}`;

        await s3.send(new PutObjectCommand({
            Bucket: 'devsync-storage',
            Key: uniqueKey,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));

        const publicUrl = `${process.env.R2_PUBLIC_URL}/${uniqueKey}`;

        const newFile = new File({
            name: file.originalname,
            url: publicUrl,
            key: uniqueKey,
            userId: userId,
            password: password || "" // Save password if provided
        });

        await newFile.save();
        res.json(newFile);

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Route 2: Get My Files (Private Dashboard)
app.get('/api/files', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.json([]); 

        const files = await File.find({ userId: userId }).sort({ createdAt: -1 });
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route 3: Secure Access / Share Link (Replaces old 'get single file')
app.post('/api/file/:id/access', async (req, res) => {
    try {
        const { password } = req.body;
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }

        // Check if file is password protected
        if (file.password && file.password.length > 0) {
            if (password !== file.password) {
                return res.status(401).json({ error: "Incorrect Password" });
            }
        }
        
        // If password matches (or no password set), return file
        res.json(file);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});
// Route 6: Save File Content (Update)
app.put('/api/file/:id', async (req, res) => {
    try {
        const { content } = req.body;
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }

        // Overwrite the file in Cloudflare R2
        await s3.send(new PutObjectCommand({
            Bucket: 'devsync-storage',
            Key: file.key, // Use the same key to overwrite
            Body: Buffer.from(content),
            ContentType: 'text/plain',
        }));

        res.json({ message: "File saved successfully" });
    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ error: "Failed to save file" });
    }
});
// Route 4: Delete File
app.delete('/api/file/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ error: "File not found" });

        // 1. Delete from R2
        await s3.send(new DeleteObjectCommand({
            Bucket: 'devsync-storage',
            Key: file.key,
        }));

        // 2. Delete from DB
        await File.findByIdAndDelete(req.params.id);

        res.json({ message: "File deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete file" });
    }
});

// Route 5: Create New File (Template + Optional Password)
app.post('/api/file/create', async (req, res) => {
    try {
        const { userId, fileName, language, password } = req.body;

        if (!userId || !fileName || !language) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const templates = {
            python: 'print("Hello from Python!")\n',
            javascript: 'console.log("Hello from JavaScript!");\n',
            java: 'public class Main {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello from Java!");\n\t}\n}\n',
            cpp: '#include <iostream>\n\nint main() {\n\tstd::cout << "Hello from C++!" << std::endl;\n\treturn 0;\n}\n',
            php: '<?php\necho "Hello from PHP!";\n?>',
            html: '<!DOCTYPE html>\n<html>\n<body>\n\t<h1>Hello HTML</h1>\n</body>\n</html>'
        };

        const content = templates[language] || '// Start coding...';
        const extensions = { python: 'py', javascript: 'js', java: 'java', cpp: 'cpp', php: 'php', html: 'html' };
        const ext = extensions[language] || 'txt';
        const fullFileName = `${fileName}.${ext}`;
        const uniqueKey = `${Date.now()}-${fullFileName}`;

        await s3.send(new PutObjectCommand({
            Bucket: 'devsync-storage',
            Key: uniqueKey,
            Body: Buffer.from(content),
            ContentType: 'text/plain',
        }));

        const publicUrl = `${process.env.R2_PUBLIC_URL}/${uniqueKey}`;

        const newFile = new File({
            name: fullFileName,
            url: publicUrl,
            key: uniqueKey,
            userId: userId,
            password: password || "" // Save password
        });

        await newFile.save();
        res.json(newFile);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create file" });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});