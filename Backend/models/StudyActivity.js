const mongoose = require('mongoose');

const activityEntrySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['document_view', 'flashcard_review', 'quiz_complete', 'chat_message', 'study_plan'],
    required: true,
  },
  duration: {
    type: Number, // minutes
    default: 0,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const studyActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: String, // YYYY-MM-DD format for easy grouping
    required: true,
  },
  activities: [activityEntrySchema],
  totalMinutes: {
    type: Number,
    default: 0,
  },
  streakDay: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Compound index for efficient per-user-per-day lookups
studyActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StudyActivity', studyActivitySchema);
