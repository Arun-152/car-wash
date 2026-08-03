const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: false
    },
    bookingSource: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer'
    },
    manualCustomerDetails: {
      name: String,
      phone: String,
    },
    manualVehicleDetails: {
      vehicleNumber: String,
      vehicleType: String,
    },
    notes: { type: String, default: '' },
    bookingDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'cancellation-requested'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    bookingCode: { type: String, required: true, unique: true },
    cancellationRequested: { type: Boolean, default: false },
    cancellationRequestedAt: { type: Date },
    cancellationReason: { type: String, default: '' },
    refundStatus: {
      type: String,
      enum: ['none', 'completed'],
      default: 'none'
    }
  },
  { timestamps: true }
);

// Static helper to get the filter for valid/occupied bookings
// This ensures the Dashboard and Availability logic always stay in sync.
bookingSchema.statics.getOccupiedSlotFilter = function () {
  return {
    $or: [
      { bookingStatus: 'completed' },
      { bookingStatus: 'cancellation-requested' }, // Reserves slot until admin decision
      { bookingStatus: 'confirmed', paymentStatus: 'paid' },
      { bookingStatus: 'confirmed', bookingSource: 'admin' },
    ]
  };
};

// Static helper to get the filter for dashboard totals (ignores cancellation-requested)
bookingSchema.statics.getDashboardValidFilter = function () {
  return {
    $or: [
      { bookingStatus: 'completed' },
      { bookingStatus: 'confirmed', paymentStatus: 'paid' },
      { bookingStatus: 'confirmed', bookingSource: 'admin' },
    ]
  };
};

module.exports = mongoose.model('Booking', bookingSchema);
