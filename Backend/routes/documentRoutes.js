const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  summarizeDocument,
  explainText,
  getDocumentText,
  downloadDocument,
} = require('../controllers/documentController');

const { aiLimiter } = require('../middleware/rateLimiter');

router.post('/upload', auth, upload.single('file'), uploadDocument);
router.get('/', auth, getDocuments);
router.get('/:id', auth, getDocument);
router.get('/:id/download', auth, downloadDocument);
router.delete('/:id', auth, deleteDocument);
router.post('/:id/summarize', auth, aiLimiter, summarizeDocument);
router.post('/:id/explain', auth, aiLimiter, explainText);
router.get('/:id/text', auth, getDocumentText);

module.exports = router;
