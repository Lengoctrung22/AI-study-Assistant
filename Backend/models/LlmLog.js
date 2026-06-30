const mongoose = require('mongoose');

const llmLogSchema = new mongoose.Schema({
  modelName: {
    type: String,
    required: true,
  },
  tokensUsed: {
    type: Number,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('LlmLog', llmLogSchema);
