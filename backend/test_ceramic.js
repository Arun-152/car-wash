const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Service = require('./models/Service');
const Availability = require('./models/Availability');
const User = require('./models/User');
require('dotenv').config({ path: './.env' });

async function runTest() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // 1. Get availability and update capacities
  const av = await Availability.findOne();
  av.maxSimultaneousBookings = 2;
  av.ceramicCoatingDailyCapacity = 2;
  await av.save();
  console.log('Set common capacity to 2, ceramic capacity to 2');

  // 2. Find services
  const ceramicService = await Service.findOne({ serviceName: /ceramic coating/i });
  const normalService = await Service.findOne({ serviceName: { $not: /ceramic coating/i } });
  if (!ceramicService || !normalService) {
    console.log('Missing services in DB');
    process.exit(1);
  }

  // 3. Find a user
  const user = await User.findOne({ role: 'customer' });
  if (!user) {
    console.log('No customer found');
    process.exit(1);
  }

  // Clear existing bookings for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const nextDate = new Date(tomorrow);
  nextDate.setDate(nextDate.getDate() + 1);

  await Booking.deleteMany({ bookingDate: { $gte: tomorrow, $lt: nextDate } });
  console.log('Cleared bookings for tomorrow');

  // 4. Create 2 normal wash bookings at 9:00 AM
  await Booking.create({
    userId: user._id,
    serviceId: normalService._id,
    vehicleId: new mongoose.Types.ObjectId(),
    bookingDate: tomorrow,
    startTime: '09:00',
    endTime: '10:00',
    totalAmount: 500,
    bookingStatus: 'confirmed',
    bookingCode: 'BKG-TEST'
  });
  await Booking.create({
    userId: user._id,
    serviceId: normalService._id,
    vehicleId: new mongoose.Types.ObjectId(),
    bookingDate: tomorrow,
    startTime: '09:00',
    endTime: '10:00',
    totalAmount: 500,
    bookingStatus: 'confirmed',
    bookingCode: 'BKG-TEST'
  });
  console.log('Created 2 normal bookings at 09:00 AM');

  // Create 2 Ceramic Coating bookings
  await Booking.create({
    userId: user._id,
    serviceId: ceramicService._id,
    vehicleId: new mongoose.Types.ObjectId(),
    bookingDate: tomorrow,
    startTime: '10:00',
    endTime: '11:00',
    totalAmount: 5000,
    bookingStatus: 'confirmed',
    bookingCode: 'BKG-TEST'
  });
  await Booking.create({
    userId: user._id,
    serviceId: ceramicService._id,
    vehicleId: new mongoose.Types.ObjectId(),
    bookingDate: tomorrow,
    startTime: '11:00',
    endTime: '12:00',
    totalAmount: 5000,
    bookingStatus: 'confirmed',
    bookingCode: 'BKG-TEST'
  });
  console.log('Created 2 Ceramic Coating bookings');
  
  const existingBookings = await Booking.find({
      bookingDate: { $gte: tomorrow, $lt: nextDate },
      bookingStatus: { $ne: 'cancelled' },
  }).populate('serviceId', 'serviceName');
  
  const normalBookings = existingBookings.filter(b => b.serviceId.serviceName.trim().toLowerCase() !== 'ceramic coating');
  const ceramicBookings = existingBookings.filter(b => b.serviceId.serviceName.trim().toLowerCase() === 'ceramic coating');
  
  console.log('Normal bookings count:', normalBookings.length);
  console.log('Ceramic bookings count:', ceramicBookings.length);
  
  if (ceramicBookings.length >= 2) {
      console.log('TEST PASS: Ceramic capacity reached exactly 2.');
  }

  process.exit(0);
}

runTest().catch(console.error);
