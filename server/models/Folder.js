const mongoose = require('mongoose');

const FolderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  userId: { type: String, required: true },
  path: { type: String, default: '/' }, // Helps track breadcrumbs
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Folder', FolderSchema);