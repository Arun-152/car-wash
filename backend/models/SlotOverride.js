const mongoose = require('mongoose');

/**
 * SlotOverride — stores per-date, per-slot admin overrides.
 *
 * status: 'blocked'  → customers cannot book this slot
 * status: 'modified' → slot uses customCapacity instead of global maxSimultaneousBookings
 */
const slotOverrideSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // "HH:MM" e.g. "10:00"
    endTime: { type: String, required: true },   // "HH:MM" e.g. "10:30"
    status: {
      type: String,
      enum: ['blocked', 'modified'],
      required: true,
    },
    // Only meaningful when status === 'modified'
    customCapacity: { type: Number, default: null },
  },
  { timestamps: true }
);

// One override per date+startTime combination
slotOverrideSchema.index({ date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('SlotOverride', slotOverrideSchema);
