const Notebook = require('../models/Notebook');
const ChatSession = require('../models/ChatSession');
const Document = require('../models/Document');
const notebookService = require('../services/notebookService');

// POST /api/notebooks
exports.createNotebook = async (req, res, next) => {
  try {
    const { title, description, documentIds } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập tiêu đề sổ tay hợp lệ' });
    }

    if (title.length > 200) {
      return res.status(400).json({ message: 'Tiêu đề sổ tay không được vượt quá 200 ký tự' });
    }

    const cleanDescription = typeof description === 'string' ? description.substring(0, 2000) : '';

    // Verify documents belong to user
    let verifiedDocIds = [];
    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
      const docs = await Document.find({
        _id: { $in: documentIds.slice(0, 10) },
        userId: req.user._id,
      });
      verifiedDocIds = docs.map(d => d._id);
    }

    const notebook = await Notebook.create({
      userId: req.user._id,
      title: title.trim(),
      description: cleanDescription,
      documents: verifiedDocIds,
    });

    res.status(201).json({ notebook });
  } catch (error) {
    next(error);
  }
};

// GET /api/notebooks
exports.getNotebooks = async (req, res, next) => {
  try {
    const notebooks = await Notebook.find({ userId: req.user._id, status: 'active' })
      .sort({ updatedAt: -1 })
      .populate('documents', 'title pageCount fileSize status');

    res.json({ notebooks });
  } catch (error) {
    next(error);
  }
};

// GET /api/notebooks/:id
exports.getNotebook = async (req, res, next) => {
  try {
    const notebook = await Notebook.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('documents', 'title fileName pageCount fileSize status summary');

    if (!notebook) {
      return res.status(404).json({ message: 'Không tìm thấy sổ tay nghiên cứu' });
    }

    res.json({ notebook });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notebooks/:id
exports.updateNotebook = async (req, res, next) => {
  try {
    const { title, description, documentIds } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    if (documentIds && Array.isArray(documentIds)) {
      if (documentIds.length > 10) {
        return res.status(400).json({ message: 'Một sổ tay chỉ được chứa tối đa 10 tài liệu nguồn' });
      }
      // Verify documents belong to user
      const docs = await Document.find({
        _id: { $in: documentIds },
        userId: req.user._id,
      });
      updateData.documents = docs.map(d => d._id);
    }

    const notebook = await Notebook.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: updateData },
      { new: true }
    ).populate('documents', 'title pageCount fileSize status');

    if (!notebook) {
      return res.status(404).json({ message: 'Không tìm thấy sổ tay nghiên cứu' });
    }

    res.json({ notebook });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notebooks/:id
exports.deleteNotebook = async (req, res, next) => {
  try {
    const notebook = await Notebook.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notebook) {
      return res.status(404).json({ message: 'Không tìm thấy sổ tay nghiên cứu' });
    }

    // Delete associated chat sessions
    await ChatSession.deleteMany({ notebookId: notebook._id });

    res.json({ message: 'Đã xóa sổ tay và toàn bộ lịch sử chat liên quan' });
  } catch (error) {
    next(error);
  }
};

// POST /api/notebooks/:id/documents
exports.addDocuments = async (req, res, next) => {
  try {
    const { documentIds } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ message: 'Vui lòng cung cấp danh sách tài liệu cần thêm' });
    }

    const notebook = await Notebook.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notebook) {
      return res.status(404).json({ message: 'Không tìm thấy sổ tay nghiên cứu' });
    }

    // Verify documents belong to user
    const docs = await Document.find({
      _id: { $in: documentIds },
      userId: req.user._id,
    });

    const newDocIds = docs.map(d => d._id);
    const existingDocIds = (notebook.documents || []).map(d => d.toString());

    // Check document limit
    const uniqueNewIds = newDocIds.filter(id => !existingDocIds.includes(id.toString()));
    if (existingDocIds.length + uniqueNewIds.length > 10) {
      return res.status(400).json({ message: 'Một sổ tay nghiên cứu chỉ chứa tối đa 10 tài liệu' });
    }

    const populatedNotebook = await Notebook.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $addToSet: { documents: { $each: newDocIds } } },
      { new: true }
    ).populate('documents', 'title pageCount fileSize status');

    res.json({ notebook: populatedNotebook });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notebooks/:id/documents/:docId
exports.removeDocument = async (req, res, next) => {
  try {
    const populatedNotebook = await Notebook.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $pull: { documents: req.params.docId } },
      { new: true }
    ).populate('documents', 'title pageCount fileSize status');

    if (!populatedNotebook) {
      return res.status(404).json({ message: 'Không tìm thấy sổ tay nghiên cứu' });
    }

    res.json({ notebook: populatedNotebook });
  } catch (error) {
    next(error);
  }
};

