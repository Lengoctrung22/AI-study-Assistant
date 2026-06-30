const ChatSession = require('../models/ChatSession');
const Document = require('../models/Document');
const { queryDocument } = require('../services/ragService');
const { searchChunks } = require('../services/embeddingService');
const { generateContent } = require('../config/gemini');
const PREMIUM_PROMPTS = require('../utils/premiumPromptTemplates');

// POST /api/chat/:documentId/send
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    const { documentId } = req.params;

    if (!message) {
      return res.status(400).json({ message: 'Vui lòng nhập tin nhắn' });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    // Find or create session
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({
        _id: sessionId,
        userId: req.user._id,
        documentId,
      });
    }

    if (!session) {
      session = await ChatSession.create({
        userId: req.user._id,
        documentId,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        messages: [],
      });
    }

    // Add user message
    session.messages.push({
      role: 'user',
      content: message,
    });

    // Get AI response via RAG — with persona for premium users
    let answer, citations, suggestedQuestions = [];
    const isPremium = req.user.plan === 'premium';

    if (isPremium) {
      const result = await queryDocumentWithPersona(message, documentId, req.user.tutorPersona || 'friendly');
      answer = result.answer;
      citations = result.citations;
      suggestedQuestions = result.suggestedQuestions || [];
    } else {
      const result = await queryDocument(message, documentId);
      answer = result.answer;
      citations = result.citations;
    }

    // Add assistant message
    session.messages.push({
      role: 'assistant',
      content: answer,
      citations,
    });

    await session.save();

    res.json({
      sessionId: session._id,
      answer,
      citations,
      suggestedQuestions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * RAG with persona and follow-up suggestions (premium)
 */
async function queryDocumentWithPersona(question, documentId, persona) {
  const relevantChunks = await searchChunks(question, documentId, 5);

  if (relevantChunks.length === 0) {
    return {
      answer: 'Không tìm thấy thông tin liên quan trong tài liệu.',
      citations: [],
      suggestedQuestions: [],
    };
  }

  const context = relevantChunks.map((chunk, i) => `[Đoạn ${i + 1}]: ${chunk.text}`).join('\n\n');

  const prompt = PREMIUM_PROMPTS.CHAT_WITH_FOLLOWUP(question, context, persona);
  const response = await generateContent(prompt);

  // Parse response to extract answer and suggestions
  let answer = response;
  let suggestedQuestions = [];

  if (response.includes('---ANSWER---') && response.includes('---SUGGESTIONS---')) {
    const parts = response.split('---SUGGESTIONS---');
    answer = parts[0].replace('---ANSWER---', '').trim();
    const suggestionsPart = parts[1] || '';
    suggestedQuestions = suggestionsPart
      .split('\n')
      .map((s) => s.replace(/^\d+\.\s*/, '').trim())
      .filter((s) => s.length > 0)
      .slice(0, 3);
  }

  const citations = relevantChunks.map((chunk) => ({
    chunkText: chunk.text.substring(0, 200) + '...',
    chunkIndex: chunk.metadata.chunkIndex,
    pageNumber: chunk.metadata.pageNumber || null,
  }));

  return { answer, citations, suggestedQuestions };
}

// POST /api/chat/multi-doc (premium)
exports.sendMultiDocMessage = async (req, res, next) => {
  try {
    const { message, documentIds } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Vui lòng nhập tin nhắn' });
    }

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length < 2) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất 2 tài liệu' });
    }

    // Verify all documents belong to user
    const documents = await Document.find({
      _id: { $in: documentIds },
      userId: req.user._id,
    }).select('title');

    if (documents.length !== documentIds.length) {
      return res.status(404).json({ message: 'Một hoặc nhiều tài liệu không tồn tại' });
    }

    // Search across all documents
    const allChunks = [];
    for (const docId of documentIds) {
      try {
        const chunks = await searchChunks(message, docId, 3);
        const doc = documents.find((d) => d._id.toString() === docId);
        chunks.forEach((chunk) => {
          chunk.metadata.documentTitle = doc ? doc.title : 'Unknown';
        });
        allChunks.push(...chunks);
      } catch (e) {
        console.warn(`Search failed for doc ${docId}:`, e.message);
      }
    }

    if (allChunks.length === 0) {
      return res.json({
        answer: 'Không tìm thấy thông tin liên quan trong các tài liệu.',
        citations: [],
        suggestedQuestions: [],
      });
    }

    // Sort by relevance (take top 8)
    const topChunks = allChunks.slice(0, 8);
    const context = topChunks
      .map((chunk, i) => `[Đoạn ${i + 1} - ${chunk.metadata.documentTitle}]: ${chunk.text}`)
      .join('\n\n');

    const persona = req.user.tutorPersona || 'friendly';
    const prompt = PREMIUM_PROMPTS.CHAT_WITH_FOLLOWUP(message, context, persona);
    const response = await generateContent(prompt);

    let answer = response;
    let suggestedQuestions = [];

    if (response.includes('---ANSWER---') && response.includes('---SUGGESTIONS---')) {
      const parts = response.split('---SUGGESTIONS---');
      answer = parts[0].replace('---ANSWER---', '').trim();
      const suggestionsPart = parts[1] || '';
      suggestedQuestions = suggestionsPart
        .split('\n')
        .map((s) => s.replace(/^\d+\.\s*/, '').trim())
        .filter((s) => s.length > 0)
        .slice(0, 3);
    }

    const citations = topChunks.map((chunk) => ({
      chunkText: chunk.text.substring(0, 200) + '...',
      chunkIndex: chunk.metadata.chunkIndex,
      pageNumber: chunk.metadata.pageNumber || null,
      documentTitle: chunk.metadata.documentTitle,
    }));

    res.json({ answer, citations, suggestedQuestions });
  } catch (error) {
    next(error);
  }
};

