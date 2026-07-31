const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    serviceId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Service', 
      required: true 
    },
    vehicleId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Vehicle', 
      required: true 
    },
    bookingDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    bookingStatus: { 
      type: String, 
      enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'], 
      default: 'pending' 
    },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'paid', 'failed', 'refunded'], 
      default: 'pending' 
    },
    bookingCode: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
