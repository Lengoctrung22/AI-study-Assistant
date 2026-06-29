const { searchChunks } = require('./embeddingService');
const { generateContent } = require('../config/gemini');
const PROMPTS = require('../utils/promptTemplates');

/**
 * RAG Pipeline: Retrieve relevant chunks + Generate answer
 */
const queryDocument = async (question, documentId) => {
  // 1. Search for relevant chunks
  const relevantChunks = await searchChunks(question, documentId, 5);

  if (relevantChunks.length === 0) {
    return {
      answer: 'Không tìm thấy thông tin liên quan trong tài liệu. Vui lòng thử câu hỏi khác.',
      citations: [],
    };
  }

  // 2. Build context from chunks
  const context = relevantChunks
    .map((chunk, i) => `[Đoạn ${i + 1}]: ${chunk.text}`)
    .join('\n\n');

  // 3. Generate answer using Gemini
  const prompt = PROMPTS.CHAT(question, context);
  const answer = await generateContent(prompt);

  // 4. Build citations
  const citations = relevantChunks.map((chunk) => ({
    chunkText: chunk.text.substring(0, 200) + '...',
    chunkIndex: chunk.metadata.chunkIndex,
    pageNumber: chunk.metadata.pageNumber || null,
  }));

  return { answer, citations };
};

module.exports = { queryDocument };
