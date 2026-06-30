const User = require('../models/User');
const Document = require('../models/Document');
const mongoose = require('mongoose');
const { execSync } = require('child_process');

const LlmLog = require('../models/LlmLog');
const ChatSession = require('../models/ChatSession');

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
      .limit(limit);

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
      .limit(limit);

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
          `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}&pageSize=1`
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

    // 3. Real Disk Space Check
    let diskFreeBytes = 0;
    let diskTotalBytes = 0;
    try {
      // Works on Windows (where the app is hosted)
      const output = execSync(
        'wmic logicaldisk where "DeviceID=\'E:\'" get FreeSpace,Size /format:csv',
        { encoding: 'utf-8', timeout: 5000 }
      ).trim();
      // Parse CSV: Node,FreeSpace,Size
      const lines = output.split('\n').filter(l => l.trim());
      const lastLine = lines[lines.length - 1].trim();
      const parts = lastLine.split(',');
      if (parts.length >= 3) {
        diskFreeBytes = parseInt(parts[1]) || 0;
        diskTotalBytes = parseInt(parts[2]) || 0;
      }
    } catch (diskErr) {
      // Fallback: try cross-platform df approach or just report unknown
      try {
        const output = execSync('df -B1 / | tail -1', { encoding: 'utf-8', timeout: 5000 }).trim();
        const parts = output.split(/\s+/);
        diskTotalBytes = parseInt(parts[1]) || 0;
        diskFreeBytes = parseInt(parts[3]) || 0;
      } catch (_) {
        // Could not determine disk space
      }
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
