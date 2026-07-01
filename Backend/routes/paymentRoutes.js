const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkout, cancelSubscription, getPaymentHistory, qrInit, checkQRStatus, getPlans } = require('../controllers/paymentController');

// Public routes
router.get('/plans', getPlans);

// All other payment routes require authentication
router.use(auth);

router.post('/checkout', checkout);
router.post('/qr-init', qrInit);
router.get('/status/:transactionId', checkQRStatus);
router.post('/cancel-subscription', cancelSubscription);
router.get('/history', getPaymentHistory);

module.exports = router;
