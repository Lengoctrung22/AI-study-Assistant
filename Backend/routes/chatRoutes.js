const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requirePremium = require('../middleware/requirePremium');
const chatController = require('../controllers/chatController');

const { aiLimiter } = require('../middleware/rateLimiter');

router.use(auth);

// Standard chat routes
router.post('/:documentId/send', aiLimiter, chatController.sendMessage);
router.get('/sessions', chatController.getSessions);
router.get('/sessions/:id', chatController.getSession);
router.delete('/sessions/:id', chatController.deleteSession);

// Premium chat routes
router.post('/multi-doc', requirePremium, aiLimiter, chatController.sendMultiDocMessage);
router.get('/search', requirePremium, chatController.searchChatHistory);
router.put('/persona', requirePremium, chatController.updatePersona);

module.exports = router;
