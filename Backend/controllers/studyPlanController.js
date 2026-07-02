const StudyPlan = require('../models/StudyPlan');
const StudyActivity = require('../models/StudyActivity');
const Document = require('../models/Document');
const { generateStudyPlanAI, getTodayString, calculateStreak } = require('../services/studyPlanService');

// POST /api/study-plan/generate
exports.generatePlan = async (req, res, next) => {
  try {
    const { documentIds, targetDate, dailyHours, title } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 tài liệu' });
    }

    if (!targetDate) {
      return res.status(400).json({ message: 'Vui lòng chọn ngày mục tiêu' });
    }

    // Fetch documents
    const documents = await Document.find({
      _id: { $in: documentIds },
      userId: req.user._id,
    }).select('title');

    if (documents.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    const target = new Date(targetDate);
    const today = new Date();
    const totalDays = Math.max(1, Math.ceil((target - today) / (1000 * 60 * 60 * 24)));
    const hours = parseFloat(dailyHours) || 2;

    // Generate AI study plan
    const documentTitles = documents.map((d) => d.title);
    const aiPlan = await generateStudyPlanAI(documentTitles, totalDays, hours);

    // Build daily plan with actual dates
    const dailyPlan = aiPlan.map((day, index) => {
      const dayDate = new Date(today);
      dayDate.setDate(dayDate.getDate() + index);

      return {
        day: day.day || index + 1,
        date: dayDate.toISOString().split('T')[0],
        tasks: (day.tasks || []).map((task) => ({
          type: task.type || 'read',
          documentId: documents[Math.min(task.documentIndex || 0, documents.length - 1)]._id,
          description: task.description,
          duration: task.duration || 30,
          completed: false,
        })),
        completed: false,
      };
    });

    const studyPlan = await StudyPlan.create({
      userId: req.user._id,
      title: title || `Kế hoạch học tập - ${documentTitles.join(', ')}`,
      documents: documentIds,
      targetDate: target,
      dailyHours: hours,
      dailyPlan,
      progress: 0,
      status: 'active',
    });

    res.status(201).json({ studyPlan });
  } catch (error) {
    next(error);
  }
};

// GET /api/study-plan
exports.getPlans = async (req, res, next) => {
  try {
    const plans = await StudyPlan.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('documents', 'title');

    res.json({ studyPlans: plans });
  } catch (error) {
    next(error);
  }
};

// GET /api/study-plan/:id
exports.getPlan = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('documents', 'title');

    if (!plan) {
      return res.status(404).json({ message: 'Không tìm thấy kế hoạch' });
    }

    res.json({ studyPlan: plan });
  } catch (error) {
    next(error);
  }
};

// PUT /api/study-plan/:id/task
exports.toggleTask = async (req, res, next) => {
  try {
    const { dayIndex, taskIndex } = req.body;

    const plan = await StudyPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!plan) {
      return res.status(404).json({ message: 'Không tìm thấy kế hoạch' });
    }

    if (dayIndex < 0 || dayIndex >= plan.dailyPlan.length) {
      return res.status(400).json({ message: 'Day index không hợp lệ' });
    }

    const day = plan.dailyPlan[dayIndex];
    if (taskIndex < 0 || taskIndex >= day.tasks.length) {
      return res.status(400).json({ message: 'Task index không hợp lệ' });
    }

    // Toggle task completion
    day.tasks[taskIndex].completed = !day.tasks[taskIndex].completed;

    // Check if all tasks in day are completed
    day.completed = day.tasks.every((t) => t.completed);

    // Recalculate overall progress
    const totalTasks = plan.dailyPlan.reduce((sum, d) => sum + d.tasks.length, 0);
    const completedTasks = plan.dailyPlan.reduce((sum, d) => sum + d.tasks.filter((t) => t.completed).length, 0);
    plan.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    if (plan.progress === 100) {
      plan.status = 'completed';
    }

    await plan.save();

    res.json({ studyPlan: plan });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/study-plan/:id
exports.deletePlan = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!plan) {
      return res.status(404).json({ message: 'Không tìm thấy kế hoạch' });
    }

    res.json({ message: 'Đã xóa kế hoạch học tập' });
  } catch (error) {
    next(error);
  }
};

