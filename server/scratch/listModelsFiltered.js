const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function list() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const filtered = data.models
      .map(m => m.name)
      .filter(name => name.includes('gemini-1.5') || name.includes('gemini-2.0') || name.includes('gemini-2.5') || name.includes('embedding'));
    console.log('Filtered Models:', filtered);
  } catch (err) {
    console.error('Error listing models:', err.message);
  }
}

list();
