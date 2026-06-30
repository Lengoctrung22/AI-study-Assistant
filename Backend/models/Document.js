const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  summary: {
    type: String,
    default: '',
  },
  pageCount: {
    type: Number,
    default: 0,
  },
  chunkCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'ready', 'error'],
    default: 'uploading',
  },
  errorMessage: {
    type: String,
    default: '',
  },
  // Premium feature caches
  mindMap: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  concepts: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  multiLevelSummary: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  analytics: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  glossary: {
    type: [mongoose.Schema.Types.Mixed],
    default: undefined,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Document', documentSchema);
