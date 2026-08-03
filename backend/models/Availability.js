const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    workingDays: {
      type: [String],
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    breakTimes: [
      {
        startTime: String, // "HH:MM"
        endTime: String,   // "HH:MM"
      },
    ],
    // Each entry now stores the date AND an optional reason (Holiday, Maintenance, etc.)
    blockedDates: [
      {
        date: { type: Date },
        reason: { type: String, default: '' },
      },
    ],
    maxSimultaneousBookings: { type: Number, default: 1 },
    ceramicCoatingDailyCapacity: { type: Number, default: 2 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Availability', availabilitySchema);
