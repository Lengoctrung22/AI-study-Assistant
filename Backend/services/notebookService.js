const { generateContent } = require('../config/gemini');
const NOTEBOOK_PROMPTS = require('../utils/notebookPromptTemplates');
const Document = require('../models/Document');
const { parsePDF, cleanText } = require('./pdfService');
const { searchChunks } = require('./embeddingService');
const fs = require('fs');

/**
 * Get unified list of document details and titles in a notebook
 */
const getNotebookDocuments = async (documentIds, userId) => {
  return await Document.find({
    _id: { $in: documentIds },
    userId,
  });
};

/**
 * Extract and combine text from all documents in a notebook.
 * Respects a reasonable limit to prevent payload bloat.
 */
const getNotebookCombinedText = async (documents) => {
  let combinedText = '';
  const documentListStr = documents.map((d, i) => `${i + 1}. ${d.title}`).join('\n');

  for (const doc of documents) {
    if (!fs.existsSync(doc.filePath)) {
      console.warn(`File not found: ${doc.filePath}`);
      continue;
    }

    try {
      const { text } = await parsePDF(doc.filePath);
      const cleaned = cleanText(text);
      
      // Limit text from individual document to prevent overwhelming context window (cap at 35,000 chars per doc)
      const docTextSnippet = cleaned.length > 35000 
        ? cleaned.substring(0, 35000) + '\n... [Nội dung tiếp theo bị cắt bớt để tối ưu hóa] ...'
        : cleaned;

      combinedText += `\n\n--- BẮT ĐẦU TÀI LIỆU: ${doc.title} ---\n${docTextSnippet}\n--- KẾT THÚC TÀI LIỆU: ${doc.title} ---\n`;
    } catch (e) {
      console.error(`Error parsing doc ${doc.title}:`, e.message);
    }
  }

  // Cap total combined text length at 180,000 characters
  if (combinedText.length > 180000) {
    combinedText = combinedText.substring(0, 180000) + '\n\n... [Nội dung toàn bộ notebook quá dài và đã được cắt bớt phần cuối] ...';
  }

  return { combinedText, documentListStr };
};

/**
 * Generate Briefing Document
 */
const generateBriefingDoc = async (documents) => {
  const { combinedText, documentListStr } = await getNotebookCombinedText(documents);
  const prompt = NOTEBOOK_PROMPTS.BRIEFING_DOC(combinedText, documentListStr);
  return await generateContent(prompt);
};

/**
 * Generate Study Guide
 */
const generateStudyGuide = async (documents) => {
  const { combinedText } = await getNotebookCombinedText(documents);
  const prompt = NOTEBOOK_PROMPTS.STUDY_GUIDE(combinedText);
  return await generateContent(prompt);
};

/**
 * Generate Timeline
 */
const generateTimeline = async (documents) => {
  const { combinedText } = await getNotebookCombinedText(documents);
  const prompt = NOTEBOOK_PROMPTS.TIMELINE(combinedText);
  const response = await generateContent(prompt);
  
  try {
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Timeline JSON parse error. Raw response:', response);
    throw new Error('Không thể phân tích kết quả Dòng thời gian từ AI dưới dạng JSON');
  }
};

/**
 * Generate FAQ
 */
const generateFAQ = async (documents) => {
  const { combinedText } = await getNotebookCombinedText(documents);
  const prompt = NOTEBOOK_PROMPTS.FAQ(combinedText);
  const response = await generateContent(prompt);
  
  try {
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('FAQ JSON parse error. Raw response:', response);
    throw new Error('Không thể phân tích kết quả FAQ từ AI dưới dạng JSON');
  }
};

/**
 * Generate Deep Dive Script
 */
const generateDeepDiveScript = async (documents, topic = '') => {
  const { combinedText } = await getNotebookCombinedText(documents);
  const prompt = NOTEBOOK_PROMPTS.DEEP_DIVE_SCRIPT(combinedText, topic);
  return await generateContent(prompt);
};

/**
 * Generate Table of Contents
 */
const generateTableOfContents = async (documents) => {
  const { combinedText, documentListStr } = await getNotebookCombinedText(documents);
  const prompt = NOTEBOOK_PROMPTS.TABLE_OF_CONTENTS(combinedText, documentListStr);
  const response = await generateContent(prompt);
  
  try {
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('TOC JSON parse error. Raw response:', response);
    throw new Error('Không thể phân tích kết quả Mục lục tổng hợp dưới dạng JSON');
  }
};

/**
 * RAG Multi-Document Chat inside Notebook
 */
const queryNotebook = async (question, documents, notebookId) => {
  const allChunks = [];
  const topKPerDoc = Math.max(2, Math.floor(8 / documents.length)); // dynamically adjust retrieval per doc

  for (const doc of documents) {
    try {
      const chunks = await searchChunks(question, doc._id, topKPerDoc);
      chunks.forEach((chunk) => {
        chunk.metadata.documentTitle = doc.title;
      });
      allChunks.push(...chunks);
    } catch (e) {
      console.warn(`Search failed for doc ${doc.title} in notebook ${notebookId}:`, e.message);
    }
  }

  if (allChunks.length === 0) {
    return {
      answer: 'Không tìm thấy thông tin liên quan trong các tài liệu của sổ tay này. Vui lòng hỏi câu khác.',
      citations: [],
    };
  }

  // Sort by ChromaDB query distances/scores if present, then take top 8
  const sortedChunks = allChunks
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, 8);

  const context = sortedChunks
    .map((chunk, i) => `[Đoạn ${i + 1} - Tài liệu: ${chunk.metadata.documentTitle}]: ${chunk.text}`)
    .join('\n\n');

  const prompt = NOTEBOOK_PROMPTS.NOTEBOOK_CHAT(question, context);
  const answer = await generateContent(prompt);

  const citations = sortedChunks.map((chunk) => ({
    chunkText: chunk.text.substring(0, 250) + '...',
    chunkIndex: chunk.metadata.chunkIndex,
    pageNumber: chunk.metadata.pageNumber || null,
    documentTitle: chunk.metadata.documentTitle,
  }));

  return { answer, citations };
};

module.exports = {
  getNotebookDocuments,
  generateBriefingDoc,
  generateStudyGuide,
  generateTimeline,
  generateFAQ,
  generateDeepDiveScript,
  generateTableOfContents,
  queryNotebook,
};
