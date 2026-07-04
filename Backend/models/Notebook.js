const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const notebookSchema = new mongoose.Schema({
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
  description: {
    type: String,
    default: '',
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
  }],
  generatedOutputs: {
    briefingDoc: {
      content: String,
      generatedAt: Date,
    },
    studyGuide: {
      content: String,
      generatedAt: Date,
    },
    timeline: {
      content: mongoose.Schema.Types.Mixed, // Storing JSON timeline
      generatedAt: Date,
    },
    faq: {
      content: mongoose.Schema.Types.Mixed, // Storing JSON FAQ list
      generatedAt: Date,
    },
    deepDiveScript: {
      content: String,
      generatedAt: Date,
    },
    tableOfContents: {
      content: mongoose.Schema.Types.Mixed, // Storing JSON TOC structure
      generatedAt: Date,
    },
  },
  notes: [noteSchema],
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notebook', notebookSchema);
