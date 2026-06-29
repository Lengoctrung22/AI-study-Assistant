const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
console.log('Loaded API Key:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.slice(0, 5)}...` : 'undefined');

async function testModels() {
  const models = [
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
  ];

  for (const modelName of models) {
    console.log(`\nTesting model: ${modelName}`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hi, say hello!');
      console.log(`✅ Success: ${result.response.text().trim()}`);
    } catch (err) {
      console.error(`❌ Failed: ${err.message}`);
    }
  }
}

testModels();
