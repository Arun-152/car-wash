const axios = require('axios');
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const User = require('./models/User');
const Service = require('./models/Service');
require('dotenv').config({ path: './.env' });

async function testPayment() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Get an existing booking or create one
  let booking = await Booking.findOne({ paymentStatus: 'pending' });
  if (!booking) {
    console.log("No pending booking found, creating one...");
    const user = await User.findOne();
    const service = await mongoose.model('Service').findOne();
    booking = await Booking.create({
      userId: user._id,
      serviceId: service._id,
      bookingDate: new Date(),
      startTime: "10:00",
      endTime: "11:00",
      totalAmount: 500,
      bookingCode: "TEST-" + Date.now()
    });
  }

  // Get user to mock token
  const user = await User.findById(booking.userId);
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  try {
    const res = await axios.post('http://localhost:5000/api/payments/create-order', {
      bookingId: booking._id
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("SUCCESS:", res.data);
  } catch (error) {
    console.error("ERROR from backend:");
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(error.message);
    }
  }
  process.exit(0);
}

testPayment();
