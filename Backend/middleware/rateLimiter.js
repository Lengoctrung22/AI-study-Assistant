const rateLimit = require('express-rate-limit');

// General API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 mins per IP
  message: { message: 'Quá nhiều yêu cầu đến hệ thống. Vui lòng thử lại sau.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security: AI & Sensitive Request Rate Limiter (Chat, Quiz, Mindmap, Summarize)
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 40, // max 40 AI generations per 5 mins per IP
  message: { message: 'Tần suất gửi yêu cầu AI quá nhanh. Vui lòng đợi 5 phút trước khi thử lại.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security: Rate limiting for auth endpoints (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // max 15 login/register attempts per 15 mins per IP
  message: { message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  aiLimiter,
  authLimiter,
};
