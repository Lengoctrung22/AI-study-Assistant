const FlashcardSet = require('../models/FlashcardSet');
const Document = require('../models/Document');
const { parsePDF, cleanText } = require('../services/pdfService');
const { generateFlashcards } = require('../services/flashcardService');

// POST /api/flashcards/generate/:documentId
exports.generateFromDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.documentId,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    const { text } = await parsePDF(document.filePath);
    const cleaned = cleanText(text);
    const count = parseInt(req.body.count) || 10;
    const cards = await generateFlashcards(cleaned, count);

    const flashcardSet = await FlashcardSet.create({
      userId: req.user._id,
      documentId: document._id,
      title: `Flashcards - ${document.title}`,
      description: `Tạo từ tài liệu: ${document.title}`,
      cards,
    });

    res.status(201).json({ flashcardSet });
  } catch (error) {
    next(error);
  }
};

// GET /api/flashcards
exports.getFlashcardSets = async (req, res, next) => {
  try {
    const sets = await FlashcardSet.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('documentId', 'title');

    res.json({ flashcardSets: sets });
  } catch (error) {
    next(error);
  }
};

// GET /api/flashcards/:id
exports.getFlashcardSet = async (req, res, next) => {
  try {
    const set = await FlashcardSet.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('documentId', 'title');

    if (!set) {
      return res.status(404).json({ message: 'Không tìm thấy bộ flashcard' });
    }

    res.json({ flashcardSet: set });
  } catch (error) {
    next(error);
  }
};

// PUT /api/flashcards/:id/review
exports.reviewCard = async (req, res, next) => {
  try {
    const { cardIndex, quality } = req.body;
    // quality: 0-5 (SM-2 algorithm)

    const set = await FlashcardSet.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!set) {
      return res.status(404).json({ message: 'Không tìm thấy bộ flashcard' });
    }

    if (cardIndex < 0 || cardIndex >= set.cards.length) {
      return res.status(400).json({ message: 'Card index không hợp lệ' });
    }

    const card = set.cards[cardIndex];

    // SM-2 Algorithm
    const q = Math.max(0, Math.min(5, quality));

    if (q >= 3) {
      if (card.repetitions === 0) {
        card.interval = 1;
      } else if (card.repetitions === 1) {
        card.interval = 6;
      } else {
        card.interval = Math.round(card.interval * card.easeFactor);
      }
      card.repetitions += 1;
    } else {
      card.repetitions = 0;
      card.interval = 1;
    }

    card.easeFactor = Math.max(
      1.3,
      card.easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
    );

    card.nextReview = new Date(Date.now() + card.interval * 24 * 60 * 60 * 1000);

    set.totalReviews += 1;
    await set.save();

    res.json({ card: set.cards[cardIndex], totalReviews: set.totalReviews });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/flashcards/:id
exports.deleteFlashcardSet = async (req, res, next) => {
  try {
    const set = await FlashcardSet.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!set) {
      return res.status(404).json({ message: 'Không tìm thấy bộ flashcard' });
    }

    res.json({ message: 'Đã xóa bộ flashcard' });
  } catch (error) {
    next(error);
  }
};
