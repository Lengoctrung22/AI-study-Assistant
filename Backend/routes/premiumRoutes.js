const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requirePremium = require('../middleware/requirePremium');
const premiumController = require('../controllers/premiumController');

// All premium routes require auth + premium plan
router.use(auth);
router.use(requirePremium);

// Advanced AI Study Modes
router.post('/documents/:id/mindmap', premiumController.generateMindMap);
router.post('/documents/:id/concepts', premiumController.generateConcepts);
router.post('/documents/:id/multi-summary', premiumController.generateMultiLevelSummary);

// Smart Document Analytics
router.post('/documents/:id/analytics', premiumController.generateDocumentAnalytics);
router.post('/documents/:id/glossary', premiumController.generateGlossary);
router.get('/analytics/weak-areas', premiumController.getWeakAreas);

module.exports = router;
