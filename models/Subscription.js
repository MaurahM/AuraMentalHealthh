const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['monthly', 'annual'], required: true },
  status: { type: String, enum: ['active', 'expired'], default: 'active' },
  startDate: Date,
  endDate: Date,
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
