const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    bookingId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Booking', 
      required: true 
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    amount: { type: Number, required: true },
    paymentMethod: { 
      type: String, 
      enum: ['card', 'upi', 'cash', 'razorpay'], 
      required: true 
    },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'paid', 'failed', 'refunded'], 
      default: 'pending' 
    },
    transactionId: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
