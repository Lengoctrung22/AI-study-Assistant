const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  generateFromDocument,
  getQuizzes,
  getQuiz,
  submitQuiz,
  deleteQuiz,
} = require('../controllers/quizController');

router.post('/generate/:documentId', auth, generateFromDocument);
router.get('/', auth, getQuizzes);
router.get('/:id', auth, getQuiz);
router.post('/:id/submit', auth, submitQuiz);
router.delete('/:id', auth, deleteQuiz);

module.exports = router;
