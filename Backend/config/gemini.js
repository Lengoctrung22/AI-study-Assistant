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

const LlmLog = require('../models/LlmLog');

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
    
    // Log embedding usage
    const tokens = Math.ceil((text || '').length / 4);
    const cost = tokens * 0.00000005; // $0.05 per 1M tokens
    try {
      await LlmLog.create({ modelName: 'gemini-embedding-001', tokensUsed: tokens, cost });
    } catch (e) {
      console.error('Error logging embedding usage:', e.message);
    }

    return result.embedding.values;
  });
};

const generateContent = async (prompt, modelName = 'gemini-2.5-flash') => {
  return retryWithBackoff(async () => {
    const model = getGenerativeModel(modelName);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Log content generation usage
    const inputTokens = Math.ceil((prompt || '').length / 4);
    const outputTokens = Math.ceil((responseText || '').length / 4);
    const totalTokens = inputTokens + outputTokens;
    // Costs: Flash $0.15/1M input, $0.60/1M output. Pro $2.50/1M input, $10.00/1M output.
    const isPro = modelName.includes('pro');
    const inputCostRate = isPro ? 0.0000025 : 0.00000015;
    const outputCostRate = isPro ? 0.000010 : 0.00000060;
    const cost = (inputTokens * inputCostRate) + (outputTokens * outputCostRate);

    try {
      await LlmLog.create({ modelName, tokensUsed: totalTokens, cost });
    } catch (e) {
      console.error('Error logging content generation usage:', e.message);
    }

    return responseText;
  });
};

module.exports = {
  genAI,
  getGenerativeModel,
  getEmbeddingModel,
  generateEmbedding,
  generateContent,
};
