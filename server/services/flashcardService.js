const { generateContent } = require('../config/gemini');
const PROMPTS = require('../utils/promptTemplates');
const { chunkText } = require('../utils/chunker');

/**
 * Generate flashcards from document text
 */
const generateFlashcards = async (text, count = 10) => {
  // Use representative chunks if text is too long
  let contentForCards = text;
  if (text.length > 10000) {
    const chunks = chunkText(text, { chunkSize: 3000, overlap: 100 });
    // Take evenly distributed chunks
    const step = Math.max(1, Math.floor(chunks.length / 3));
    const selectedChunks = chunks.filter((_, i) => i % step === 0).slice(0, 3);
    contentForCards = selectedChunks.map((c) => c.text).join('\n\n---\n\n');
  }

  const response = await generateContent(PROMPTS.FLASHCARD(contentForCards, count));

  try {
    // Clean response - remove markdown code blocks if present
    const cleaned = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const cards = JSON.parse(cleaned);

    if (!Array.isArray(cards)) {
      throw new Error('Response is not an array');
    }

    return cards.map((card) => ({
      front: card.front || '',
      back: card.back || '',
      difficulty: ['easy', 'medium', 'hard'].includes(card.difficulty) ? card.difficulty : 'medium',
      tags: Array.isArray(card.tags) ? card.tags : [],
      nextReview: new Date(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
    }));
  } catch (parseError) {
    console.error('Flashcard parse error:', parseError.message);
    throw new Error('Không thể tạo flashcard. Vui lòng thử lại.');
  }
};

module.exports = { generateFlashcards };
