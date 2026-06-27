const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Parse PDF file and extract text content
 */
const parsePDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    return {
      text: data.text,
      pageCount: data.numpages,
      info: data.info,
    };
  } catch (error) {
    console.error('PDF Parse Error:', error.message);
    throw new Error(`Không thể đọc file PDF: ${error.message}`);
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
