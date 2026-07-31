const Booking = require('../models/Booking');
const Availability = require('../models/Availability');
const Service = require('../models/Service');
const crypto = require('crypto');
const { isValidObjectId } = require('../utils/validators');

const generateBookingCode = () => {
  return 'BKG-' + crypto.randomBytes(4).toString('hex').toUpperCase();
};

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const doTimesOverlap = (start1, end1, start2, end2) => {
  return (start1 < end2 && start2 < end1);
};

const getDayName = (date) => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

// @desc    Get dynamic available slots based on duration
// @route   GET /api/bookings/slots
// @access  Private (Customer)
const getAvailableSlots = async (req, res, next) => {
  try {
    const { date, duration } = req.query; // duration in minutes

    if (!date || !duration) {
      return res.status(400).json({ message: 'Date and duration are required' });
    }
    
    const serviceDuration = parseInt(duration);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      return res.status(400).json({ message: 'Cannot book for a past date' });
    }

    const availability = await Availability.findOne();
    if (!availability) {
      return res.status(500).json({ message: 'Shop availability not configured yet' });
    }

    // 1. Check Working Days
    const dayName = getDayName(targetDate);
    if (availability.workingDays && !availability.workingDays.includes(dayName)) {
      return res.json([]); // Shop is closed this day
    }

    // 2. Check Blocked Dates
    if (availability.blockedDates && availability.blockedDates.length > 0) {
      const isBlocked = availability.blockedDates.some(
        d => new Date(d).getTime() === targetDate.getTime()
      );
      if (isBlocked) {
        return res.json([]); // Shop is blocked for this date
      }
    }

    // Default shop hours if not in Availability (should be in ShopSettings realistically, or Availability. Let's assume Availability handles opening/closing or we hardcode to 9am-6pm for slots if not provided. Wait, Availability doesn't have openingTime/closingTime in our schema. Let's add them to Availability or fetch ShopSettings)
    // Actually, I didn't add openingTime/closingTime to Availability schema, I added them to ShopSettings.
    // Let's fetch ShopSettings to get openingTime and closingTime.
    const ShopSettings = require('../models/ShopSettings');
    const shop = await ShopSettings.findOne();
    const openTimeStr = shop ? shop.openingTime : '09:00';
    const closeTimeStr = shop ? shop.closingTime : '18:00';

    const openMins = timeToMinutes(openTimeStr);
    const closeMins = timeToMinutes(closeTimeStr);

    let minStartMins = openMins;
    const now = new Date();
    if (targetDate.getTime() === today.getTime()) {
      const currentMins = now.getHours() * 60 + now.getMinutes() + 30;
      if (currentMins > minStartMins) {
        minStartMins = currentMins;
      }
    }

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const existingBookings = await Booking.find({
      bookingDate: { $gte: targetDate, $lt: nextDate },
      bookingStatus: { $ne: 'cancelled' }
    });

    const bookedRanges = existingBookings.map(b => ({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime)
    }));

    const breakRanges = (availability.breakTimes || []).map(br => ({
      start: timeToMinutes(br.startTime),
      end: timeToMinutes(br.endTime)
    }));

    const maxSimultaneous = availability.maxSimultaneousBookings || 1;

    const availableSlots = [];
    let currentSlotStart = Math.ceil(minStartMins / 30) * 30; 

    while (currentSlotStart + serviceDuration <= closeMins) {
      const currentSlotEnd = currentSlotStart + serviceDuration;

      const overlapsWithBreak = breakRanges.some(br => 
        doTimesOverlap(currentSlotStart, currentSlotEnd, br.start, br.end)
      );

      if (!overlapsWithBreak) {
        let overlappingCount = 0;
        bookedRanges.forEach(range => {
          if (doTimesOverlap(currentSlotStart, currentSlotEnd, range.start, range.end)) {
            overlappingCount++;
          }
        });

        if (overlappingCount < maxSimultaneous) {
          availableSlots.push({
            startTime: minutesToTime(currentSlotStart),
            endTime: minutesToTime(currentSlotEnd)
          });
        }
      }

      currentSlotStart += 30;
    }

    res.json(availableSlots);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Customer)
