const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['Refund', 'Credit', 'Debit'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    referenceId: {
      type: String, // E.g., Booking Code
      default: ''
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
