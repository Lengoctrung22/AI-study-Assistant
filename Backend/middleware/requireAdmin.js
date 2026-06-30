/**
 * Middleware to gate admin-only features.
 * Must be used AFTER the auth middleware.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Không có quyền truy cập' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Tính năng này yêu cầu quyền quản trị viên (Admin)',
      code: 'ADMIN_REQUIRED',
    });
  }

  next();
};

module.exports = requireAdmin;
