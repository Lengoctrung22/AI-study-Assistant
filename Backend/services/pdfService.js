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

    if (ext === '.docx' || ext === '.doc') {
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
    }

    // Default to PDF parsing
    const dataBuffer = fs.readFileSync(filePath);
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
    throw new Error(`Không thể đọc file ${isWord ? 'Word (.docx)' : 'PDF'}: ${error.message}`);
  }
};

/**
 * Clean extracted text
 */
const cleanText = (text) => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .replace(/[^\S\n]+/g, ' ')
    .trim();
};

module.exports = { parsePDF, cleanText };
