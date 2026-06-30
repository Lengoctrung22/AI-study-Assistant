const Document = require('../models/Document');
const { parsePDF, cleanText } = require('../services/pdfService');
const {
  generateMindMap,
  generateConcepts,
  generateMultiLevelSummary,
  generateAnalytics,
  generateGlossary,
} = require('../services/premiumAIService');

// POST /api/premium/documents/:id/mindmap
exports.generateMindMap = async (req, res, next) => {
  try {
    req.body = req.body || {};
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    // Return cached if available and not forcing regeneration
    if (document.mindMap && !req.body.regenerate) {
      return res.json({ mindMap: document.mindMap, cached: true });
    }

    const { text } = await parsePDF(document.filePath);
    const cleaned = cleanText(text);
    const mindMap = await generateMindMap(cleaned);

    document.mindMap = mindMap;
    await document.save();

    res.json({ mindMap, cached: false });
  } catch (error) {
    next(error);
  }
};

// POST /api/premium/documents/:id/concepts
exports.generateConcepts = async (req, res, next) => {
  try {
    req.body = req.body || {};
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    if (document.concepts && !req.body.regenerate) {
      return res.json({ concepts: document.concepts, cached: true });
    }

    const { text } = await parsePDF(document.filePath);
    const cleaned = cleanText(text);
    const concepts = await generateConcepts(cleaned);

    document.concepts = concepts;
    await document.save();

    res.json({ concepts, cached: false });
  } catch (error) {
    next(error);
  }
};

// POST /api/premium/documents/:id/multi-summary
exports.generateMultiLevelSummary = async (req, res, next) => {
  try {
    req.body = req.body || {};
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    const requestedLevel = req.body.level;
    // If requesting a specific level and it's cached
    if (requestedLevel && document.multiLevelSummary && document.multiLevelSummary[requestedLevel] && !req.body.regenerate) {
      return res.json({
        multiLevelSummary: { [requestedLevel]: document.multiLevelSummary[requestedLevel] },
        cached: true,
      });
    }

    // If all levels are cached
    if (document.multiLevelSummary && Object.keys(document.multiLevelSummary).length === 5 && !req.body.regenerate) {
      return res.json({ multiLevelSummary: document.multiLevelSummary, cached: true });
    }

    const { text } = await parsePDF(document.filePath);
    const cleaned = cleanText(text);

    const levels = requestedLevel ? [requestedLevel] : ['child', 'high_school', 'undergraduate', 'graduate', 'expert'];
    const summaries = await generateMultiLevelSummary(cleaned, levels);

    // Merge with existing cache
    document.multiLevelSummary = {
      ...(document.multiLevelSummary || {}),
      ...summaries,
    };
    await document.save();

    res.json({ multiLevelSummary: summaries, cached: false });
  } catch (error) {
    next(error);
  }
};

// POST /api/premium/documents/:id/analytics
exports.generateDocumentAnalytics = async (req, res, next) => {
  try {
    req.body = req.body || {};
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    if (document.analytics && !req.body.regenerate) {
      return res.json({ analytics: document.analytics, cached: true });
    }

    const { text } = await parsePDF(document.filePath);
    const cleaned = cleanText(text);
    const analytics = await generateAnalytics(cleaned);

    document.analytics = analytics;
    await document.save();

    res.json({ analytics, cached: false });
  } catch (error) {
    next(error);
  }
};

// POST /api/premium/documents/:id/glossary
exports.generateGlossary = async (req, res, next) => {
  try {
    req.body = req.body || {};
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    if (document.glossary && document.glossary.length > 0 && !req.body.regenerate) {
      return res.json({ glossary: document.glossary, cached: true });
    }

    const { text } = await parsePDF(document.filePath);
    const cleaned = cleanText(text);
    const glossary = await generateGlossary(cleaned);

    document.glossary = glossary;
    await document.save();

    res.json({ glossary, cached: false });
  } catch (error) {
    next(error);
  }
};

// GET /api/premium/analytics/weak-areas
exports.getWeakAreas = async (req, res, next) => {
  try {
    const Quiz = require('../models/Quiz');
    const quizzes = await Quiz.find({
      userId: req.user._id,
      status: 'completed',
    }).select('questions result difficulty');

    if (quizzes.length === 0) {
      return res.json({ weakAreas: [], message: 'Chưa có dữ liệu quiz để phân tích' });
    }

    // Aggregate results by topic
    const topicStats = {};
    quizzes.forEach((quiz) => {
      quiz.questions.forEach((q, idx) => {
        const topic = q.topic || 'Chung';
        if (!topicStats[topic]) {
          topicStats[topic] = { total: 0, incorrect: 0 };
        }
        topicStats[topic].total++;

        const userAnswer = quiz.result.answers[idx];
        // For MCQ
        if (q.type === 'mcq' || !q.type) {
          if (userAnswer !== q.correctAnswer) {
            topicStats[topic].incorrect++;
          }
        }
        // For true_false
        else if (q.type === 'true_false') {
          if (userAnswer !== q.correctBoolean) {
            topicStats[topic].incorrect++;
          }
        }
        // For fill_blank - simplified comparison
        else if (q.type === 'fill_blank') {
          if (String(userAnswer).toLowerCase().trim() !== String(q.blankAnswer).toLowerCase().trim()) {
            topicStats[topic].incorrect++;
          }
        }
      });
    });

    const weakAreas = Object.entries(topicStats)
      .map(([topic, stats]) => ({
        topic,
        incorrectRate: Math.round((stats.incorrect / stats.total) * 100) / 100,
        totalQuestions: stats.total,
        incorrectCount: stats.incorrect,
        priority: stats.incorrect / stats.total > 0.6 ? 'high' : stats.incorrect / stats.total > 0.4 ? 'medium' : 'low',
        suggestedAction: stats.incorrect / stats.total > 0.6
          ? `Ôn tập lại chủ đề "${topic}" từ đầu và làm thêm flashcard`
          : stats.incorrect / stats.total > 0.4
            ? `Làm thêm quiz về "${topic}" để củng cố`
            : `Duy trì ôn tập "${topic}" định kỳ`,
      }))
      .sort((a, b) => b.incorrectRate - a.incorrectRate);

    res.json({ weakAreas, totalQuizzes: quizzes.length });
  } catch (error) {
    next(error);
  }
};
