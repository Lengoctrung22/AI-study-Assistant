const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  front: { type: String, required: true },
  back: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  tags: [String],
  nextReview: { type: Date, default: Date.now },
  interval: { type: Number, default: 1 },
  easeFactor: { type: Number, default: 2.5 },
  repetitions: { type: Number, default: 0 },
});

const flashcardSetSchema = new mongoose.Schema({
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
  description: {
    type: String,
    default: '',
  },
  cards: [cardSchema],
  totalReviews: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FlashcardSet', flashcardSetSchema);
