const StudyActivity = require('../models/StudyActivity');
const { getTodayString } = require('./studyPlanService');

// In-memory cache for tracking last sync time per user (cooldown: 10 minutes)
const _syncCache = new Map();
const SYNC_COOLDOWN_MS = 10 * 60 * 1000;

const formatDateVN = (date) => {
  if (!date) return getTodayString();
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(date));
};

/**
 * Record a user study activity
 * @param {string|ObjectId} userId
 * @param {'document_view'|'flashcard_review'|'quiz_complete'|'chat_message'|'study_plan'|'notebook_generation'} type
 * @param {number} duration - duration in minutes
 * @param {string|ObjectId|null} documentId
 * @param {object} metadata
 */
const recordActivity = async (userId, type, duration = 0, documentId = null, metadata = {}) => {
  try {
    const today = getTodayString();
    
    const durationNum = Number(duration) || 0;
    const activityItem = {
      type,
      duration: durationNum,
      documentId: documentId || undefined,
      metadata: metadata || {},
      timestamp: new Date(),
    };

    const activity = await StudyActivity.findOneAndUpdate(
      { userId, date: today },
      {
        $push: { activities: activityItem },
        $inc: { totalMinutes: durationNum },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return activity;
  } catch (error) {
    console.error('Error in recordActivity:', error);
  }
};

/**
 * Scan existing database entities and populate historical StudyActivity records.
 * Uses a 10-minute cooldown to prevent database hammering on high-frequency requests.
 * Preserves user-recorded live activity and never destructively overwrites real minutes.
 * @param {string|ObjectId} userId
 */
const syncActivitiesFromEntities = async (userId) => {
  try {
    const userKey = String(userId);
    const now = Date.now();
    const lastSync = _syncCache.get(userKey);

    if (lastSync && (now - lastSync) < SYNC_COOLDOWN_MS) {
      return; // Skip sync, cooldown active
    }

    const Document = require('../models/Document');
    const FlashcardSet = require('../models/FlashcardSet');
    const Quiz = require('../models/Quiz');
    const ChatSession = require('../models/ChatSession');

    // Key: YYYY-MM-DD, Value: { totalMinutes, activities: [] }
    const dailyData = {};

    const addDuration = (dateStr, type, duration, documentId, metadata) => {
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          totalMinutes: 0,
          activities: [],
        };
      }
      dailyData[dateStr].totalMinutes += duration;
      dailyData[dateStr].activities.push({
        type,
        duration,
        documentId: documentId || undefined,
        metadata: metadata || {},
        timestamp: new Date(dateStr),
      });
    };

    // 1. Process Documents
    const docs = await Document.find({ userId });
    for (const doc of docs) {
      const dateStr = formatDateVN(doc.createdAt);
      const duration = Math.max(5, Math.min(30, (doc.pageCount || 1) * 3));
      addDuration(dateStr, 'document_view', duration, doc._id, { title: doc.title, isUpload: true });
    }

    // 2. Process FlashcardSets
    const sets = await FlashcardSet.find({ userId });
    for (const set of sets) {
      const dateStr = formatDateVN(set.createdAt);
      addDuration(dateStr, 'flashcard_review', 10, set.documentId, { title: set.title, isCreation: true });

      if (set.totalReviews > 0) {
        const updateDateStr = formatDateVN(set.updatedAt);
        const reviewDuration = Math.min(30, set.totalReviews * 2);
        addDuration(updateDateStr, 'flashcard_review', reviewDuration, set.documentId, { title: set.title, reviews: set.totalReviews });
      }
    }

    // 3. Process Quizzes
    const quizzes = await Quiz.find({ userId, status: 'completed' });
    for (const quiz of quizzes) {
      const completedDate = quiz.result?.completedAt || quiz.updatedAt || quiz.createdAt;
      const dateStr = formatDateVN(completedDate);
      const duration = Math.max(5, Math.ceil((quiz.result?.timeSpent || 600) / 60));
      addDuration(dateStr, 'quiz_complete', duration, quiz.documentId, { title: quiz.title, score: quiz.result?.score });
    }

    // 4. Process ChatSession messages
    const chatSessions = await ChatSession.find({ userId });
    for (const session of chatSessions) {
      for (const msg of session.messages) {
        if (msg.role === 'user') {
          const msgDate = msg.timestamp || session.createdAt;
          const dateStr = formatDateVN(msgDate);
          addDuration(dateStr, 'chat_message', 3, session.documentId, { title: session.title });
        }
      }
    }

    // 5. Save all aggregated data to StudyActivity safely (merge, never destroy)
    for (const [date, data] of Object.entries(dailyData)) {
      const totalMins = Math.min(480, data.totalMinutes); // cap at 8 hours max per day
      
      const existing = await StudyActivity.findOne({ userId, date });
      if (existing) {
        if (existing.totalMinutes < totalMins) {
          await StudyActivity.updateOne(
            { _id: existing._id },
            { $set: { totalMinutes: totalMins } }
          );
        }
      } else {
        await StudyActivity.create({
          userId,
          date,
          activities: data.activities.slice(0, 100),
          totalMinutes: totalMins,
        });
      }
    }

    // Update cache timestamp after successful sync
    _syncCache.set(userKey, now);
  } catch (error) {
    console.error('Error in syncActivitiesFromEntities:', error);
  }
};

module.exports = {
  recordActivity,
  syncActivitiesFromEntities,
};
