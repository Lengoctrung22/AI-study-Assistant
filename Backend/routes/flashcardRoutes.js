const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  generateFromDocument,
  getFlashcardSets,
  getFlashcardSet,
  reviewCard,
  deleteFlashcardSet,
} = require('../controllers/flashcardController');

router.post('/generate/:documentId', auth, generateFromDocument);
router.get('/', auth, getFlashcardSets);
router.get('/:id', auth, getFlashcardSet);
router.put('/:id/review', auth, reviewCard);
router.delete('/:id', auth, deleteFlashcardSet);

module.exports = router;
