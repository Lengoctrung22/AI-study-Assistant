const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requirePremium = require('../middleware/requirePremium');
const quizController = require('../controllers/quizController');

const { aiLimiter } = require('../middleware/rateLimiter');

router.use(auth);

// Standard quiz routes
router.post('/generate/:documentId', aiLimiter, quizController.generateFromDocument);
router.get('/', quizController.getQuizzes);
router.get('/analytics', requirePremium, quizController.getQuizAnalytics);
router.get('/:id', quizController.getQuiz);
router.post('/:id/submit', quizController.submitQuiz);
router.post('/:id/retake', requirePremium, aiLimiter, quizController.retakeQuiz);
router.delete('/:id', quizController.deleteQuiz);

module.exports = router;
