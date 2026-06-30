const { generateContent } = require('../config/gemini');
const PREMIUM_PROMPTS = require('../utils/premiumPromptTemplates');
const { chunkText } = require('../utils/chunker');

/**
 * Generate mind map from document text
 */
const generateMindMap = async (text) => {
  let contentForMap = text;
  if (text.length > 12000) {
    const chunks = chunkText(text, { chunkSize: 4000, overlap: 200 });
    const step = Math.max(1, Math.floor(chunks.length / 3));
    const selected = chunks.filter((_, i) => i % step === 0).slice(0, 3);
    contentForMap = selected.map((c) => c.text).join('\n\n---\n\n');
  }

  const response = await generateContent(PREMIUM_PROMPTS.MINDMAP(contentForMap));

  try {
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const mindMap = JSON.parse(cleaned);

    if (!mindMap.central || !Array.isArray(mindMap.branches)) {
      throw new Error('Invalid mind map structure');
    }

    return mindMap;
  } catch (err) {
    console.error('Mind map parse error:', err.message);
    throw new Error('Không thể tạo sơ đồ tư duy. Vui lòng thử lại.');
  }
};

/**
 * Generate concept relationship graph from document text
 */
const generateConcepts = async (text) => {
  let contentForConcepts = text;
  if (text.length > 12000) {
    const chunks = chunkText(text, { chunkSize: 4000, overlap: 200 });
    const step = Math.max(1, Math.floor(chunks.length / 3));
    const selected = chunks.filter((_, i) => i % step === 0).slice(0, 3);
    contentForConcepts = selected.map((c) => c.text).join('\n\n---\n\n');
  }

  const response = await generateContent(PREMIUM_PROMPTS.CONCEPTS(contentForConcepts));

  try {
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const concepts = JSON.parse(cleaned);

    if (!concepts.nodes || !concepts.edges) {
      throw new Error('Invalid concept structure');
    }

    return concepts;
  } catch (err) {
    console.error('Concept parse error:', err.message);
    throw new Error('Không thể phân tích khái niệm. Vui lòng thử lại.');
  }
};

/**
 * Generate multi-level summary
 */
const generateMultiLevelSummary = async (text, levels = ['child', 'high_school', 'undergraduate', 'graduate', 'expert']) => {
  let contentForSummary = text;
  if (text.length > 10000) {
    const chunks = chunkText(text, { chunkSize: 4000, overlap: 200 });
    const step = Math.max(1, Math.floor(chunks.length / 3));
    const selected = chunks.filter((_, i) => i % step === 0).slice(0, 3);
    contentForSummary = selected.map((c) => c.text).join('\n\n---\n\n');
  }

  const summaries = {};
  for (const level of levels) {
    const response = await generateContent(PREMIUM_PROMPTS.MULTILEVEL_SUMMARY(contentForSummary, level));
    summaries[level] = response;
  }

  return summaries;
};

/**
 * Generate document analytics
 */
const generateAnalytics = async (text) => {
  let contentForAnalytics = text;
  if (text.length > 12000) {
    const chunks = chunkText(text, { chunkSize: 4000, overlap: 200 });
    const step = Math.max(1, Math.floor(chunks.length / 3));
    const selected = chunks.filter((_, i) => i % step === 0).slice(0, 3);
    contentForAnalytics = selected.map((c) => c.text).join('\n\n---\n\n');
  }

  const response = await generateContent(PREMIUM_PROMPTS.ANALYTICS(contentForAnalytics));

  try {
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Analytics parse error:', err.message);
    throw new Error('Không thể phân tích tài liệu. Vui lòng thử lại.');
  }
};

/**
 * Generate glossary from document text
 */
const generateGlossary = async (text) => {
  let contentForGlossary = text;
  if (text.length > 12000) {
    const chunks = chunkText(text, { chunkSize: 4000, overlap: 200 });
    const step = Math.max(1, Math.floor(chunks.length / 3));
    const selected = chunks.filter((_, i) => i % step === 0).slice(0, 3);
    contentForGlossary = selected.map((c) => c.text).join('\n\n---\n\n');
  }

  const response = await generateContent(PREMIUM_PROMPTS.GLOSSARY(contentForGlossary));

  try {
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const glossary = JSON.parse(cleaned);
    if (!Array.isArray(glossary)) throw new Error('Not an array');
    return glossary;
  } catch (err) {
    console.error('Glossary parse error:', err.message);
    throw new Error('Không thể tạo bảng thuật ngữ. Vui lòng thử lại.');
  }
};

module.exports = {
  generateMindMap,
  generateConcepts,
  generateMultiLevelSummary,
  generateAnalytics,
  generateGlossary,
};
