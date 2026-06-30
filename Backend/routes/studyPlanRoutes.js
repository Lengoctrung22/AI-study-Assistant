const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requirePremium = require('../middleware/requirePremium');
const studyPlanController = require('../controllers/studyPlanController');

// All study plan routes require auth + premium
router.use(auth);
router.use(requirePremium);

// Study Plan CRUD
router.post('/generate', studyPlanController.generatePlan);
router.get('/', studyPlanController.getPlans);
router.get('/streak', studyPlanController.getStreak);
router.get('/heatmap', studyPlanController.getHeatmap);
router.get('/sr-dashboard', studyPlanController.getSRDashboard);
router.get('/:id', studyPlanController.getPlan);
router.put('/:id/task', studyPlanController.toggleTask);
router.delete('/:id', studyPlanController.deletePlan);

// Activity tracking
router.post('/activity', studyPlanController.logActivity);

module.exports = router;
