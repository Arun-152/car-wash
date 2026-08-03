const mongoose = require('mongoose');
const Availability = require('./models/Availability');
const Booking = require('./models/Booking');
const ShopSettings = require('./models/ShopSettings');
const SlotOverride = require('./models/SlotOverride');
require('dotenv').config();

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const doTimesOverlap = (start1, end1, start2, end2) => start1 < end2 && start2 < end1;

const getDayName = (date) => date.toLocaleDateString('en-US', { weekday: 'long' });

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

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/carwash')
  .then(async () => {
    console.log("Connected to DB");

    // Replicate getAvailableSlots logic
    const date = "2026-08-02"; // tomorrow
    const duration = 60;
    
    console.log("Input date:", date);

    const serviceDuration = parseInt(duration);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    console.log("targetDate:", targetDate, targetDate.getTime());

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log("today:", today, today.getTime());

    if (targetDate < today) {
      console.log("Cannot book for a past date");
      return process.exit(0);
    }

    const availability = await Availability.findOne();
    if (!availability) {
      console.log("Shop availability not configured yet");
      return process.exit(0);
    }

    // 1. Check working day
    const dayName = getDayName(targetDate);
    console.log("dayName:", dayName);
    if (availability.workingDays && !availability.workingDays.includes(dayName)) {
      console.log("Working day not included:", dayName, "workingDays:", availability.workingDays);
      return process.exit(0);
    }

    // 2. Check blocked dates
    if (availability.blockedDates && availability.blockedDates.length > 0) {
      const isBlocked = availability.blockedDates.some(
        (bd) => normalizeBlockedDate(bd).getTime() === targetDate.getTime()
      );
      if (isBlocked) {
          console.log("Is Blocked!");
          return process.exit(0);
      }
    }

    // 3. Get shop opening/closing times
    const shop = await ShopSettings.findOne();
    const openTimeStr = shop ? shop.openingTime : '09:00';
    const closeTimeStr = shop ? shop.closingTime : '18:00';

    const openMins = timeToMinutes(openTimeStr);
    const closeMins = timeToMinutes(closeTimeStr);

    let minStartMins = openMins;
    const now = new Date();
    if (targetDate.getTime() === today.getTime()) {
      const currentMins = now.getHours() * 60 + now.getMinutes() + 30;
      if (currentMins > minStartMins) minStartMins = currentMins;
    }

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // 4. Load existing bookings and slot overrides in parallel
    const existingBookings = await Booking.find({
        bookingDate: { $gte: targetDate, $lt: nextDate },
        bookingStatus: { $ne: 'cancelled' },
    });
    const slotOverrides = await SlotOverride.find({ date: { $gte: targetDate, $lt: nextDate } });

    console.log("Bookings:", existingBookings.length);
    console.log("Overrides:", slotOverrides.length);

    const bookedRanges = existingBookings.map((b) => ({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime),
    }));

    const breakRanges = (availability.breakTimes || []).map((br) => ({
      start: timeToMinutes(br.startTime),
      end: timeToMinutes(br.endTime),
    }));

    const globalMaxSimultaneous = availability.maxSimultaneousBookings || 1;

    const overrideMap = {};
    slotOverrides.forEach((o) => {
      overrideMap[o.startTime] = o;
    });

    const availableSlots = [];
    let currentSlotStart = Math.ceil(minStartMins / 30) * 30;
    
    console.log("minStartMins:", minStartMins, "currentSlotStart:", currentSlotStart, "closeMins:", closeMins);

    while (currentSlotStart + serviceDuration <= closeMins) {
      const currentSlotEnd = currentSlotStart + serviceDuration;
      const startTimeStr = minutesToTime(currentSlotStart);

      const override = overrideMap[startTimeStr];
      if (override && override.status === 'blocked') {
        currentSlotStart += 30;
        continue;
      }

      const overlapsWithBreak = breakRanges.some((br) =>
        doTimesOverlap(currentSlotStart, currentSlotEnd, br.start, br.end)
      );

      if (!overlapsWithBreak) {
        const effectiveCapacity =
          override && override.status === 'modified' && override.customCapacity != null
            ? override.customCapacity
            : globalMaxSimultaneous;

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
          });
        }
      }

      currentSlotStart += 30; // increments by 30 minutes!
    }

    console.log("Available Slots:", availableSlots);

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
