const mongoose = require('mongoose');

const shopSettingsSchema = new mongoose.Schema(
  {
    shopName: { type: String, required: true, default: 'My Car Wash' },
    description: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    location: {
      lat: { type: Number },
      lng: { type: Number }
    },
    images: [{ type: String }],
    openingTime: { type: String, default: '09:00' },
    closingTime: { type: String, default: '18:00' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShopSettings', shopSettingsSchema);
