const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function testEmbedding() {
  const models = [
    'gemini-embedding-2',
    'gemini-embedding-001',
  ];

  for (const modelName of models) {
    console.log(`\nTesting embedding model: ${modelName}`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.embedContent('Hi, say hello!');
      console.log(`✅ Success: Generated embedding of length ${result.embedding.values.length}`);
    } catch (err) {
      console.error(`❌ Failed: ${err.message}`);
    }
  }
}

testEmbedding();
