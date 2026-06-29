const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  sendMessage,
  getSessions,
  getSession,
  deleteSession,
} = require('../controllers/chatController');

router.post('/:documentId/send', auth, sendMessage);
router.get('/sessions', auth, getSessions);
router.get('/sessions/:id', auth, getSession);
router.delete('/sessions/:id', auth, deleteSession);

module.exports = router;
