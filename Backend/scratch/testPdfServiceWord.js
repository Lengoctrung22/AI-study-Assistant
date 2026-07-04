const { parsePDF } = require('../services/pdfService');
const path = require('path');

async function test() {
  const filePath = path.join(__dirname, '../../sample.docx');
  console.log(`Parsing file: ${filePath}`);
  try {
    const result = await parsePDF(filePath);
    console.log('✅ Success!');
    console.log('Estimated Page Count:', result.pageCount);
    console.log('Metadata Info:', result.info);
    console.log('Extracted Text:\n', result.text);
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

test();
