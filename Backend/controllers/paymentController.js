const Payment = require('../models/Payment');
const User = require('../models/User');
const PricingPlan = require('../models/PricingPlan');

// Helper: detect card brand from number
const detectCardBrand = (number) => {
  const cleaned = number.replace(/\s/g, '');
  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'Amex';
  if (/^62/.test(cleaned)) return 'UnionPay';
  if (/^9704/.test(cleaned)) return 'Napas';
  return 'Card';
};

// Helper: basic card validation (Luhn-like format check for simulation)
const validateCardInfo = ({ cardNumber, cardName, expiry, cvv }) => {
  const errors = [];
  const cleaned = (cardNumber || '').replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) errors.push('Số thẻ không hợp lệ');
  if (!cardName || cardName.trim().length < 2) errors.push('Tên chủ thẻ không hợp lệ');
  if (!/^\d{2}\/\d{2}$/.test(expiry || '')) {
    errors.push('Ngày hết hạn không hợp lệ (MM/YY)');
  } else {
    const [mm, yy] = expiry.split('/').map(Number);
    if (mm < 1 || mm > 12) errors.push('Tháng hết hạn không hợp lệ');
    const now = new Date();
    const expDate = new Date(2000 + yy, mm);
    if (expDate < now) errors.push('Thẻ đã hết hạn');
  }
  if (!/^\d{3,4}$/.test(cvv || '')) errors.push('CVV không hợp lệ');
  return errors;
};

