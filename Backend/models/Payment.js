const mongoose = require('mongoose');
const crypto = require('crypto');

const generateTransactionId = () => {
  return `TXN-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
};
const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  transactionId: {
    type: String,
    default: generateTransactionId,
    unique: true,
  },
  plan: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'VND',
  },
  method: {
    type: String,
    enum: ['card', 'bank_transfer', 'momo'],
    default: 'card',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
  },
  cardLast4: {
    type: String,
    default: null,
  },
  cardBrand: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Payment', paymentSchema);
