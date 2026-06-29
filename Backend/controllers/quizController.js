const Quiz = require('../models/Quiz');
const Document = require('../models/Document');
const { parsePDF, cleanText } = require('../services/pdfService');
const { generateQuiz } = require('../services/quizService');

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

    const questions = await generateQuiz(cleaned, count, difficulty);

    const quiz = await Quiz.create({
      userId: req.user._id,
      documentId: document._id,
      title: `Quiz - ${document.title}`,
      difficulty,
      questions,
      result: { score: null, total: questions.length, answers: [] },
    });

    res.status(201).json({ quiz });
  } catch (error) {
    next(error);
  }
};

// GET /api/quiz
exports.getQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('documentId', 'title')
      .select('-questions.correctAnswer -questions.explanation');

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
    const { answers } = req.body;

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

    // Calculate score
    let score = 0;
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        score++;
      }
    });

    quiz.result = {
      score,
      total: quiz.questions.length,
      answers,
      completedAt: new Date(),
    };
    quiz.status = 'completed';
    await quiz.save();

    res.json({
      result: quiz.result,
      questions: quiz.questions,
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
