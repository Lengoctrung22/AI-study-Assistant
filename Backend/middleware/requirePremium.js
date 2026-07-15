/**
 * Middleware to gate premium-only features.
 * Must be used AFTER the auth middleware.
 */
const requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Không có quyền truy cập' });
  }

  // Check if user has premium plan
  if (req.user.plan !== 'premium') {
    return res.status(403).json({
      message: 'Tính năng này yêu cầu gói Premium',
      code: 'PREMIUM_REQUIRED',
      upgradeUrl: '/pricing',
      currentPlan: req.user.plan,
    });
  }

  // Check if premium subscription has expired
  if (req.user.premiumExpiresAt && new Date(req.user.premiumExpiresAt) < new Date()) {
    return res.status(403).json({
      message: 'Gói Premium của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng.',
      code: 'PREMIUM_EXPIRED',
      upgradeUrl: '/pricing',
      currentPlan: req.user.plan,
      expiredAt: req.user.premiumExpiresAt,
    });
  }

  next();
};

module.exports = requirePremium;
