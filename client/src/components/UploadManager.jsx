import React, { useState } from 'react';
import axios from 'axios';
import { useUser } from "@clerk/clerk-react"; // Import Clerk hook

const UploadManager = ({ onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const { user } = useUser(); // Get the current logged-in user

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Security Check: Ensure user is logged in
        if (!user) {
            alert("You must be logged in to upload files.");
            return;
        }

        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', user.id); // <--- ATTACH USER ID HERE

        try {
            // UPDATED URL
            await axios.post(`${import.meta.env.VITE_API_URL}/api/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            onUploadSuccess(); // Refresh the file list
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Check console for details.");
        } finally {
            setUploading(false);
            e.target.value = null; // Reset input so you can upload the same file again if needed
        }
    };

    return (
        <div className="w-full">
            <label className={`
                flex items-center justify-center w-full py-2 
                bg-blue-600 hover:bg-blue-700 text-white 
                rounded cursor-pointer transition text-xs font-bold uppercase tracking-wide gap-2
                ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}>
                {uploading ? "Uploading..." : "New File"}
                <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileChange} 
                    disabled={uploading} 
                />
            </label>
        </div>
    );
};

export default UploadManager;