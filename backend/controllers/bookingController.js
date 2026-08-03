const Booking = require('../models/Booking');
const Availability = require('../models/Availability');
const SlotOverride = require('../models/SlotOverride');
const Service = require('../models/Service');
const crypto = require('crypto');
const { isValidObjectId } = require('../utils/validators');

const generateBookingCode = () =>
  'BKG-' + crypto.randomBytes(4).toString('hex').toUpperCase();

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const doTimesOverlap = (start1, end1, start2, end2) =>
  start1 < end2 && start2 < end1;

const getDayName = (date) =>
  date.toLocaleDateString('en-US', { weekday: 'long' });

/**
 * Normalize a blockedDate entry — handles both old [Date] and new [{date,reason}] formats.
 */
const normalizeBlockedDate = (entry) => {
  if (entry && typeof entry === 'object' && entry.date) {
    const d = new Date(entry.date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const d = new Date(entry);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get dynamic available slots based on service duration
// @route   GET /api/bookings/slots?date=YYYY-MM-DD&duration=60
// @access  Private (Customer / Admin)
// ─────────────────────────────────────────────────────────────────────────────
const getAvailableSlots = async (req, res, next) => {
  try {
    const { date, duration, serviceId } = req.query;

    if (!date || !duration || !serviceId) {
      return res.status(400).json({ message: 'Date, duration, and serviceId are required' });
    }

    const serviceDuration = parseInt(duration);
    const [y, m, d] = date.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d);
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

    // 1. Check working day
    const dayName = getDayName(targetDate);
    if (availability.workingDays && !availability.workingDays.includes(dayName)) {
      return res.json([]);
    }

    // 2. Check blocked dates (supports both old and new format)
    if (availability.blockedDates && availability.blockedDates.length > 0) {
      const isBlocked = availability.blockedDates.some(
        (bd) => normalizeBlockedDate(bd).getTime() === targetDate.getTime()
      );
      if (isBlocked) return res.json([]);
    }

    // 3. Get shop opening/closing times
    const ShopSettings = require('../models/ShopSettings');
    const shop = await ShopSettings.findOne();
    const openTimeStr = shop ? shop.openingTime : '09:00';
    const closeTimeStr = shop ? shop.closingTime : '18:00';

    const openMins = timeToMinutes(openTimeStr);
    const closeMins = timeToMinutes(closeTimeStr);

    // Advance start for today's bookings (30-min buffer)
    let minStartMins = openMins;
    const now = new Date();
    if (targetDate.getTime() === today.getTime()) {
      const currentMins = now.getHours() * 60 + now.getMinutes() + 30;
      if (currentMins > minStartMins) minStartMins = currentMins;
    }

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // 4. Load existing bookings and slot overrides in parallel
    // Only count bookings that actually occupy a slot:
    //   - completed bookings
    //   - admin manual bookings with confirmed status
    const [existingBookings, slotOverrides] = await Promise.all([
      Booking.find({
        bookingDate: { $gte: targetDate, $lt: nextDate },
        ...Booking.getOccupiedSlotFilter(),
      }).populate('serviceId', 'serviceName'),
      SlotOverride.find({ date: { $gte: targetDate, $lt: nextDate } }),
    ]);

    // For normal wash slots, only count bookings that are NOT Ceramic Coating
    const normalBookings = existingBookings.filter(b =>
      !b.serviceId || b.serviceId.serviceName.trim().toLowerCase() !== 'ceramic coating'
    );

    const bookedRanges = normalBookings.map((b) => ({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime),
    }));

    const breakRanges = (availability.breakTimes || []).map((br) => ({
      start: timeToMinutes(br.startTime),
      end: timeToMinutes(br.endTime),
    }));

    const globalMaxSimultaneous = availability.maxSimultaneousBookings || 1;

    // Build override lookup by startTime
    const overrideMap = {};
    slotOverrides.forEach((o) => {
      overrideMap[o.startTime] = o;
    });

    // Check if the service is Ceramic Coating
    const requestedService = await Service.findById(serviceId);
    const isCeramicCoating = requestedService && requestedService.serviceName.trim().toLowerCase() === 'ceramic coating';

    let ceramicBookingsCount = 0;
    const ceramicDailyCap = availability.ceramicCoatingDailyCapacity || 2;
    if (isCeramicCoating) {
      // Count total Ceramic Coating bookings for this day
      ceramicBookingsCount = existingBookings.filter((b) =>
        b.serviceId && b.serviceId.toString() === serviceId // we assume serviceId matches
      ).length;

      // If we need to populate serviceId in existingBookings to get name, it's better to just check by serviceId directly
      // Wait, we need to populate to check serviceName, or since we know requestedService._id, we just filter by b.serviceId === serviceId.

      // But wait! What if there are multiple "Ceramic Coating" services? 
      // It's safer to populate serviceId and check name.
    }

    // 5. Generate slots
    const availableSlots = [];
    let currentSlotStart = Math.ceil(minStartMins / serviceDuration) * serviceDuration;
    // ensure we don't start before shop opens if we rounded differently
    if (currentSlotStart < minStartMins) currentSlotStart = minStartMins;

    while (currentSlotStart + serviceDuration <= closeMins) {
      const currentSlotEnd = currentSlotStart + serviceDuration;
      const startTimeStr = minutesToTime(currentSlotStart);

      // Check blocked override — if admin blocked this slot, skip it entirely
      const override = overrideMap[startTimeStr];
      if (override && override.status === 'blocked') {
        currentSlotStart += serviceDuration;
        continue;
      }

      // Check break overlap
      const overlapsWithBreak = breakRanges.some((br) =>
        doTimesOverlap(currentSlotStart, currentSlotEnd, br.start, br.end)
      );

      if (!overlapsWithBreak) {
        if (isCeramicCoating) {
          // Ceramic Coating Logic: Use daily capacity, ignore simultaneous slot overlaps
          if (ceramicBookingsCount < ceramicDailyCap) {
            availableSlots.push({
              startTime: startTimeStr,
              endTime: minutesToTime(currentSlotEnd),
              capacity: ceramicDailyCap,
              booked: ceramicBookingsCount,
              available: ceramicDailyCap - ceramicBookingsCount
            });
          }
        } else {
          // Normal Wash Logic: Use slot-based capacity
          const effectiveCapacity =
            override && override.status === 'modified' && override.customCapacity != null
              ? override.customCapacity
              : globalMaxSimultaneous;

          // Count ONLY normal wash bookings overlapping this slot
          let overlappingCount = 0;
          bookedRanges.forEach((range) => {
            if (doTimesOverlap(currentSlotStart, currentSlotEnd, range.start, range.end)) {
              overlappingCount++;
            }
          });

          if (overlappingCount < effectiveCapacity) {
            availableSlots.push({
              startTime: startTimeStr,
              endTime: minutesToTime(currentSlotEnd),
              capacity: effectiveCapacity,
              booked: overlappingCount,
              available: effectiveCapacity - overlappingCount
            });
          }
        }
      }

      currentSlotStart += serviceDuration;
    }

    res.json(availableSlots);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (Customer)
// ─────────────────────────────────────────────────────────────────────────────
const createBooking = async (req, res, next) => {
  try {
    const { serviceId, vehicleId, bookingDate, startTime, endTime, totalAmount } = req.body;

    if (!serviceId || !vehicleId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'Please provide all booking details' });
    }
    if (!isValidObjectId(serviceId) || !isValidObjectId(vehicleId)) {
      return res.status(400).json({ message: 'Invalid ID format in request' });
    }

    const [y, m, d] = bookingDate.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d);
    targetDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      return res.status(400).json({ message: 'Cannot book for a past date' });
    }

    const availability = await Availability.findOne();
    if (!availability)
      return res.status(500).json({ message: 'Shop availability not configured yet' });

    // Working day check
    const dayName = getDayName(targetDate);
    if (availability.workingDays && !availability.workingDays.includes(dayName)) {
      return res.status(400).json({ message: 'The shop is closed on this day.' });
    }

    // Blocked date check (supports both old and new format)
    if (availability.blockedDates && availability.blockedDates.length > 0) {
      const isBlocked = availability.blockedDates.some(
        (bd) => normalizeBlockedDate(bd).getTime() === targetDate.getTime()
      );
      if (isBlocked) {
        return res.status(400).json({ message: 'The shop is closed on this specific date.' });
      }
    }

    const requestedStart = timeToMinutes(startTime);
    const requestedEnd = timeToMinutes(endTime);

    // Break overlap check
    const breakRanges = (availability.breakTimes || []).map((br) => ({
      start: timeToMinutes(br.startTime),
      end: timeToMinutes(br.endTime),
    }));
    const overlapsWithBreak = breakRanges.some((br) =>
      doTimesOverlap(requestedStart, requestedEnd, br.start, br.end)
    );
    if (overlapsWithBreak) {
      return res
        .status(400)
        .json({ message: "This slot overlaps with the shop's break time." });
    }

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Check slot override — admin may have blocked this exact slot
    const slotOverride = await SlotOverride.findOne({
      date: { $gte: targetDate, $lt: nextDate },
      startTime,
    });
    if (slotOverride && slotOverride.status === 'blocked') {
      return res
        .status(400)
        .json({ message: 'This time slot has been blocked by the admin. Please choose another slot.' });
    }

    // Capacity check
    // Fetch only slot-occupying bookings with populated service
    const existingBookings = await Booking.find({
      bookingDate: { $gte: targetDate, $lt: nextDate },
      ...Booking.getOccupiedSlotFilter(),
    }).populate('serviceId', 'serviceName');

    const requestedService = await Service.findById(serviceId);
    if (!requestedService) {
      return res.status(404).json({ message: 'Service not found' });
    }
    const isCeramicCoating = requestedService.serviceName.trim().toLowerCase() === 'ceramic coating';

    if (isCeramicCoating) {
      // Ceramic Coating capacity logic
      const ceramicBookingsCount = existingBookings.filter(b =>
        b.serviceId && b.serviceId.serviceName.trim().toLowerCase() === 'ceramic coating'
      ).length;

      const ceramicDailyCap = availability.ceramicCoatingDailyCapacity || 2;

      if (ceramicBookingsCount >= ceramicDailyCap) {
        return res.status(409).json({
          message: 'Ceramic Coating daily capacity has been reached for this date. Please select another date.',
        });
      }
    } else {
      // Normal wash capacity logic
      // Filter out Ceramic Coating bookings so they don't consume normal wash slots
      const normalBookings = existingBookings.filter(b =>
        !b.serviceId || b.serviceId.serviceName.trim().toLowerCase() !== 'ceramic coating'
      );

      let overlappingCount = 0;
      normalBookings.forEach((b) => {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        if (doTimesOverlap(requestedStart, requestedEnd, bStart, bEnd)) {
          overlappingCount++;
        }
      });

      // Effective capacity: use slot-level override if present
      const effectiveCapacity =
        slotOverride && slotOverride.status === 'modified' && slotOverride.customCapacity != null
          ? slotOverride.customCapacity
          : availability.maxSimultaneousBookings || 1;

      if (overlappingCount >= effectiveCapacity) {
        return res.status(409).json({
          message: 'This time slot just became fully booked. Please select another slot.',
        });
      }
    }

    // Prevent same user double-booking same slot (only for active bookings)
    const existingUserBooking = await Booking.findOne({
      userId: req.user._id,
      bookingDate: targetDate,
      startTime,
      ...Booking.getOccupiedSlotFilter(),
    });
    if (existingUserBooking) {
      return res
        .status(400)
        .json({ message: 'You already have a booking at this exact time.' });
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
      bookingCode: generateBookingCode(),
    });

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private (Customer / Admin)
// ─────────────────────────────────────────────────────────────────────────────
const getBookingById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Booking not found (Invalid ID)' });
    }
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId', 'serviceName price duration')
      .populate('vehicleId', 'vehicleNumber vehicleType brand model')
      .populate('userId', 'name email phone');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

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

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all bookings for the logged-in user
// @route   GET /api/bookings/my
// @access  Private (Customer)
// ─────────────────────────────────────────────────────────────────────────────
const getMyBookings = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;

    let query = { userId: req.user._id };

    if (status) {
      if (status === 'pending') {
        query.$or = [
          { bookingStatus: { $in: ['pending', 'payment-pending', 'cancellation-requested'] } },
          { paymentStatus: 'pending' }
        ];
      } else if (status === 'completed') {
        query.bookingStatus = { $in: ['confirmed', 'completed'] };
      } else if (status === 'cancelled') {
        query.$or = [
          { bookingStatus: { $in: ['cancelled', 'refunded'] } },
          { paymentStatus: 'refunded' }
        ];
      }
    }

    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const totalDocuments = await Booking.countDocuments(query);
      const bookings = await Booking.find(query)
        .populate('serviceId', 'serviceName price duration')
        .populate('vehicleId', 'vehicleNumber vehicleType brand model')
        .sort({ bookingDate: -1, startTime: -1 })
        .skip(skip)
        .limit(limitNum);

      return res.json({
        bookings,
        totalPages: Math.ceil(totalDocuments / limitNum),
        currentPage: pageNum
      });
    }

    // Fallback for non-paginated requests
    const bookings = await Booking.find(query)
      .populate('serviceId', 'serviceName price duration')
      .populate('vehicleId', 'vehicleNumber vehicleType brand model')
      .sort({ bookingDate: -1, startTime: -1 });

    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Request to cancel a booking