const createBooking = async (req, res, next) => {
  try {
    const { serviceId, vehicleId, bookingDate, startTime, endTime, totalAmount } = req.body;

    if (!serviceId || !vehicleId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'Please provide all booking details' });
    }
    if (!isValidObjectId(serviceId) || !isValidObjectId(vehicleId)) {
      return res.status(400).json({ message: 'Invalid ID format in request' });
    }

    const targetDate = new Date(bookingDate);
    targetDate.setHours(0,0,0,0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      return res.status(400).json({ message: 'Cannot book for a past date' });
    }

    const availability = await Availability.findOne();
    if (!availability) return res.status(500).json({ message: 'Shop availability not configured yet' });

    const dayName = getDayName(targetDate);
    if (availability.workingDays && !availability.workingDays.includes(dayName)) {
      return res.status(400).json({ message: 'The shop is closed on this day.' });
    }

    if (availability.blockedDates) {
      const isBlocked = availability.blockedDates.some(
        d => new Date(d).getTime() === targetDate.getTime()
      );
      if (isBlocked) {
        return res.status(400).json({ message: 'The shop is closed on this specific date.' });
      }
    }

    const requestedStart = timeToMinutes(startTime);
    const requestedEnd = timeToMinutes(endTime);

    const breakRanges = (availability.breakTimes || []).map(br => ({
      start: timeToMinutes(br.startTime),
      end: timeToMinutes(br.endTime)
    }));
    const overlapsWithBreak = breakRanges.some(br => 
      doTimesOverlap(requestedStart, requestedEnd, br.start, br.end)
    );
    if (overlapsWithBreak) {
      return res.status(400).json({ message: 'This slot overlaps with the shop\'s break time.' });
    }

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const existingBookings = await Booking.find({
      bookingDate: { $gte: targetDate, $lt: nextDate },
      bookingStatus: { $ne: 'cancelled' }
    });

    let overlappingCount = 0;
    existingBookings.forEach(b => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      if (doTimesOverlap(requestedStart, requestedEnd, bStart, bEnd)) {
        overlappingCount++;
      }
    });

    const maxSimultaneous = availability.maxSimultaneousBookings || 1;

    if (overlappingCount >= maxSimultaneous) {
      return res.status(409).json({ message: 'This time slot just became fully booked. Please select another slot.' });
    }

    const existingUserBooking = await Booking.findOne({
      userId: req.user._id,
      bookingDate: targetDate,
      startTime
    });

    if (existingUserBooking) {
      return res.status(400).json({ message: 'You already have a booking at this exact time.' });
    }

    const booking = await Booking.create({
      userId: req.user._id,
      serviceId,
      vehicleId,
      bookingDate: targetDate,
      startTime,
      endTime,
      totalAmount,
      bookingStatus: 'pending',
      paymentStatus: 'pending',
      bookingCode: generateBookingCode()
    });

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private (Customer/Admin)
const getBookingById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Booking not found (Invalid ID)' });
    }
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId', 'serviceName price duration')
      .populate('vehicleId', 'vehicleNumber vehicleType brand model')
      .populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (
      req.user.role === 'customer' && 
      booking.userId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for logged in user
// @route   GET /api/bookings/my
// @access  Private (Customer)
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('serviceId', 'serviceName price duration')
      .populate('vehicleId', 'vehicleNumber vehicleType brand model')
      .sort({ bookingDate: -1, startTime: -1 });

    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Customer)
const cancelBooking = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Booking not found (Invalid ID)' });
    }
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    if (booking.bookingStatus !== 'pending' && booking.bookingStatus !== 'confirmed') {
      return res.status(400).json({ 
        message: `Booking cannot be cancelled because it is currently ${booking.bookingStatus}` 
      });
    }

    const bookingDateTimeStr = `${booking.bookingDate.toISOString().split('T')[0]}T${booking.startTime}:00`;
    const bookingDateTime = new Date(bookingDateTimeStr);
    
    const now = new Date();
    const diffInMilliseconds = bookingDateTime.getTime() - now.getTime();
    const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

    if (diffInHours < 2) {
      return res.status(400).json({ 
        message: 'Bookings cannot be cancelled less than 2 hours before the appointment time.' 
      });
    }

    booking.bookingStatus = 'cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableSlots,
  createBooking,
  getBookingById,
  getMyBookings,
  cancelBooking
};
