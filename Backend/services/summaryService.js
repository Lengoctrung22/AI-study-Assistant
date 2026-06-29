const { generateContent } = require('../config/gemini');
const PROMPTS = require('../utils/promptTemplates');
const { chunkText } = require('../utils/chunker');

/**
 * Generate summary for document text
 * Uses map-reduce for long documents
 */
const generateSummary = async (text) => {
  const maxChunkSize = 8000;

  // Short document: summarize directly
  if (text.length < maxChunkSize) {
    return await generateContent(PROMPTS.SUMMARIZE(text));
  }

  // Long document: map-reduce approach
  const chunks = chunkText(text, { chunkSize: maxChunkSize, overlap: 200 });

  // Map: summarize each chunk
  const chunkSummaries = [];
  for (const chunk of chunks) {
    const summary = await generateContent(PROMPTS.SUMMARIZE(chunk.text));
    chunkSummaries.push(summary);
  }

  // Reduce: merge summaries
  const mergedText = chunkSummaries
    .map((s, i) => `--- Phần ${i + 1} ---\n${s}`)
    .join('\n\n');

  return await generateContent(PROMPTS.SUMMARIZE_MERGE(mergedText));
};

module.exports = { generateSummary };
