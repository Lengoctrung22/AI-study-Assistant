const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requirePremium = require('../middleware/requirePremium');
const studyPlanController = require('../controllers/studyPlanController');

// All study plan routes require auth
router.use(auth);

// Public / Free Tier Study Stats
router.get('/streak', studyPlanController.getStreak);
router.get('/heatmap', studyPlanController.getHeatmap);
router.post('/activity', studyPlanController.logActivity);

// Premium study plan CRUD
router.post('/generate', requirePremium, studyPlanController.generatePlan);
router.get('/', requirePremium, studyPlanController.getPlans);
router.get('/sr-dashboard', requirePremium, studyPlanController.getSRDashboard);
router.get('/:id', requirePremium, studyPlanController.getPlan);
router.put('/:id/task', requirePremium, studyPlanController.toggleTask);
router.delete('/:id', requirePremium, studyPlanController.deletePlan);

module.exports = router;
