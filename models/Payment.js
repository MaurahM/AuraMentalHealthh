const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  phone: String,
  amount: Number,
  plan: String,
  checkoutRequestID: String,
  mpesaReceipt: String,
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
