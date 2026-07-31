const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    vehicleNumber: { type: String, required: true },
    vehicleType: { 
      type: String, 
      enum: ['car', 'bike', 'suv'],
      required: true 
    },
    brand: { type: String, required: true },
    model: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
