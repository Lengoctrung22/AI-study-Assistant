const Document = require('../models/Document');
const { parsePDF, cleanText } = require('../services/pdfService');
const { chunkText } = require('../utils/chunker');
const { embedAndStoreChunks } = require('../services/embeddingService');
const { generateSummary } = require('../services/summaryService');
const { generateContent } = require('../config/gemini');
const PROMPTS = require('../utils/promptTemplates');
const { deleteDocumentChunks } = require('../services/embeddingService');
const fs = require('fs');

// POST /api/documents/upload
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng upload file PDF' });
    }

    // Fix encoding for Vietnamese filenames
    const utf8Name = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    // Create document record
    const document = await Document.create({
      userId: req.user._id,
      title: utf8Name.replace('.pdf', ''),
      fileName: utf8Name,
      filePath: req.file.path,
      fileSize: req.file.size,
      status: 'processing',
    });

    // Process async
    processDocument(document._id, req.file.path, req.user._id).catch((err) => {
      console.error('Document processing error:', err);
    });

    res.status(201).json({
      message: 'File đã được upload, đang xử lý...',
      document: {
        id: document._id,
        title: document.title,
        status: document.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Background processing
async function processDocument(documentId, filePath, userId) {
  try {
    // 1. Parse PDF
    const { text, pageCount } = await parsePDF(filePath);
    const cleaned = cleanText(text);

    // 2. Chunk text
    const chunks = chunkText(cleaned, { chunkSize: 800, overlap: 100 });

    // 3. Generate embeddings & store in ChromaDB
    let chunkCount = 0;
    try {
      chunkCount = await embedAndStoreChunks(chunks, documentId, userId);
    } catch (embeddingError) {
      console.warn('ChromaDB embedding failed (may not be running):', embeddingError.message);
      chunkCount = chunks.length;
    }

    // 4. Generate summary
    const summary = await generateSummary(cleaned);

    // 5. Update document
    await Document.findByIdAndUpdate(documentId, {
      summary,
      pageCount,
      chunkCount,
      status: 'ready',
    });

    console.log(`✅ Document processed: ${documentId}`);
  } catch (error) {
    console.error(`❌ Document processing failed: ${error.message}`);
    await Document.findByIdAndUpdate(documentId, {
      status: 'error',
      errorMessage: error.message,
    });
  }
}

// GET /api/documents
exports.getDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-filePath');

    res.json({ documents });
  } catch (error) {
    next(error);
  }
};

// GET /api/documents/:id
exports.getDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    res.json({ document });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/documents/:id
exports.deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    // Delete file
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete embeddings from ChromaDB
    try {
      await deleteDocumentChunks(document._id);
    } catch (e) {
      console.warn('ChromaDB delete failed:', e.message);
    }

    await Document.findByIdAndDelete(document._id);

    res.json({ message: 'Đã xóa tài liệu' });
  } catch (error) {
    next(error);
  }
};

// POST /api/documents/:id/summarize
exports.summarizeDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    const { text } = await parsePDF(document.filePath);
    const cleaned = cleanText(text);
    const summary = await generateSummary(cleaned);

    document.summary = summary;
    await document.save();

    res.json({ summary });
  } catch (error) {
    next(error);
  }
};

// POST /api/documents/:id/explain
exports.explainText = async (req, res, next) => {
  try {
    const { text, context, level } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đoạn text cần giải thích' });
    }

    const explanation = await generateContent(
      PROMPTS.EXPLAIN(text, context || '', level || 'student')
    );

    res.json({ explanation });
  } catch (error) {
    next(error);
  }
};

// GET /api/documents/:id/text
exports.getDocumentText = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    const { text } = await parsePDF(document.filePath);
    res.json({ text: cleanText(text) });
  } catch (error) {
    next(error);
  }
};
