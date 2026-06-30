const Quiz = require('../models/Quiz');
const Document = require('../models/Document');
const { parsePDF, cleanText } = require('../services/pdfService');
const { generateQuiz } = require('../services/quizService');
const { generateContent } = require('../config/gemini');
const PREMIUM_PROMPTS = require('../utils/premiumPromptTemplates');
const { chunkText } = require('../utils/chunker');

// POST /api/quiz/generate/:documentId
exports.generateFromDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.documentId,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    const { text } = await parsePDF(document.filePath);
    const cleaned = cleanText(text);
    const count = parseInt(req.body.count) || 10;
    const difficulty = req.body.difficulty || 'mixed';
    const questionTypes = req.body.questionTypes || ['mcq'];
    const timerMode = req.body.timerMode || 'none';
    const timeLimit = parseInt(req.body.timeLimit) || 0;

    let questions;

    // Premium multi-type quiz
    const hasPremiumTypes = questionTypes.some((t) => ['fill_blank', 'true_false', 'short_answer'].includes(t));
    if (hasPremiumTypes && req.user.plan === 'premium') {
      questions = await generateMultiTypeQuiz(cleaned, count, difficulty, questionTypes);
    } else {
      questions = await generateQuiz(cleaned, count, difficulty);
    }

    const quiz = await Quiz.create({
      userId: req.user._id,
      documentId: document._id,
      title: `Quiz - ${document.title}`,
      difficulty,
      questionTypes: hasPremiumTypes ? questionTypes : ['mcq'],
      timerMode: req.user.plan === 'premium' ? timerMode : 'none',
      timeLimit: req.user.plan === 'premium' ? timeLimit : 0,
      questions,
      result: { score: null, total: questions.length, answers: [] },
    });

    res.status(201).json({ quiz });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate multi-type quiz questions (premium)
 */
async function generateMultiTypeQuiz(text, count, difficulty, types) {
  let contentForQuiz = text;
  if (text.length > 10000) {
    const chunks = chunkText(text, { chunkSize: 3000, overlap: 100 });
    const step = Math.max(1, Math.floor(chunks.length / 3));
    const selectedChunks = chunks.filter((_, i) => i % step === 0).slice(0, 3);
    contentForQuiz = selectedChunks.map((c) => c.text).join('\n\n---\n\n');
  }

  const response = await generateContent(PREMIUM_PROMPTS.MULTI_TYPE_QUIZ(contentForQuiz, count, difficulty, types));

  try {
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const questions = JSON.parse(cleaned);
    if (!Array.isArray(questions)) throw new Error('Not an array');

    return questions.map((q) => ({
      type: ['mcq', 'fill_blank', 'true_false', 'short_answer'].includes(q.type) ? q.type : 'mcq',
      question: q.question || '',
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
      blankAnswer: q.blankAnswer || '',
      correctBoolean: typeof q.correctBoolean === 'boolean' ? q.correctBoolean : null,
      shortAnswer: q.shortAnswer || '',
      explanation: q.explanation || '',
      topic: q.topic || '',
    }));
  } catch (err) {
    console.error('Multi-type quiz parse error:', err.message);
    throw new Error('Không thể tạo câu hỏi. Vui lòng thử lại.');
  }
}

// GET /api/quiz
exports.getQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('documentId', 'title')
      .select('-questions.correctAnswer -questions.explanation -questions.blankAnswer -questions.correctBoolean -questions.shortAnswer');

    res.json({ quizzes });
  } catch (error) {
    next(error);
  }
};

// GET /api/quiz/:id
exports.getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('documentId', 'title');

    if (!quiz) {
      return res.status(404).json({ message: 'Không tìm thấy bài quiz' });
    }

    // If not completed, hide answers
    if (quiz.status !== 'completed') {
      const sanitized = quiz.toObject();
      sanitized.questions = sanitized.questions.map((q) => ({
        question: q.question,
        type: q.type || 'mcq',
        options: q.options,
        topic: q.topic,
      }));
      return res.json({ quiz: sanitized });
    }

    res.json({ quiz });
  } catch (error) {
    next(error);
  }
};

