const mongoose = require('mongoose');
const { getAvailableSlots } = require('./controllers/bookingController');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/carwash')
  .then(async () => {
    console.log("Connected to DB");

    const req = {
      query: {
        date: "2026-08-02",
        duration: "60"
      }
    };

    const res = {
      status: function(code) {
        console.log("STATUS:", code);
        return this;
      },
      json: function(data) {
        console.log("JSON RESPONSE:", data);
        process.exit(0);
      }
    };

    const next = function(err) {
      console.error("ERROR IN NEXT:", err);
      process.exit(1);
    };

    await getAvailableSlots(req, res, next);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
