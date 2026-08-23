const User = require('../models/User');
const Document = require('../models/Document');
const mongoose = require('mongoose');
const fs = require('fs');
const { deleteDocumentChunks } = require('../services/embeddingService');

const LlmLog = require('../models/LlmLog');
const ChatSession = require('../models/ChatSession');
const Payment = require('../models/Payment');
const PricingPlan = require('../models/PricingPlan');
const FlashcardSet = require('../models/FlashcardSet');
const Quiz = require('../models/Quiz');
const Notebook = require('../models/Notebook');
const StudyPlan = require('../models/StudyPlan');
const StudyActivity = require('../models/StudyActivity');

// GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ plan: 'premium' });
    const totalDocuments = await Document.countDocuments();

    // Calculate total file size from DB documents
    const sizeResult = await Document.aggregate([
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
    ]);
    const rawStorageUsed = sizeResult[0]?.totalSize || 0;

    // Convert conversion rate
    const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0;

    // Get real LLM logs data
    const llmStats = await LlmLog.aggregate([
      { $group: { _id: null, totalTokens: { $sum: '$tokensUsed' }, totalCost: { $sum: '$cost' } } }
    ]);
    const tokensUsed = llmStats[0]?.totalTokens || 0;
    const llmCost = llmStats[0]?.totalCost || 0;

    // ── Weekly User Growth % ──
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - 6);
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const usersThisWeek = await User.countDocuments({ createdAt: { $gte: thisWeekStart } });
    const usersLastWeek = await User.countDocuments({
      createdAt: { $gte: lastWeekStart, $lt: thisWeekStart }
    });
    let userGrowthPercent = 0;
    if (usersLastWeek > 0) {
      userGrowthPercent = Math.round(((usersThisWeek - usersLastWeek) / usersLastWeek) * 100);
    } else if (usersThisWeek > 0) {
      userGrowthPercent = 100; // all new this week
    }

    // ── Generate 7 Days Stats for Charts & Sparklines ──
    const sevenDaysAgo = new Date(thisWeekStart);

    const dates = [];
    const dateLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
      dateLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    }

    // Group document uploads by day
    const uploadsGroup = await Document.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      }
    ]);

    // Group chat messages by day
    const chatsGroup = await ChatSession.aggregate([
      { $unwind: "$messages" },
      { $match: { "messages.timestamp": { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$messages.timestamp" } },
          count: { $sum: 1 }
        }
      }
    ]);

    // Group user registrations by day (for sparkline)
    const usersGroup = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      }
    ]);

    // Group LLM tokens by day (for sparkline)
    const llmDailyGroup = await LlmLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          tokens: { $sum: "$tokensUsed" }
        }
      }
    ]);

    // Group premium signups by day (for sparkline)
    const premiumGroup = await User.aggregate([
      { $match: { plan: 'premium', createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      }
    ]);

    // Group Gemini API tokens by model and day
    const llmLogsGroup = await LlmLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            model: "$modelName"
          },
          tokens: { $sum: "$tokensUsed" }
        }
      }
    ]);

    // Map to 7 days arrays
    const uploadsMap = {};
    uploadsGroup.forEach(g => { uploadsMap[g._id] = g.count; });

    const chatsMap = {};
    chatsGroup.forEach(g => { chatsMap[g._id] = g.count; });

    const usersMap = {};
    usersGroup.forEach(g => { usersMap[g._id] = g.count; });

    const tokensMap = {};
    llmDailyGroup.forEach(g => { tokensMap[g._id] = g.tokens; });

    const premiumMap = {};
    premiumGroup.forEach(g => { premiumMap[g._id] = g.count; });

    const flashMap = {};
    const proMap = {};
    llmLogsGroup.forEach(g => {
      const isPro = g._id.model && g._id.model.toLowerCase().includes('pro');
      if (isPro) {
        proMap[g._id.date] = (proMap[g._id.date] || 0) + g.tokens;
      } else {
        flashMap[g._id.date] = (flashMap[g._id.date] || 0) + g.tokens;
      }
    });

    const uploadsData = dates.map(day => uploadsMap[day] || 0);
    const chatsData = dates.map(day => chatsMap[day] || 0);
    const flashTokensData = dates.map(day => flashMap[day] || 0);
    const proTokensData = dates.map(day => proMap[day] || 0);

    // Sparkline daily arrays
    const dailyUsers = dates.map(day => usersMap[day] || 0);
    const dailyDocs = uploadsData; // reuse same data
    const dailyTokens = dates.map(day => tokensMap[day] || 0);
    const dailyPremium = dates.map(day => premiumMap[day] || 0);

    res.json({
      totalUsers,
      premiumUsers,
      conversionRate: parseFloat(conversionRate),
      totalDocuments,
      storageUsed: rawStorageUsed,
      tokensUsed,
      llmCost: parseFloat(llmCost.toFixed(4)),
      userGrowthPercent,
      sparklines: {
        users: dailyUsers,
        docs: dailyDocs,
        tokens: dailyTokens,
        premium: dailyPremium
      },
      charts: {
        labels: dateLabels,
        uploads: uploadsData,
        chats: chatsData,
        flashTokens: flashTokensData,
        proTokens: proTokensData
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/recent-documents
exports.getRecentDocuments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const query = {};
    if (status && status !== 'All') {
      query.status = status.toLowerCase();
    }

    const total = await Document.countDocuments(query);
    const documents = await Document.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      documents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const total = await User.countDocuments();
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/health
exports.getHealth = async (req, res, next) => {
  try {
    // 1. DB Latency Check (live ping)
    const dbStart = Date.now();
    await mongoose.connection.db.admin().ping();
    const dbLatency = Date.now() - dbStart;

    // 2. Gemini API Latency Check (live round-trip via listModels)
    let geminiStatus = 'error';
    let geminiLatency = 'N/A';
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiStart = Date.now();
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1`,
          {
            headers: {
              'x-goog-api-key': process.env.GEMINI_API_KEY
            }
          }
        );
        const elapsed = Date.now() - geminiStart;
        if (response.ok) {
          geminiStatus = 'operational';
          geminiLatency = `${elapsed}ms`;
        } else {
          geminiStatus = 'error';
          geminiLatency = `${elapsed}ms (HTTP ${response.status})`;
        }
      } catch (geminiErr) {
        geminiStatus = 'error';
        geminiLatency = 'unreachable';
      }
    }

    // 3. Real Disk Space Check (Native cross-platform fs.promises.statfs)
    let diskFreeBytes = 0;
    let diskTotalBytes = 0;
    try {
      const stats = await fs.promises.statfs(process.cwd());
      const freeBlocks = typeof stats.bavail === 'bigint' || typeof stats.bavail === 'number' ? stats.bavail : stats.bfree;
      diskTotalBytes = Number(stats.blocks) * Number(stats.bsize);
      diskFreeBytes = Number(freeBlocks) * Number(stats.bsize);
    } catch (diskErr) {
      diskFreeBytes = 0;
      diskTotalBytes = 0;
    }

    const formatBytes = (bytes) => {
      if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)} TB`;
      if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
      if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
      return `${bytes} B`;
    };

    const percentFree = diskTotalBytes > 0
      ? `${Math.round((diskFreeBytes / diskTotalBytes) * 100)}%`
      : 'N/A';
    const freeSpaceStr = diskFreeBytes > 0
      ? `${formatBytes(diskFreeBytes)} available`
      : 'Unknown';

    res.json({
      database: {
        status: 'connected',
        latency: `${dbLatency}ms`
      },
      geminiApi: {
        status: geminiStatus,
        latency: geminiLatency
      },
      storage: {
        status: diskFreeBytes > 0 ? 'healthy' : 'unknown',
        freeSpace: freeSpaceStr,
        percentFree
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/users
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, plan } = req.body;
    if (!name || !email || !password || typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc hợp lệ' });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      return res.status(400).json({ message: 'Tên và email không được để trống' });
    }

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const userRole = ['user', 'admin'].includes(role) ? role : 'user';
    const userPlan = ['free', 'premium'].includes(plan) ? plan : 'free';

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password,
      role: userRole,
      plan: userPlan
    });
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json({ message: 'Đã tạo người dùng thành công', user: userResponse });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:userId/role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ' });
    }

    if (userId === req.user._id.toString() && role === 'user') {
      return res.status(400).json({ message: 'Bạn không thể tự hạ quyền tài khoản của chính mình' });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.json({ message: 'Cập nhật vai trò thành công', user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:userId/plan
exports.updateUserPlan = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body;
    if (!['free', 'premium'].includes(plan)) {
      return res.status(400).json({ message: 'Gói dịch vụ không hợp lệ' });
    }
    const user = await User.findByIdAndUpdate(userId, { plan }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.json({ message: 'Cập nhật gói dịch vụ thành công', user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:userId/lock
exports.toggleUserLock = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isLocked } = req.body;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Bạn không thể tự khóa tài khoản của chính mình' });
    }

    const user = await User.findByIdAndUpdate(userId, { isLocked }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.json({ 
      message: user.isLocked ? 'Đã khóa tài khoản người dùng thành công' : 'Đã mở khóa tài khoản người dùng thành công', 
      user 
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/users/:userId
exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Bạn không thể xóa tài khoản của chính mình' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Clean up physical files and embeddings for all user documents
    const docs = await Document.find({ userId }).select('_id filePath').lean();
    for (const doc of docs) {
      if (doc.filePath && fs.existsSync(doc.filePath)) {
        try { fs.unlinkSync(doc.filePath); } catch (_) {}
      }
      try {
        await deleteDocumentChunks(doc._id);
      } catch (e) {
        console.warn('ChromaDB delete failed during user cleanup:', e.message);
      }
    }

    // Delete all entities associated with this user
    await Promise.all([
      Document.deleteMany({ userId }),
      ChatSession.deleteMany({ userId }),
      FlashcardSet.deleteMany({ userId }),
      Quiz.deleteMany({ userId }),
      Notebook.deleteMany({ userId }),
      StudyPlan.deleteMany({ userId }),
      StudyActivity.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    res.json({ message: 'Đã xóa người dùng và toàn bộ dữ liệu liên quan thành công' });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/documents/:id
exports.adminGetDocumentDetails = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id).populate('userId', 'name email');
    if (!doc) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }
    res.json({ document: doc });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/documents/:id
exports.adminDeleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }
    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }
    try {
      await deleteDocumentChunks(doc._id);
    } catch (e) {
      console.warn('ChromaDB delete failed:', e.message);
    }
    await Document.findByIdAndDelete(doc._id);
    res.json({ message: 'Đã xóa tài liệu thành công (Admin)' });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/payments
exports.getPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const payments = await Payment.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Payment.countDocuments();

    res.json({
      payments,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/logs
exports.getLlmLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const logs = await LlmLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await LlmLog.countDocuments();

    res.json({
      logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/plans
exports.getAdminPlans = async (req, res, next) => {
  try {
    const plans = await PricingPlan.find().sort({ price: 1 });
    res.json({ plans });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/plans
exports.createPlan = async (req, res, next) => {
  try {
    const { name, code, price, durationMonths, description, features, isActive } = req.body;
    
    if (!name || !code || price === undefined || !durationMonths) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    const existingPlan = await PricingPlan.findOne({ code: code.toLowerCase() });
    if (existingPlan) {
      return res.status(400).json({ message: 'Mã gói này đã tồn tại' });
    }

    const plan = await PricingPlan.create({
      name,
      code: code.toLowerCase(),
      price,
      durationMonths,
      description: description || '',
      features: features || [],
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ message: 'Đã tạo gói dịch vụ thành công', plan });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/plans/:id
exports.updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, price, durationMonths, description, features, isActive } = req.body;

    const plan = await PricingPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ message: 'Không tìm thấy gói dịch vụ' });
    }

    if (code && code.toLowerCase() !== plan.code) {
      const existing = await PricingPlan.findOne({ code: code.toLowerCase() });
      if (existing) {
        return res.status(400).json({ message: 'Mã gói mới đã tồn tại' });
      }
      plan.code = code.toLowerCase();
    }

    if (name) plan.name = name;
    if (price !== undefined) plan.price = price;
    if (durationMonths) plan.durationMonths = durationMonths;
    if (description !== undefined) plan.description = description;
    if (features) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;

    await plan.save();
    res.json({ message: 'Cập nhật gói dịch vụ thành công', plan });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/api-config
exports.updateApiConfig = async (req, res, next) => {
  try {
    const { defaultModel, temperature, maxTokens, safetyLevel } = req.body;
    
    // Security: Do NOT allow API key changes via HTTP requests.
    // API keys must be managed via environment variables on the server.
    if (defaultModel) {
      process.env.GEMINI_DEFAULT_MODEL = defaultModel;
    }

    res.json({ 
      message: 'Cấu hình LLM đã được cập nhật thành công',
      config: {
        defaultModel: defaultModel || process.env.GEMINI_DEFAULT_MODEL || 'gemini-1.5-flash',
        temperature: temperature !== undefined ? temperature : 0.7,
        maxTokens: maxTokens || 2048,
        safetyLevel: safetyLevel || 'medium'
      }
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/plans/:id
exports.deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await PricingPlan.findByIdAndDelete(id);
    if (!plan) {
      return res.status(404).json({ message: 'Không tìm thấy gói dịch vụ' });
    }
    res.json({ message: 'Đã xóa gói dịch vụ thành công' });
  } catch (err) {
    next(err);
  }
};