// POST /api/study-plan/activity
exports.logActivity = async (req, res, next) => {
  try {
    const { type, duration, documentId, metadata } = req.body;
    const today = getTodayString();

    let activity = await StudyActivity.findOne({
      userId: req.user._id,
      date: today,
    });

    if (!activity) {
      activity = await StudyActivity.create({
        userId: req.user._id,
        date: today,
        activities: [],
        totalMinutes: 0,
      });
    }

    activity.activities.push({
      type,
      duration: duration || 0,
      documentId,
      metadata: metadata || {},
      timestamp: new Date(),
    });

    activity.totalMinutes = activity.activities.reduce((sum, a) => sum + (a.duration || 0), 0);
    await activity.save();

    res.json({ activity });
  } catch (error) {
    next(error);
  }
};

// GET /api/study-plan/streak
exports.getStreak = async (req, res, next) => {
  try {
    const { syncActivitiesFromEntities } = require('../services/activityService');
    await syncActivitiesFromEntities(req.user._id);

    // Get last 365 days of activities
    const activities = await StudyActivity.find({
      userId: req.user._id,
    })
      .sort({ date: -1 })
      .limit(365)
      .select('date totalMinutes');

    const streak = calculateStreak(activities);

    // Get longest streak
    let longestStreak = 0;
    let currentStreak = 0;
    const sorted = [...activities].sort((a, b) => a.date.localeCompare(b.date));

    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prev = new Date(sorted[i - 1].date);
        const curr = new Date(sorted[i].date);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    }

    const totalMinutes = activities.reduce((sum, a) => sum + a.totalMinutes, 0);

    res.json({
      currentStreak: streak,
      longestStreak,
      totalStudyDays: activities.length,
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      recentActivity: activities.slice(0, 30),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/study-plan/heatmap
exports.getHeatmap = async (req, res, next) => {
  try {
    const { syncActivitiesFromEntities } = require('../services/activityService');
    await syncActivitiesFromEntities(req.user._id);

    const activities = await StudyActivity.find({
      userId: req.user._id,
    })
      .sort({ date: -1 })
      .limit(365)
      .select('date totalMinutes activities');

    const heatmapData = activities.map((a) => ({
      date: a.date,
      totalMinutes: a.totalMinutes,
      count: a.activities.length,
      level: a.totalMinutes > 120 ? 4 : a.totalMinutes > 60 ? 3 : a.totalMinutes > 30 ? 2 : a.totalMinutes > 0 ? 1 : 0,
    }));

    res.json({ heatmap: heatmapData });
  } catch (error) {
    next(error);
  }
};

// GET /api/study-plan/sr-dashboard
exports.getSRDashboard = async (req, res, next) => {
  try {
    const FlashcardSet = require('../models/FlashcardSet');
    const sets = await FlashcardSet.find({ userId: req.user._id });

    const now = new Date();
    let totalCards = 0;
    let dueToday = 0;
    let newCards = 0;
    let learningCards = 0;
    let matureCards = 0;
    let totalReviews = 0;

    sets.forEach((set) => {
      set.cards.forEach((card) => {
        totalCards++;
        totalReviews += card.repetitions;

        if (card.repetitions === 0) {
          newCards++;
        } else if (card.interval < 21) {
          learningCards++;
        } else {
          matureCards++;
        }

        if (new Date(card.nextReview) <= now) {
          dueToday++;
        }
      });
    });

    res.json({
      totalCards,
      dueToday,
      distribution: {
        new: newCards,
        learning: learningCards,
        mature: matureCards,
      },
      totalReviews,
      totalSets: sets.length,
      averageEaseFactor: totalCards > 0
        ? Math.round(sets.reduce((sum, set) => sum + set.cards.reduce((s, c) => s + c.easeFactor, 0), 0) / totalCards * 100) / 100
        : 2.5,
    });
  } catch (error) {
    next(error);
  }
};
