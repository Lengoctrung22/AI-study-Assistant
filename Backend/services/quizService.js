const { generateContent } = require('../config/gemini');
const PROMPTS = require('../utils/promptTemplates');
const { chunkText } = require('../utils/chunker');

/**
 * Generate quiz questions from document text
 */
const generateQuiz = async (text, count = 10, difficulty = 'mixed') => {
  let contentForQuiz = text;
  if (text.length > 10000) {
    const chunks = chunkText(text, { chunkSize: 3000, overlap: 100 });
    const step = Math.max(1, Math.floor(chunks.length / 3));
    const selectedChunks = chunks.filter((_, i) => i % step === 0).slice(0, 3);
    contentForQuiz = selectedChunks.map((c) => c.text).join('\n\n---\n\n');
  }

  const response = await generateContent(PROMPTS.QUIZ(contentForQuiz, count, difficulty));

  try {
    const cleaned = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const questions = JSON.parse(cleaned);

    if (!Array.isArray(questions)) {
      throw new Error('Response is not an array');
    }

    return questions.map((q) => ({
      question: q.question || '',
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
      explanation: q.explanation || '',
      topic: q.topic || '',
    }));
  } catch (parseError) {
    console.error('Quiz parse error:', parseError.message);
    throw new Error('Không thể tạo câu hỏi. Vui lòng thử lại.');
  }
};

module.exports = { generateQuiz };