// POST /api/notebooks/:id/generate/:type
exports.generateOutput = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { topic } = req.body; // option for deepDiveScript

    const validTypes = ['briefingDoc', 'studyGuide', 'timeline', 'faq', 'deepDiveScript', 'tableOfContents'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Loại tài liệu AI yêu cầu không hợp lệ' });
    }

    const notebook = await Notebook.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notebook) {
      return res.status(404).json({ message: 'Không tìm thấy sổ tay nghiên cứu' });
    }

    if (!notebook.documents || notebook.documents.length === 0) {
      return res.status(400).json({ message: 'Sổ tay cần có ít nhất 1 tài liệu để tạo nội dung AI' });
    }

    const docs = await Document.find({
      _id: { $in: notebook.documents },
      userId: req.user._id,
      status: 'ready',
    });

    if (docs.length === 0) {
      return res.status(400).json({ message: 'Không có tài liệu nào ở trạng thái sẵn sàng để xử lý' });
    }

    let outputResult;
    switch (type) {
      case 'briefingDoc':
        outputResult = await notebookService.generateBriefingDoc(docs);
        break;
      case 'studyGuide':
        outputResult = await notebookService.generateStudyGuide(docs);
        break;
      case 'timeline':
        outputResult = await notebookService.generateTimeline(docs);
        break;
      case 'faq':
        outputResult = await notebookService.generateFAQ(docs);
        break;
      case 'deepDiveScript':
        outputResult = await notebookService.generateDeepDiveScript(docs, topic);
        break;
      case 'tableOfContents':
        outputResult = await notebookService.generateTableOfContents(docs);
        break;
    }

    // Cache the output
    notebook.generatedOutputs[type] = {
      content: typeof outputResult === 'object' ? JSON.stringify(outputResult) : outputResult,
      generatedAt: new Date(),
    };

    await notebook.save();

    // Record study activity (Notebook Generation = 15 mins)
    try {
      const { recordActivity } = require('../services/activityService');
      await recordActivity(req.user._id, 'notebook_generation', 15, docs[0]._id, { type });
    } catch (actError) {
      console.error('Failed to log notebook generation activity:', actError.message);
    }

    res.json({
      type,
      content: outputResult,
      generatedAt: notebook.generatedOutputs[type].generatedAt,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/notebooks/:id/chat
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    const notebookId = req.params.id;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập tin nhắn hợp lệ' });
    }

    if (message.length > 4000) {
      return res.status(400).json({ message: 'Tin nhắn không được vượt quá 4,000 ký tự' });
    }

    const cleanMessage = message.trim();

    const notebook = await Notebook.findOne({
      _id: notebookId,
      userId: req.user._id,
    });

    if (!notebook) {
      return res.status(404).json({ message: 'Không tìm thấy sổ tay nghiên cứu' });
    }

    if (!notebook.documents || notebook.documents.length === 0) {
      return res.status(400).json({ message: 'Vui lòng thêm ít nhất 1 tài liệu vào sổ tay trước khi chat' });
    }

    const docs = await Document.find({
      _id: { $in: notebook.documents },
      userId: req.user._id,
      status: 'ready',
    });

    if (docs.length === 0) {
      return res.status(400).json({ message: 'Tài liệu trong sổ tay chưa sẵn sàng để chat' });
    }

    // Find or create session
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({
        _id: sessionId,
        userId: req.user._id,
        notebookId,
      });
    }

    if (!session) {
      session = await ChatSession.create({
        userId: req.user._id,
        notebookId,
        title: cleanMessage.substring(0, 50) + (cleanMessage.length > 50 ? '...' : ''),
        messages: [],
      });
    }

    // Add user message
    session.messages.push({
      role: 'user',
      content: cleanMessage,
    });

    // Chat with Notebook (Cross-doc RAG)
    const { answer, citations } = await notebookService.queryNotebook(cleanMessage, docs, notebookId);

    // Add assistant response
    session.messages.push({
      role: 'assistant',
      content: answer,
      citations,
    });

    // Safeguard against unbounded embedded array exceeding MongoDB 16MB limit
    if (session.messages.length > 500) {
      session.messages = session.messages.slice(-500);
    }

    await session.save();

    // Record study activity (Notebook Chat message = 5 mins)
    try {
      const { recordActivity } = require('../services/activityService');
      await recordActivity(req.user._id, 'chat_message', 5, docs[0]._id, { notebookId });
    } catch (actError) {
      console.error('Failed to log notebook chat activity:', actError.message);
    }

    res.json({
      sessionId: session._id,
      answer,
      citations,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/notebooks/:id/chat/sessions
exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await ChatSession.find({
      userId: req.user._id,
      notebookId: req.params.id,
    })
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt')
      .lean();

    res.json({ sessions });
  } catch (error) {
    next(error);
  }
};

// POST /api/notebooks/:id/notes
exports.addNote = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'Nội dung ghi chú không được để trống' });
    }

    if (content.length > 10000) {
      return res.status(400).json({ message: 'Nội dung ghi chú không được vượt quá 10,000 ký tự' });
    }

    const updated = await Notebook.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $push: { notes: { content: content.trim() } } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy sổ tay nghiên cứu' });
    }

    res.status(201).json({ notes: updated.notes });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notebooks/:id/notes/:noteId
exports.deleteNote = async (req, res, next) => {
  try {
    const updated = await Notebook.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $pull: { notes: { _id: req.params.noteId } } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy sổ tay nghiên cứu' });
    }

    res.json({ notes: updated.notes });
  } catch (error) {
    next(error);
  }
};
