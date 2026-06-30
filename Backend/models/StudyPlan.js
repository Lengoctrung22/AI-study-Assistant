const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['read', 'flashcard', 'quiz', 'review', 'practice'],
    required: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number, // minutes
    default: 30,
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

const dailyPlanSchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  tasks: [taskSchema],
  completed: {
    type: Boolean,
    default: false,
  },
});

const studyPlanSchema = new mongoose.Schema({
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
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
  }],
  targetDate: {
    type: Date,
    required: true,
  },
  dailyHours: {
    type: Number,
    default: 2,
  },
  dailyPlan: [dailyPlanSchema],
  progress: {
    type: Number, // 0-100 percentage
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
