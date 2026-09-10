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

// Trust proxy (required for rate limiting behind reverse proxies like Nginx/Cloudflare/Render)
app.set('trust proxy', 1);

// Security: Check critical environment variables
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_super_secret_jwt_key_should_be_long_and_random_string_here') {
  console.warn('⚠️ WARNING: JWT_SECRET is missing or using default development value. Set a strong secret in production!');
}

// Security: HTTP headers (X-Frame-Options, HSTS, XSS filter, etc.)
app.use(helmet({
  contentSecurityPolicy: false, // CSP is handled by frontend meta tag
  crossOriginEmbedderPolicy: false,
}));

// Security: CORS — restrict to known origins (not wildcard)
const allowedOrigins = [
  'http://localhost:3000',  // Vite dev server
  'http://localhost:5173',  // Vite dev server default
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

// Security: Rate Limiters
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

app.use('/api', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads has been REMOVED for security reasons.
// File downloads must go through authenticated route GET /api/documents/:id/download.

// Routes
app.use('/api/auth', authLimiter, authRoutes); // Rate limited: 15 req / 15 min
app.use('/api/documents', documentRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/premium', premiumRoutes);
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
  app.get(/.*/, (req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '..', 'Frontend', 'dist', 'index.html'));
    } else {
      next();
    }
  });
}

// 404 JSON handler for unmatched API endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint không tồn tại' });
});

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
