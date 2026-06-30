const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const {
  getStats,
  getRecentDocuments,
  getUsers,
  getHealth
} = require('../controllers/adminController');

// All routes require auth + admin role
router.use(auth);
router.use(requireAdmin);

router.get('/stats', getStats);
router.get('/recent-documents', getRecentDocuments);
router.get('/users', getUsers);
router.get('/health', getHealth);

module.exports = router;
