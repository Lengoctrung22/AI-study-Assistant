const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, default: '' },
  topic: { type: String, default: '' },
});

const quizSchema = new mongoose.Schema({
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
    required: true,
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'mixed',
  },
  questions: [questionSchema],
  result: {
    score: { type: Number, default: null },
    total: { type: Number, default: 0 },
    answers: [{ type: Number }],
    completedAt: { type: Date, default: null },
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Quiz', quizSchema);