// @route   PUT /api/bookings/:id/cancel-request
// @access  Private (Customer)
// ─────────────────────────────────────────────────────────────────────────────
const requestCancellation = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Booking not found (Invalid ID)' });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    if (
      booking.bookingStatus !== 'pending' &&
      booking.bookingStatus !== 'confirmed'
    ) {
      return res.status(400).json({
        message: `Booking cannot be cancelled because it is currently ${booking.bookingStatus}`,
      });
    }

    const bDate = booking.bookingDate;
    const dateStr = [bDate.getFullYear(), String(bDate.getMonth() + 1).padStart(2, '0'), String(bDate.getDate()).padStart(2, '0')].join('-');
    const bookingDateTimeStr = `${dateStr}T${booking.startTime}:00`;
    const bookingDateTime = new Date(bookingDateTimeStr);
    const diffInHours = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return res.status(400).json({
        message: 'Cancellation requests are only allowed up to 1 hour before the scheduled appointment.',
      });
    }

    booking.bookingStatus = 'cancellation-requested';
    booking.cancellationRequested = true;
    booking.cancellationRequestedAt = new Date();
    booking.cancellationReason = req.body.reason || '';

    await booking.save();

    res.json({ message: 'Cancellation request submitted successfully', booking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableSlots,
  createBooking,
  getBookingById,
  getMyBookings,
  requestCancellation,
};