// GET /api/payments/plans
exports.getPlans = async (req, res, next) => {
  try {
    const plans = await PricingPlan.find({ isActive: true });
    res.json({ plans });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/checkout
exports.checkout = async (req, res, next) => {
  try {
    const { plan, cardNumber, cardName, expiry, cvv, method } = req.body;

    // Validate plan from DB
    const planObj = await PricingPlan.findOne({ code: plan, isActive: true });
    if (!planObj) {
      return res.status(400).json({ message: 'Gói đăng ký không tồn tại hoặc đã bị khóa.' });
    }

    // If already premium and not expired
    if (req.user.plan === 'premium' && req.user.premiumExpiresAt && new Date(req.user.premiumExpiresAt) > new Date()) {
      return res.status(400).json({ message: 'Bạn đang sử dụng gói Premium. Vui lòng hủy gói hiện tại trước khi mua mới.' });
    }

    // Validate card info
    const paymentMethod = method || 'card';
    if (paymentMethod === 'card') {
      const validationErrors = validateCardInfo({ cardNumber, cardName, expiry, cvv });
      if (validationErrors.length > 0) {
        return res.status(400).json({ message: validationErrors.join('. ') });
      }
    }

    // Simulate payment processing delay (300-800ms)
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    // Simulate a ~5% failure rate for realism
    if (Math.random() < 0.05) {
      const failedPayment = await Payment.create({
        userId: req.user._id,
        plan,
        amount: planObj.price,
        method: paymentMethod,
        status: 'failed',
        cardLast4: paymentMethod === 'card' ? cardNumber.replace(/\s/g, '').slice(-4) : null,
        cardBrand: paymentMethod === 'card' ? detectCardBrand(cardNumber) : null,
        description: `Nâng cấp Premium (${planObj.name}) — Thất bại`,
      });
      return res.status(402).json({
        message: 'Giao dịch thất bại. Ngân hàng từ chối giao dịch. Vui lòng thử lại.',
        transactionId: failedPayment.transactionId,
      });
    }

    // Calculate premium expiry
    const now = new Date();
    const premiumExpiresAt = new Date(now.setMonth(now.getMonth() + planObj.durationMonths));

    // Create successful payment record
    const payment = await Payment.create({
      userId: req.user._id,
      plan,
      amount: planObj.price,
      method: paymentMethod,
      status: 'completed',
      cardLast4: paymentMethod === 'card' ? cardNumber.replace(/\s/g, '').slice(-4) : null,
      cardBrand: paymentMethod === 'card' ? detectCardBrand(cardNumber) : null,
      description: `Nâng cấp Premium (${planObj.name})`,
    });

    // Update user to premium
    await User.findByIdAndUpdate(req.user._id, {
      plan: 'premium',
      subscriptionType: plan,
      premiumExpiresAt,
    });

    res.status(200).json({
      message: 'Thanh toán thành công! Chào mừng bạn đến với Premium! 🎉',
      payment: {
        transactionId: payment.transactionId,
        plan: payment.plan,
        amount: payment.amount,
        currency: payment.currency,
        cardLast4: payment.cardLast4,
        cardBrand: payment.cardBrand,
        status: payment.status,
        createdAt: payment.createdAt,
      },
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        plan: 'premium',
        role: req.user.role,
        subscriptionType: plan,
        premiumExpiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/payments/cancel-subscription
exports.cancelSubscription = async (req, res, next) => {
  try {
    if (req.user.plan !== 'premium') {
      return res.status(400).json({ message: 'Bạn không có gói Premium để hủy.' });
    }

    // Create a cancellation record
    await Payment.create({
      userId: req.user._id,
      plan: req.user.subscriptionType || 'monthly',
      amount: 0,
      method: 'card',
      status: 'cancelled',
      description: 'Hủy gói Premium',
    });

    // Downgrade user
    await User.findByIdAndUpdate(req.user._id, {
      plan: 'free',
      subscriptionType: null,
      premiumExpiresAt: null,
    });

    res.json({
      message: 'Đã hủy gói Premium thành công. Bạn đã chuyển về gói Miễn phí.',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        plan: 'free',
        role: req.user.role,
        subscriptionType: null,
        premiumExpiresAt: null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/history
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ payments });
  } catch (error) {
    next(error);
  }
};

// POST /api/payments/qr-init
exports.qrInit = async (req, res, next) => {
  try {
    const { plan } = req.body;

    // Validate plan from DB
    const planObj = await PricingPlan.findOne({ code: plan, isActive: true });
    if (!planObj) {
      return res.status(400).json({ message: 'Gói đăng ký không tồn tại hoặc đã bị khóa.' });
    }

    if (req.user.plan === 'premium' && req.user.premiumExpiresAt && new Date(req.user.premiumExpiresAt) > new Date()) {
      return res.status(400).json({ message: 'Bạn đang sử dụng gói Premium. Vui lòng hủy gói hiện tại trước khi mua mới.' });
    }

    const amount = planObj.price;
    
    // Create pending payment
    const payment = await Payment.create({
      userId: req.user._id,
      plan,
      amount,
      method: 'bank_transfer',
      status: 'pending',
      description: `Quét mã QR - Nâng cấp Premium (${planObj.name})`,
    });

    // Generate VietQR URL
    const bankId = 'vietinbank'; // Bank code
    const accountNo = '9704151234567890'; // Mock account number
    const accountName = 'CONG TY STUDYAI VIET NAM';
    const memo = `STUDYAI ${payment.transactionId}`;
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-quick.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountName)}`;

    res.status(200).json({
      message: 'Khởi tạo mã QR thành công',
      qrUrl,
      bankName: 'Ngân hàng Công Thương Việt Nam (VietinBank)',
      accountNo,
      accountName,
      amount,
      memo,
      transactionId: payment.transactionId,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/status/:transactionId
exports.checkQRStatus = async (req, res, next) => {
  try {
    const { transactionId } = req.params;

    const payment = await Payment.findOne({ transactionId, userId: req.user._id });
    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin giao dịch' });
    }

    if (payment.status === 'completed') {
      return res.json({ status: 'completed', message: 'Thanh toán thành công' });
    }

    if (payment.status === 'pending') {
      // Simulate real-time checking: automatically approve transaction after 12 seconds
      const elapsedMs = new Date() - new Date(payment.createdAt);
      if (elapsedMs > 12000) {
        const planObj = await PricingPlan.findOne({ code: payment.plan });
        const durationMonths = planObj ? planObj.durationMonths : 1;

        const now = new Date();
        const premiumExpiresAt = new Date(now.setMonth(now.getMonth() + durationMonths));

        payment.status = 'completed';
        await payment.save();

        const user = await User.findByIdAndUpdate(req.user._id, {
          plan: 'premium',
          subscriptionType: payment.plan,
          premiumExpiresAt,
        }, { new: true });

        return res.json({
          status: 'completed',
          message: 'Thanh toán thành công! Chào mừng bạn đến với Premium! 🎉',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            plan: 'premium',
            role: user.role,
            subscriptionType: payment.plan,
            premiumExpiresAt,
          },
          payment: {
            transactionId: payment.transactionId,
            plan: payment.plan,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            createdAt: payment.createdAt,
          }
        });
      }
    }

    res.json({ status: payment.status });
  } catch (error) {
    next(error);
  }
};

