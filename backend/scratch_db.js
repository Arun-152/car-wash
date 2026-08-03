const mongoose = require('mongoose');
const Availability = require('./models/Availability');
const Booking = require('./models/Booking');
const ShopSettings = require('./models/ShopSettings');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/carwash')
  .then(async () => {
    console.log("Connected to DB");
    const avail = await Availability.findOne();
    console.log("Availability:", JSON.stringify(avail, null, 2));

    const shop = await ShopSettings.findOne();
    console.log("ShopSettings:", JSON.stringify(shop, null, 2));

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
