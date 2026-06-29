const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryWithBackoff = async (fn, retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = err.message?.includes('429') || 
                          err.message?.includes('Quota exceeded') || 
                          err.status === 429 || 
                          JSON.stringify(err).includes('429');
      if (isRateLimit && i < retries - 1) {
        const waitTime = delay * Math.pow(2, i) + Math.random() * 1000;
        console.warn(`⚠️ Gemini Rate limit hit. Retrying in ${(waitTime / 1000).toFixed(1)}s... (Attempt ${i + 1}/${retries})`);
        await sleep(waitTime);
        continue;
      }
      throw err;
    }
  }
};

const getGenerativeModel = (modelName = 'gemini-2.5-flash') => {
  return genAI.getGenerativeModel({ model: modelName });
};

const getEmbeddingModel = () => {
  return genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
};

const generateEmbedding = async (text) => {
  return retryWithBackoff(async () => {
    const model = getEmbeddingModel();
    const result = await model.embedContent(text);
    return result.embedding.values;
  });
};

const generateContent = async (prompt, modelName = 'gemini-2.5-flash') => {
  return retryWithBackoff(async () => {
    const model = getGenerativeModel(modelName);
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
};

module.exports = {
  genAI,
  getGenerativeModel,
  getEmbeddingModel,
  generateEmbedding,
  generateContent,
};
