const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Parse PDF or Word (.docx) file and extract text content
 */
const parsePDF = async (filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value || '';
      
      // Estimate page count (standard page has ~400 words)
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const pageCount = Math.max(1, Math.ceil(wordCount / 400));

      return {
        text,
        pageCount,
        info: { Title: path.basename(filePath) }
      };
    } else if (ext === '.doc') {
      throw new Error('Định dạng Word cũ (.doc) không được hỗ trợ. Vui lòng lưu tệp dưới định dạng .docx hoặc .pdf trước khi tải lên.');
    }

    // Default to PDF parsing (asynchronous non-blocking read)
    const dataBuffer = await fs.promises.readFile(filePath);
    const data = await pdfParse(dataBuffer);

    return {
      text: data.text,
      pageCount: data.numpages,
      info: data.info,
    };
  } catch (error) {
    const ext = path.extname(filePath).toLowerCase();
    const isWord = ext === '.docx' || ext === '.doc';
    console.error(`${isWord ? 'Word' : 'PDF'} Parse Error:`, error.message);
    throw new Error(error.message || `Không thể đọc file ${isWord ? 'Word (.docx)' : 'PDF'}`);
  }
};

/**
 * Clean extracted text
 */
const cleanText = (text) => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\S\n]+/g, ' ')
    .trim();
};

module.exports = { parsePDF, cleanText };
