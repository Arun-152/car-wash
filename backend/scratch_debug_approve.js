require('dotenv').config();
const mongoose = require('mongoose');
const { approveCancellation } = require('./controllers/adminController');
const Booking = require('./models/Booking');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const pendingCancellationBooking = await Booking.findOne({ bookingStatus: 'cancellation-requested' });
  
  if (!pendingCancellationBooking) {
    console.log('No pending cancellation booking found.');
    process.exit(0);
  }

  const req = {
    params: { id: pendingCancellationBooking._id.toString() }
  };
  const res = {
    status: (code) => {
      console.log('Status set to:', code);
      return res;
    },
    json: (data) => {
      console.log('JSON response:', data);
    }
  };

  await approveCancellation(req, res);
  process.exit(0);
};

run().catch(console.error);
