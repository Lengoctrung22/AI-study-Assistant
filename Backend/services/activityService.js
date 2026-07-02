const StudyActivity = require('../models/StudyActivity');
const { getTodayString } = require('./studyPlanService');

/**
 * Record a user study activity
 * @param {string|ObjectId} userId
 * @param {'document_view'|'flashcard_review'|'quiz_complete'|'chat_message'|'study_plan'} type
 * @param {number} duration - duration in minutes
 * @param {string|ObjectId|null} documentId
 * @param {object} metadata
 */
const recordActivity = async (userId, type, duration = 0, documentId = null, metadata = {}) => {
  try {
    const today = getTodayString();
    
    // Find or create activity document for this user on this day
    let activity = await StudyActivity.findOne({
      userId,
      date: today,
    });

    if (!activity) {
      activity = new StudyActivity({
        userId,
        date: today,
        activities: [],
        totalMinutes: 0,
      });
    }

    // Add activity entry
    activity.activities.push({
      type,
      duration: duration || 0,
      documentId: documentId || undefined,
      metadata: metadata || {},
      timestamp: new Date(),
    });

    // Update totalMinutes
    activity.totalMinutes = activity.activities.reduce((sum, act) => sum + (act.duration || 0), 0);

    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error in recordActivity:', error);
  }
};

/**
 * Synchronize study activities from existing database entities (Documents, Flashcards, Quizzes, Chats)
 * @param {string|ObjectId} userId
 */
const syncActivitiesFromEntities = async (userId) => {
  try {
    const Document = require('../models/Document');
    const FlashcardSet = require('../models/FlashcardSet');
    const Quiz = require('../models/Quiz');
    const ChatSession = require('../models/ChatSession');
    const StudyActivity = require('../models/StudyActivity');

    // Object to hold aggregated minutes per date: { "YYYY-MM-DD": { totalMinutes: 0, activities: [] } }
    const dailyData = {};

    const addDuration = (dateStr, type, duration, documentId, metadata) => {
      if (!dateStr) return;
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
      const dateStr = doc.createdAt.toISOString().split('T')[0];
      const duration = Math.max(5, Math.min(30, (doc.pageCount || 1) * 3));
      addDuration(dateStr, 'document_view', duration, doc._id, { title: doc.title, isUpload: true });
    }

    // 2. Process FlashcardSets
    const sets = await FlashcardSet.find({ userId });
    for (const set of sets) {
      const dateStr = set.createdAt.toISOString().split('T')[0];
      addDuration(dateStr, 'flashcard_review', 10, set.documentId, { title: set.title, isCreation: true });

      if (set.totalReviews > 0) {
        const updateDateStr = set.updatedAt.toISOString().split('T')[0];
        const reviewDuration = Math.min(30, set.totalReviews * 2);
        addDuration(updateDateStr, 'flashcard_review', reviewDuration, set.documentId, { title: set.title, reviews: set.totalReviews });
      }
    }

    // 3. Process Quizzes
    const quizzes = await Quiz.find({ userId, status: 'completed' });
    for (const quiz of quizzes) {
      const completedDate = quiz.result?.completedAt || quiz.updatedAt || quiz.createdAt;
      const dateStr = completedDate.toISOString().split('T')[0];
      const duration = Math.max(5, Math.ceil((quiz.result?.timeSpent || 600) / 60));
      addDuration(dateStr, 'quiz_complete', duration, quiz.documentId, { title: quiz.title, score: quiz.result?.score });
    }

    // 4. Process ChatSession messages
    const chatSessions = await ChatSession.find({ userId });
    for (const session of chatSessions) {
      for (const msg of session.messages) {
        if (msg.role === 'user') {
          const msgDate = msg.timestamp || session.createdAt;
          const dateStr = msgDate.toISOString().split('T')[0];
          addDuration(dateStr, 'chat_message', 3, session.documentId, { title: session.title });
        }
      }
    }

    // 5. Save all aggregated data to StudyActivity (upsert)
    for (const [date, data] of Object.entries(dailyData)) {
      const totalMins = Math.min(480, data.totalMinutes); // cap at 8 hours max per day
      
      await StudyActivity.findOneAndUpdate(
        { userId, date },
        {
          $set: {
            activities: data.activities.slice(0, 100),
            totalMinutes: totalMins,
          },
        },
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    console.error('Error in syncActivitiesFromEntities:', error);
  }
};

module.exports = {
  recordActivity,
  syncActivitiesFromEntities,
};
