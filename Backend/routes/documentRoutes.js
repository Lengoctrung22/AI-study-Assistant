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
} = require('../controllers/documentController');

router.post('/upload', auth, upload.single('file'), uploadDocument);
router.get('/', auth, getDocuments);
router.get('/:id', auth, getDocument);
router.delete('/:id', auth, deleteDocument);
router.post('/:id/summarize', auth, summarizeDocument);
router.post('/:id/explain', auth, explainText);
router.get('/:id/text', auth, getDocumentText);

module.exports = router;
