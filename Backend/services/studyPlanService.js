const { generateContent } = require('../config/gemini');
const PREMIUM_PROMPTS = require('../utils/premiumPromptTemplates');

/**
 * Generate AI study plan
 */
const generateStudyPlanAI = async (documentTitles, totalDays, dailyHours) => {
  const response = await generateContent(
    PREMIUM_PROMPTS.STUDY_PLAN(documentTitles, totalDays, dailyHours)
  );

  try {
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const plan = JSON.parse(cleaned);
    if (!Array.isArray(plan)) throw new Error('Not an array');
    return plan;
  } catch (err) {
    console.error('Study plan parse error:', err.message);
    throw new Error('Không thể tạo kế hoạch học tập. Vui lòng thử lại.');
  }
};

/**
 * Get today's date string in YYYY-MM-DD format
 */
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Calculate streak from activity records
 */
const calculateStreak = (activities) => {
  if (!activities || activities.length === 0) return 0;

  // Filter out days with 0 minutes of study time
  const activeActivities = activities.filter((a) => a.totalMinutes > 0);
  if (activeActivities.length === 0) return 0;

  // Sort by date descending
  const sorted = [...activeActivities].sort((a, b) => b.date.localeCompare(a.date));
  const today = getTodayString();

  let streak = 0;
  let checkDate = new Date(today);
  let retriedToday = false;

  for (let i = 0; i < sorted.length; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];

    if (sorted.find((a) => a.date === dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0 && dateStr === today && !retriedToday) {
      // Today hasn't been logged yet, check yesterday (only once)
      retriedToday = true;
      checkDate.setDate(checkDate.getDate() - 1);
      i--; // Retry with yesterday
    } else {
      break;
    }
  }

  return streak;
};

module.exports = { generateStudyPlanAI, getTodayString, calculateStreak };
