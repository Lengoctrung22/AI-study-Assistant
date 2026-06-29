const ChatSession = require('../models/ChatSession');
const Document = require('../models/Document');
const { queryDocument } = require('../services/ragService');

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

    // Get AI response via RAG
    const { answer, citations } = await queryDocument(message, documentId);

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
    });
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
