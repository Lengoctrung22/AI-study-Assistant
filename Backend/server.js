const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const quizRoutes = require('./routes/quizRoutes');
const chatRoutes = require('./routes/chatRoutes');
const premiumRoutes = require('./routes/premiumRoutes');
const studyPlanRoutes = require('./routes/studyPlanRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notebookRoutes = require('./routes/notebookRoutes');

const app = express();

// Security: HTTP headers (X-Frame-Options, HSTS, XSS filter, etc.)
app.use(helmet({
  contentSecurityPolicy: false, // CSP is handled by frontend meta tag
  crossOriginEmbedderPolicy: false,
}));

// Security: CORS — restrict to known origins (not wildcard)
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:5000',  // Backend in dev
  process.env.FRONTEND_URL, // Production frontend URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, server-to-server, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS: Origin not allowed'), false);
  },
  credentials: true,
}));

// Security: General API Rate Limiter
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

app.use('/api', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads - Protect or limit if necessary
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authLimiter, authRoutes); // Rate limited: 15 req / 15 min
app.use('/api/documents', documentRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/quiz', aiLimiter, quizRoutes);
app.use('/api/chat', aiLimiter, chatRoutes);
app.use('/api/premium', aiLimiter, premiumRoutes);
app.use('/api/study-plan', studyPlanRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notebooks', notebookRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'Frontend', 'dist')));
  app.get(/.*/, (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '..', 'Frontend', 'dist', 'index.html'));
    }
  });
}

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 AI Study Assistant API ready`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