// GET /api/chat/sessions
exports.getSessions = async (req, res, next) => {
  try {
    const { documentId } = req.query;
    const filter = { userId: req.user._id };
    if (documentId) filter.documentId = documentId;

    const sessions = await ChatSession.find(filter)
      .sort({ updatedAt: -1 })
      .select('title documentId createdAt updatedAt')
      .populate('documentId', 'title');

    res.json({ sessions });
  } catch (error) {
    next(error);
  }
};

// GET /api/chat/sessions/:id
exports.getSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('documentId', 'title');

    if (!session) {
      return res.status(404).json({ message: 'Không tìm thấy phiên chat' });
    }

    res.json({ session });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/chat/sessions/:id
exports.deleteSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ message: 'Không tìm thấy phiên chat' });
    }

    res.json({ message: 'Đã xóa phiên chat' });
  } catch (error) {
    next(error);
  }
};

// GET /api/chat/search (premium)
exports.searchChatHistory = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Từ khóa tìm kiếm quá ngắn' });
    }

    const sessions = await ChatSession.find({
      userId: req.user._id,
      'messages.content': { $regex: q, $options: 'i' },
    })
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate('documentId', 'title');

    // Extract matching messages with context
    const results = sessions.map((session) => {
      const matchingMessages = session.messages
        .filter((m) => m.content.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 3)
        .map((m) => ({
          role: m.role,
          content: m.content.substring(0, 200) + (m.content.length > 200 ? '...' : ''),
        }));

      return {
        sessionId: session._id,
        title: session.title,
        documentTitle: session.documentId?.title,
        updatedAt: session.updatedAt,
        matchingMessages,
      };
    });

    res.json({ results, query: q });
  } catch (error) {
    next(error);
  }
};

// PUT /api/chat/persona (premium)
exports.updatePersona = async (req, res, next) => {
  try {
    const { persona } = req.body;
    const validPersonas = ['friendly', 'strict', 'socratic', 'encouraging', 'concise'];

    if (!validPersonas.includes(persona)) {
      return res.status(400).json({ message: 'Persona không hợp lệ' });
    }

    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { tutorPersona: persona });

    res.json({ message: 'Đã cập nhật persona', persona });
  } catch (error) {
    next(error);
  }
};
