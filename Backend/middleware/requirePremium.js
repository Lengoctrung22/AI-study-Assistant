/**
 * Middleware to gate premium-only features.
 * Must be used AFTER the auth middleware.
 */
const requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Không có quyền truy cập' });
  }

  if (req.user.plan !== 'premium') {
    return res.status(403).json({
      message: 'Tính năng này yêu cầu gói Premium',
      code: 'PREMIUM_REQUIRED',
      upgradeUrl: '/pricing',
      currentPlan: req.user.plan,
    });
  }

  next();
};

module.exports = requirePremium;
