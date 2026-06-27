const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  citations: [{
    chunkText: String,
    pageNumber: Number,
    chunkIndex: Number,
  }],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  title: {
    type: String,
    default: 'Cuộc trò chuyện mới',
  },
  messages: [messageSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
