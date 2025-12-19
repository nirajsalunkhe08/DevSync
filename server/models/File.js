const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    key: { type: String, required: true },
    userId: { type: String, required: true },
    // ADD THIS NEW FIELD:
    password: { type: String, default: "" }, 
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', FileSchema);