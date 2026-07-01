const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const {
  getStats,
  getRecentDocuments,
  getUsers,
  getHealth,
  createUser,
  updateUserRole,
  updateUserPlan,
  toggleUserLock,
  deleteUser,
  adminGetDocumentDetails,
  adminDeleteDocument,
  getPayments,
  getLlmLogs,
  getAdminPlans,
  createPlan,
  updatePlan,
  deletePlan
} = require('../controllers/adminController');

// All routes require auth + admin role
router.use(auth);
router.use(requireAdmin);

router.get('/stats', getStats);
router.get('/recent-documents', getRecentDocuments);
router.get('/users', getUsers);
router.get('/health', getHealth);
router.get('/payments', getPayments);
router.get('/logs', getLlmLogs);

router.get('/plans', getAdminPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);

router.post('/users', createUser);
router.put('/users/:userId/role', updateUserRole);
router.put('/users/:userId/plan', updateUserPlan);
router.put('/users/:userId/lock', toggleUserLock);
router.delete('/users/:userId', deleteUser);
router.get('/documents/:id', adminGetDocumentDetails);
router.delete('/documents/:id', adminDeleteDocument);

module.exports = router;
