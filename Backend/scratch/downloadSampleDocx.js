const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function download() {
  const url = 'https://raw.githubusercontent.com/mwilliamson/mammoth.js/master/test/test-data/single-paragraph.docx';
  const outputPath = path.join(__dirname, '../../sample.docx');

  console.log(`Downloading sample.docx from ${url}...`);
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      console.log('✅ sample.docx downloaded successfully to root directory!');
      process.exit(0);
    });

    writer.on('error', (err) => {
      console.error('❌ Write stream error:', err.message);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Download failed:', error.message);
    process.exit(1);
  }
}

download();