// POST /api/quiz/:id/submit
exports.submitQuiz = async (req, res, next) => {
  try {
    const { answers, timeSpent } = req.body;

    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Không tìm thấy bài quiz' });
    }

    if (quiz.status === 'completed') {
      return res.status(400).json({ message: 'Bài quiz đã được nộp' });
    }

    // Calculate score based on question types
    let score = 0;
    quiz.questions.forEach((q, index) => {
      const userAnswer = answers[index];
      const qType = q.type || 'mcq';

      if (qType === 'mcq') {
        if (userAnswer === q.correctAnswer) score++;
      } else if (qType === 'true_false') {
        if (userAnswer === q.correctBoolean) score++;
      } else if (qType === 'fill_blank') {
        if (String(userAnswer || '').toLowerCase().trim() === String(q.blankAnswer || '').toLowerCase().trim()) score++;
      } else if (qType === 'short_answer') {
        // Simplified check — exact match or close enough
        const user = String(userAnswer || '').toLowerCase().trim();
        const correct = String(q.shortAnswer || '').toLowerCase().trim();
        if (user === correct || correct.includes(user) || user.includes(correct)) score++;
      }
    });

    quiz.result = {
      score,
      total: quiz.questions.length,
      answers,
      timeSpent: timeSpent || 0,
      completedAt: new Date(),
    };
    quiz.status = 'completed';

    // Calculate adaptive score for premium
    quiz.adaptiveScore = Math.round((score / quiz.questions.length) * 100);

    await quiz.save();

    res.json({
      result: quiz.result,
      questions: quiz.questions,
      adaptiveScore: quiz.adaptiveScore,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/quiz/:id/retake (premium)
exports.retakeQuiz = async (req, res, next) => {
  try {
    const originalQuiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'completed',
    });

    if (!originalQuiz) {
      return res.status(404).json({ message: 'Không tìm thấy bài quiz đã hoàn thành' });
    }

    const document = await Document.findById(originalQuiz.documentId);
    if (!document) {
      return res.status(404).json({ message: 'Tài liệu gốc không còn tồn tại' });
    }

    const { text } = await parsePDF(document.filePath);
    const cleaned = cleanText(text);
    const count = originalQuiz.questions.length;

    // Determine adaptive difficulty
    let difficulty = originalQuiz.difficulty;
    if (originalQuiz.adaptiveScore !== null) {
      if (originalQuiz.adaptiveScore > 80) difficulty = 'hard';
      else if (originalQuiz.adaptiveScore < 50) difficulty = 'easy';
    }

    let questions;
    const hasPremiumTypes = originalQuiz.questionTypes.some((t) => t !== 'mcq');
    if (hasPremiumTypes) {
      questions = await generateMultiTypeQuiz(cleaned, count, difficulty, originalQuiz.questionTypes);
    } else {
      questions = await generateQuiz(cleaned, count, difficulty);
    }

    const newQuiz = await Quiz.create({
      userId: req.user._id,
      documentId: document._id,
      title: `Retake - ${document.title}`,
      difficulty,
      questionTypes: originalQuiz.questionTypes,
      timerMode: originalQuiz.timerMode,
      timeLimit: originalQuiz.timeLimit,
      questions,
      result: { score: null, total: questions.length, answers: [] },
      parentQuizId: originalQuiz._id,
    });

    res.status(201).json({ quiz: newQuiz, adaptedDifficulty: difficulty });
  } catch (error) {
    next(error);
  }
};

// GET /api/quiz/analytics (premium)
exports.getQuizAnalytics = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({
      userId: req.user._id,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .populate('documentId', 'title');

    if (quizzes.length === 0) {
      return res.json({ analytics: null, message: 'Chưa có dữ liệu quiz' });
    }

    // Average score over time
    const scoreOverTime = quizzes.map((q) => ({
      date: q.result.completedAt || q.updatedAt,
      score: q.result.total > 0 ? Math.round((q.result.score / q.result.total) * 100) : 0,
      title: q.title,
      difficulty: q.difficulty,
    }));

    // Performance by topic
    const topicPerformance = {};
    quizzes.forEach((quiz) => {
      quiz.questions.forEach((q, idx) => {
        const topic = q.topic || 'Chung';
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = { correct: 0, total: 0 };
        }
        topicPerformance[topic].total++;

        const userAnswer = quiz.result.answers[idx];
        const qType = q.type || 'mcq';
        if (qType === 'mcq' && userAnswer === q.correctAnswer) topicPerformance[topic].correct++;
        else if (qType === 'true_false' && userAnswer === q.correctBoolean) topicPerformance[topic].correct++;
        else if (qType === 'fill_blank' && String(userAnswer || '').toLowerCase().trim() === String(q.blankAnswer || '').toLowerCase().trim()) topicPerformance[topic].correct++;
      });
    });

    const topicData = Object.entries(topicPerformance).map(([topic, stats]) => ({
      topic,
      accuracy: Math.round((stats.correct / stats.total) * 100),
      totalQuestions: stats.total,
      correctAnswers: stats.correct,
    }));

    // Average score
    const avgScore = Math.round(
      quizzes.reduce((sum, q) => sum + (q.result.total > 0 ? (q.result.score / q.result.total) * 100 : 0), 0) / quizzes.length
    );

    // Improvement trend
    const recentAvg = scoreOverTime.length >= 5
      ? Math.round(scoreOverTime.slice(0, 5).reduce((s, q) => s + q.score, 0) / 5)
      : avgScore;
    const olderAvg = scoreOverTime.length >= 10
      ? Math.round(scoreOverTime.slice(5, 10).reduce((s, q) => s + q.score, 0) / Math.min(5, scoreOverTime.length - 5))
      : avgScore;

    res.json({
      analytics: {
        totalQuizzes: quizzes.length,
        averageScore: avgScore,
        scoreOverTime,
        topicPerformance: topicData,
        improvement: recentAvg - olderAvg,
        bestTopic: topicData.sort((a, b) => b.accuracy - a.accuracy)[0] || null,
        worstTopic: topicData.sort((a, b) => a.accuracy - b.accuracy)[0] || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/quiz/:id
exports.deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Không tìm thấy bài quiz' });
    }

    res.json({ message: 'Đã xóa bài quiz' });
  } catch (error) {
    next(error);
  }
};
