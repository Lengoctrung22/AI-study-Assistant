const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: {
    type: String,
    enum: ['mcq', 'fill_blank', 'true_false', 'short_answer'],
    default: 'mcq',
  },
  options: [{ type: String }], // for mcq
  correctAnswer: { type: Number }, // index for mcq
  blankAnswer: { type: String, default: '' }, // for fill_blank
  correctBoolean: { type: Boolean }, // for true_false
  shortAnswer: { type: String, default: '' }, // for short_answer
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
  questionTypes: {
    type: [String],
    enum: ['mcq', 'fill_blank', 'true_false', 'short_answer'],
    default: ['mcq'],
  },
  // Timed quiz (premium)
  timerMode: {
    type: String,
    enum: ['none', 'per_question', 'total'],
    default: 'none',
  },
  timeLimit: {
    type: Number, // seconds
    default: 0,
  },
  questions: [questionSchema],
  result: {
    score: { type: Number, default: null },
    total: { type: Number, default: 0 },
    answers: [{ type: mongoose.Schema.Types.Mixed }],
    timeSpent: { type: Number, default: 0 }, // seconds
    completedAt: { type: Date, default: null },
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending',
  },
  // Adaptive difficulty tracking
  parentQuizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    default: null,
  },
  adaptiveScore: {
    type: Number,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Quiz', quizSchema);

