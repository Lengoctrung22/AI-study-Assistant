const FlashcardSet = require('../models/FlashcardSet');
const Document = require('../models/Document');
const { parsePDF, cleanText } = require('../services/pdfService');
const { generateFlashcards } = require('../services/flashcardService');
const fs = require('fs');

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

    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ message: 'File tài liệu không tồn tại trên hệ thống' });
    }

    const { text } = await parsePDF(document.filePath);
    const cleaned = cleanText(text);
    const count = Math.max(1, Math.min(30, parseInt(req.body.count) || 10));
    const cards = await generateFlashcards(cleaned, count);

    const flashcardSet = await FlashcardSet.create({
      userId: req.user._id,
      documentId: document._id,
      title: `Flashcards - ${document.title}`,
      description: `Tạo từ tài liệu: ${document.title}`,
      cards,
    });

    // Record study activity (flashcard creation = 10 mins)
    try {
      const { recordActivity } = require('../services/activityService');
      await recordActivity(req.user._id, 'flashcard_review', 10, document._id);
    } catch (actError) {
      console.error('Failed to log flashcard creation activity:', actError.message);
    }

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
      .populate('documentId', 'title')
      .limit(200)
      .lean();

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
    }).populate('documentId', 'title').lean();

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
    const cardIndex = Number(req.body.cardIndex);
    const rawQ = Number(req.body.quality);
    // quality: 0-5 (SM-2 algorithm)

    const set = await FlashcardSet.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!set) {
      return res.status(404).json({ message: 'Không tìm thấy bộ flashcard' });
    }

    if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= (set.cards || []).length) {
      return res.status(400).json({ message: 'Card index không hợp lệ' });
    }

    const card = set.cards[cardIndex];
    if (!card) {
      return res.status(400).json({ message: 'Thẻ không tồn tại' });
    }

    // SM-2 Algorithm
    const q = Number.isFinite(rawQ) ? Math.max(0, Math.min(5, Math.round(rawQ))) : 3;
    card.repetitions = card.repetitions || 0;
    card.interval = card.interval || 1;
    card.easeFactor = card.easeFactor || 2.5;

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

    const updatedSet = await FlashcardSet.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        $set: {
          [`cards.${cardIndex}.interval`]: card.interval,
          [`cards.${cardIndex}.repetitions`]: card.repetitions,
          [`cards.${cardIndex}.easeFactor`]: card.easeFactor,
          [`cards.${cardIndex}.nextReview`]: card.nextReview,
        },
        $inc: { totalReviews: 1 }
      },
      { new: true }
    );

    if (!updatedSet) {
      return res.status(404).json({ message: 'Không tìm thấy bộ flashcard' });
    }

    // Record study activity (flashcard review = 2 mins per card)
    try {
      const { recordActivity } = require('../services/activityService');
      await recordActivity(req.user._id, 'flashcard_review', 2, updatedSet.documentId);
    } catch (actError) {
      console.error('Failed to log flashcard review activity:', actError.message);
    }

    res.json({ card: updatedSet.cards[cardIndex], totalReviews: updatedSet.totalReviews });
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
