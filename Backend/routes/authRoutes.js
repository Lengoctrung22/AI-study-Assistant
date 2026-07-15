const express = require('express');
const router = express.Router();
const { register, login, getMe, togglePlan } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);

// Dev-only: toggle plan for testing (disabled in production)
if (process.env.NODE_ENV !== 'production') {
  router.post('/toggle-plan', auth, togglePlan);
}

module.exports = router;
