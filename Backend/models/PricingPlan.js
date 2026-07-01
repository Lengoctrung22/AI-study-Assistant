const mongoose = require('mongoose');

const pricingPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên gói'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Vui lòng nhập mã gói'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Vui lòng nhập giá tiền'],
    min: [0, 'Giá tiền không thể âm'],
  },
  durationMonths: {
    type: Number,
    required: [true, 'Vui lòng nhập thời hạn gói (tháng)'],
    min: [1, 'Thời hạn tối thiểu là 1 tháng'],
  },
  description: {
    type: String,
    default: '',
  },
  features: {
    type: [String],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PricingPlan', pricingPlanSchema);
