const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    workingDays: {
      type: [String],
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    breakTimes: [{
      startTime: String, // e.g. "12:00"
      endTime: String    // e.g. "13:00"
    }],
    blockedDates: [{ type: Date }],
    maxSimultaneousBookings: { type: Number, default: 1 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Availability', availabilitySchema);
