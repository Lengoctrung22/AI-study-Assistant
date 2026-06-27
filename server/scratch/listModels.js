const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function list() {
  try {
    // Note: The SDK does not have a direct listModels method on the genAI instance, 
    // but we can query the REST endpoint using fetch.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log('Available Models:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error listing models:', err.message);
  }
}

list();
