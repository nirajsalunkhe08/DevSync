// server/storage.js
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
require('dotenv').config();

// Initialize the S3 Client (works for R2 or MinIO)
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_ENDPOINT || `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Function to generate a secure upload URL
const generateUploadUrl = async (fileName, fileType) => {
  const uniqueKey = `${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: uniqueKey,
    ContentType: fileType,
  });

  // URL valid for 60 seconds
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 60 });
  return { uploadUrl, key: uniqueKey };
};

module.exports = { generateUploadUrl };