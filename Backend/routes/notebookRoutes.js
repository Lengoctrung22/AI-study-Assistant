const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notebookController = require('../controllers/notebookController');

router.use(auth);

// Notebook CRUD routes
router.post('/', notebookController.createNotebook);
router.get('/', notebookController.getNotebooks);
router.get('/:id', notebookController.getNotebook);
router.put('/:id', notebookController.updateNotebook);
router.delete('/:id', notebookController.deleteNotebook);

// Document management inside notebook
router.post('/:id/documents', notebookController.addDocuments);
router.delete('/:id/documents/:docId', notebookController.removeDocument);

// User annotations/notes
router.post('/:id/notes', notebookController.addNote);
router.delete('/:id/notes/:noteId', notebookController.deleteNote);

// AI Generation routes
router.post('/:id/generate/:type', notebookController.generateOutput);

// Notebook Chat Q&A routes
router.post('/:id/chat', notebookController.sendMessage);
router.get('/:id/chat/sessions', notebookController.getSessions);

module.exports = router;
