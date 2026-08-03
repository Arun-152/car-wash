const User = require('../models/User');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const ShopSettings = require('../models/ShopSettings');
const Availability = require('../models/Availability');
const SlotOverride = require('../models/SlotOverride');
const WalletTransaction = require('../models/WalletTransaction');
const { isValidObjectId } = require('../utils/validators');
const autoUpdateCompletedBookings = require('../utils/autoUpdateStatus');

// ── Shared time helpers ────────────────────────────────────────────────────
const timeToMins = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const minsToTime = (m) =>
  `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
const timesOverlap = (s1, e1, s2, e2) => s1 < e2 && s2 < e1;

// ── Helper: normalize a blockedDates entry (handles old [Date] and new [{date,reason}]) ──
const normalizeBlockedDate = (entry) => {
  if (entry && typeof entry === 'object' && entry.date) {
    const d = new Date(entry.date);
    d.setHours(0, 0, 0, 0);
    return { date: d, reason: entry.reason || '' };
  }
  // legacy plain-date format
  const d = new Date(entry);
  d.setHours(0, 0, 0, 0);
  return { date: d, reason: '' };
};

// ==========================================
// 1. DASHBOARD ANALYTICS
// ==========================================
const getAdminDashboardStats = async (req, res) => {
  try {
    await autoUpdateCompletedBookings();
    
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalBookings = await Booking.countDocuments(Booking.getDashboardValidFilter());
    const cancelledBookings = await Booking.countDocuments({ bookingStatus: 'cancelled' });
    const completedBookings = await Booking.countDocuments({
      bookingStatus: 'completed'
    });

    const revenueResult = await Booking.aggregate([
      { $match: Booking.getDashboardValidFilter() },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysBookings = await Booking.countDocuments({
      bookingDate: { $gte: today, $lt: tomorrow },
      ...Booking.getDashboardValidFilter(),
    });

    // Monthly Chart Data (Jan-Dec) for the current year
    const currentYear = new Date().getFullYear();
    const monthlyStats = await Booking.aggregate([
      {
        $match: {
          bookingDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
          },
          ...Booking.getDashboardValidFilter()
        }
      },
      {
        $group: {
          _id: { $month: "$bookingDate" },
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyChartData = Array.from({ length: 12 }, (_, i) => {
      const monthData = monthlyStats.find(m => m._id === i + 1);
      return {
        month: new Date(0, i).toLocaleString('en', { month: 'short' }),
        count: monthData ? monthData.count : 0
      };
    });

    res.json({
      totalCustomers,
      totalBookings,
      cancelledBookings,
      completedBookings,
      totalRevenue,
      todaysBookings,
      monthlyChartData
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ==========================================
// 1.5 REPORTS
// ==========================================
const getAdminReports = async (req, res) => {
  try {
    await autoUpdateCompletedBookings();
    
    const { timeRange, startDate, endDate, serviceId, status } = req.query;

    const query = {};

    if (timeRange && timeRange !== 'all') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      if (timeRange === 'today') {
        // start and end are already today
      } else if (timeRange === 'week') {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
        start.setDate(diff);
        end.setDate(start.getDate() + 6); // End on Sunday
      } else if (timeRange === 'month') {
        start.setDate(1);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0); // Last day of the month
      } else if (timeRange === 'custom') {
        if (startDate) start.setTime(new Date(startDate).getTime());
        if (endDate) end.setTime(new Date(endDate).getTime());
        end.setHours(23, 59, 59, 999);
      }
      query.bookingDate = { $gte: start, $lte: end };
    }

    if (serviceId && serviceId !== 'all') query.serviceId = serviceId;
    if (status && status !== 'all') {
      if (status === 'completed') {
        query.bookingStatus = { $in: ['completed'] };
      } else {
        query.bookingStatus = status;
      }
    }

    const allBookings = await Booking.find(query)
      .populate('serviceId', 'serviceName')
      .lean();

    const totalBookings = allBookings.length;
    let completedBookings = 0;
    let cancelledBookings = 0;
    let manualBookings = 0;
    let totalRevenue = 0;

    const serviceCounts = {};

    allBookings.forEach(b => {
      if (b.bookingStatus === 'completed') completedBookings++;
      if (b.bookingStatus === 'cancelled') cancelledBookings++;
      if (b.bookingSource === 'admin') manualBookings++;

      const isRevenueValid =
        b.bookingStatus === 'completed' ||
        (b.bookingStatus === 'confirmed' && b.paymentStatus === 'paid') ||
        (b.bookingStatus === 'confirmed' && b.bookingSource === 'admin');

      if (isRevenueValid) {
        totalRevenue += b.totalAmount || 0;
      }

      if (b.serviceId) {
        serviceCounts[b.serviceId.serviceName] = (serviceCounts[b.serviceId.serviceName] || 0) + 1;
      }
    });

    const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

    let mostBookedService = 'N/A';
    let maxServiceCount = 0;
    for (const [name, count] of Object.entries(serviceCounts)) {
      if (count > maxServiceCount) {
        maxServiceCount = count;
        mostBookedService = name;
      }
    }

    const { page, limit } = req.query;
    let bookings;
    let totalPages = 1;
    let currentPage = 1;

    if (page && limit) {
      currentPage = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 5;
      const skip = (currentPage - 1) * limitNum;

      bookings = await Booking.find(query)
        .populate('userId', 'name email phone')
        .populate('serviceId', 'serviceName')
        .populate('vehicleId', 'vehicleNumber brand model vehicleType')
        .sort({ bookingDate: -1, startTime: -1 })
        .skip(skip)
        .limit(limitNum);

      totalPages = Math.ceil(totalBookings / limitNum);
    } else {
      bookings = await Booking.find(query)
        .populate('userId', 'name email phone')
        .populate('serviceId', 'serviceName')
        .populate('vehicleId', 'vehicleNumber brand model vehicleType')
        .sort({ bookingDate: -1, startTime: -1 });
    }

    res.json({
      summary: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        manualBookings,
        totalRevenue,
        avgBookingValue,
        mostBookedService
      },
      bookings,
      totalPages,
      currentPage
    });
  } catch (error) {
    console.error('Reports Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ==========================================
// 2. USER MANAGEMENT
// ==========================================
const getCustomers = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    
    let query = { role: 'customer' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (page && limit) {
      const currentPage = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 5;
      const skip = (currentPage - 1) * limitNum;

      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await User.countDocuments(query);
      return res.json({
        users,
        totalPages: Math.ceil(total / limitNum),
        currentPage
      });
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin')
      return res.status(403).json({ message: 'Cannot block admins' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ==========================================
// 3. SHOP SETTINGS & AVAILABILITY
// ==========================================
const getShopSettings = async (req, res) => {
  try {
    let settings = await ShopSettings.findOne();
    if (!settings) settings = await ShopSettings.create({});
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateShopSettings = async (req, res) => {
  try {
    let settings = await ShopSettings.findOne();
    if (!settings) {
      settings = new ShopSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getAvailability = async (req, res) => {
  try {
    let availability = await Availability.findOne();
    if (!availability) availability = await Availability.create({});
    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateAvailability = async (req, res) => {
  try {
    let availability = await Availability.findOne();
    if (!availability) {
      availability = new Availability(req.body);
    } else {
      Object.assign(availability, req.body);
    }
    await availability.save();
    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ==========================================
// 4. SERVICE MANAGEMENT
// ==========================================
const getServices = async (req, res) => {
  try {
    const { page, limit } = req.query;
    
    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;
      
      const totalDocuments = await Service.countDocuments();
      const services = await Service.find().sort({ createdAt: -1 }).skip(skip).limit(limitNum);
      
      return res.json({ 
        services, 
        totalPages: Math.ceil(totalDocuments / limitNum), 
        currentPage: pageNum 
      });
    }

    let query = Service.find().sort({ createdAt: -1 });
    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }
    const services = await query;
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const addService = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ==========================================
// 5. BOOKING MANAGEMENT
// ==========================================
const getAllBookings = async (req, res) => {
  try {
    await autoUpdateCompletedBookings();
    
    const { page, limit, search, status, date, tab } = req.query;
    let query = {};

    if (search) {
      query.bookingCode = { $regex: search, $options: 'i' };
    }
    if (status) {
      if (status === 'completed') {
        query.bookingStatus = { $in: ['completed'] };
      } else {
        query.bookingStatus = status;
      }
    }
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      query.bookingDate = { $gte: start, $lt: end };
    }
    if (tab === 'cancellations') {
      query.cancellationRequested = true;
      query.bookingStatus = 'cancellation-requested';
    }

    if (page && limit) {
      const currentPage = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 5;
      const skip = (currentPage - 1) * limitNum;

      const bookings = await Booking.find(query)
        .populate('userId', 'name email phone')
        .populate('serviceId', 'serviceName')
        .populate('vehicleId', 'vehicleNumber brand model vehicleType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await Booking.countDocuments(query);
      return res.json({
        bookings,
        totalPages: Math.ceil(total / limitNum),
        currentPage
      });
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'name email phone')
      .populate('serviceId', 'serviceName')
      .populate('vehicleId', 'vehicleNumber brand model vehicleType')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateBookingStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { bookingStatus: status },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ==========================================
// 6. DAILY SLOT MANAGEMENT
// ==========================================

/**
 * @desc  Get all 30-min slots for a specific date with real booking counts
 * @route GET /api/admin/slots/daily?date=YYYY-MM-DD
 * @access Private (Admin)
 */
const getDailySlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'date query param is required' });

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Fetch all needed data in parallel
    const [availability, shop, overrides, bookings] = await Promise.all([
      Availability.findOne(),
      ShopSettings.findOne(),
      SlotOverride.find({ date: { $gte: targetDate, $lt: nextDate } }),
      // Only count bookings that actually occupy a slot:
      //   - completed bookings
      //   - admin manual bookings with confirmed status
      Booking.find({
        bookingDate: { $gte: targetDate, $lt: nextDate },
        ...Booking.getOccupiedSlotFilter(),
      }),
    ]);

    if (!availability || !shop) {
      return res.status(500).json({ message: 'Shop availability is not configured' });
    }

    // Check if selected date is a working day
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    const isWorkingDay = (availability.workingDays || []).includes(dayName);

    // Check if date is blocked
    const isBlockedDate = (availability.blockedDates || []).some((bd) => {
      const { date: bdDate } = normalizeBlockedDate(bd);
      return bdDate.getTime() === targetDate.getTime();
    });

    const openMins = timeToMins(shop.openingTime || '09:00');
    const closeMins = timeToMins(shop.closingTime || '18:00');
    const breakRanges = (availability.breakTimes || []).map((b) => ({
      start: timeToMins(b.startTime),
      end: timeToMins(b.endTime),
    }));
    const globalMaxCap = availability.maxSimultaneousBookings || 1;

    // Build override lookup by startTime
    const overrideMap = {};
    overrides.forEach((o) => {
      overrideMap[o.startTime] = o;
    });

    // Generate 30-min slots
    const slots = [];
    let cursor = openMins;

    while (cursor < closeMins) {
      const slotEnd = cursor + 30;
      const startTime = minsToTime(cursor);
      const endTime = minsToTime(slotEnd);

      const isBreak = breakRanges.some((b) =>
        timesOverlap(cursor, slotEnd, b.start, b.end)
      );

      if (isBreak) {
        slots.push({
          startTime,
          endTime,
          status: 'break',
          capacity: 0,
          booked: 0,
          available: 0,
          overrideId: null,
        });
      } else {
        const override = overrideMap[startTime];

        if (override && override.status === 'blocked') {
          slots.push({
            startTime,
            endTime,
            status: 'blocked',
            capacity: 0,
            booked: 0,
            available: 0,
            overrideId: override._id,
          });
        } else {
          const capacity =
            override && override.status === 'modified' && override.customCapacity != null
              ? override.customCapacity
              : globalMaxCap;

          // Count active bookings that overlap this 30-min window
          const bookedCount = bookings.filter((b) => {
            const bs = timeToMins(b.startTime);
            const be = timeToMins(b.endTime);
            return timesOverlap(cursor, slotEnd, bs, be);
          }).length;

          const available = Math.max(0, capacity - bookedCount);
          const status = available === 0 ? 'full' : 'available';

          slots.push({
            startTime,
            endTime,
            status,
            capacity,
            booked: bookedCount,
            available,
            overrideId: override ? override._id : null,
            isCapacityModified: !!(override && override.status === 'modified'),
          });
        }
      }

      cursor += 30;
    }

    // Daily summary
    const nonBreakSlots = slots.filter((s) => s.status !== 'break');
    const totalSlots = nonBreakSlots.length;
    const blockedCount = nonBreakSlots.filter((s) => s.status === 'blocked').length;
    const fullCount = nonBreakSlots.filter((s) => s.status === 'full').length;
    const availableCapacity = nonBreakSlots
      .filter((s) => s.status === 'available')
      .reduce((sum, s) => sum + s.available, 0);
    // bookedDistinct = only slot-occupying bookings (completed + admin-confirmed)
    const bookedDistinct = bookings.length;

    const { page, limit } = req.query;
    let returnedSlots = slots;
    let totalPages = 1;
    let currentPage = 1;

    if (page && limit) {
      currentPage = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 5;
      const skip = (currentPage - 1) * limitNum;
      
      totalPages = Math.ceil(slots.length / limitNum);
      returnedSlots = slots.slice(skip, skip + limitNum);
    }

    res.json({
      date: targetDate,
      dayName,
      isWorkingDay,
      isBlockedDate,
      shopHours: { openingTime: shop.openingTime, closingTime: shop.closingTime },
      globalCapacity: globalMaxCap,
      summary: {
        totalSlots,
        availableCapacity,
        booked: bookedDistinct,
        full: fullCount,
        blocked: blockedCount,
      },
      slots: returnedSlots,
      totalPages,
      currentPage
    });
  } catch (error) {
    console.error('getDailySlots error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc  Block a specific time slot on a specific date
 * @route POST /api/admin/slots/block
 * @access Private (Admin)
 */
const blockSlot = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: 'date, startTime, and endTime are required' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Check if there are active bookings for this slot — warn but allow blocking
    // (blocking prevents future bookings; existing ones remain unaffected)
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const startMins = timeToMins(startTime);
    const endMins = timeToMins(endTime);

    const activeBookings = await Booking.find({
      bookingDate: { $gte: targetDate, $lt: nextDate },
      bookingStatus: { $ne: 'cancelled' },
    });

    const overlappingBookings = activeBookings.filter((b) => {
      return timesOverlap(startMins, endMins, timeToMins(b.startTime), timeToMins(b.endTime));
    });

    const override = await SlotOverride.findOneAndUpdate(
      { date: targetDate, startTime },
      { date: targetDate, startTime, endTime, status: 'blocked', customCapacity: null },
      { upsert: true, new: true }
    );

    res.json({
      override,
      warning:
        overlappingBookings.length > 0
          ? `${overlappingBookings.length} existing booking(s) overlap this slot. They will be honoured but no new bookings will be accepted.`
          : null,
    });
  } catch (error) {
    console.error('blockSlot error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc  Edit capacity for a specific slot on a specific date
 * @route POST /api/admin/slots/edit-capacity
 * @access Private (Admin)
 */
const editSlotCapacity = async (req, res) => {
  try {
    const { date, startTime, endTime, customCapacity } = req.body;
    if (!date || !startTime || !endTime || customCapacity == null) {
      return res
        .status(400)
        .json({ message: 'date, startTime, endTime, and customCapacity are required' });
    }
    if (Number(customCapacity) < 1) {
      return res.status(400).json({ message: 'Capacity must be at least 1' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const override = await SlotOverride.findOneAndUpdate(
      { date: targetDate, startTime },
      {
        date: targetDate,
        startTime,
        endTime,
        status: 'modified',
        customCapacity: Number(customCapacity),
      },
      { upsert: true, new: true }
    );

    res.json(override);
  } catch (error) {
    console.error('editSlotCapacity error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc  Remove a slot override (unblock or reset capacity)
 * @route DELETE /api/admin/slots/:id
 * @access Private (Admin)
 */
const removeSlotOverride = async (req, res) => {
  try {
    const override = await SlotOverride.findById(req.params.id);
    if (!override) return res.status(404).json({ message: 'Slot override not found' });

    await SlotOverride.findByIdAndDelete(req.params.id);
    res.json({ message: 'Slot override removed successfully' });
  } catch (error) {
    console.error('removeSlotOverride error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const crypto = require('crypto');
const generateBookingCode = () => 'BKG-' + crypto.randomBytes(4).toString('hex').toUpperCase();

/**
 * @desc  Create a manual booking by admin
 * @route POST /api/admin/bookings/manual
 * @access Private (Admin)
 */
const createManualBooking = async (req, res) => {
  try {
    const {
      customerName,
      mobileNumber,
      vehicleNumber,
      vehicleType,
      serviceId,
      notes,
      bookingDate,
      startTime,
      endTime
    } = req.body;

    if (!customerName || !mobileNumber || !vehicleNumber || !serviceId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const Service = require('../models/Service');
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const targetDate = new Date(bookingDate);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Prevent duplicate booking for same vehicle at same time
    const existingVehicleBooking = await Booking.findOne({
      bookingDate: targetDate,
      startTime,
      bookingStatus: { $ne: 'cancelled' },
      'manualVehicleDetails.vehicleNumber': vehicleNumber
    });
    if (existingVehicleBooking) {
      return res.status(400).json({ message: 'A booking for this vehicle already exists at this time.' });
    }

    // Capacity Check
    const availability = await Availability.findOne();
    const globalMaxCap = availability?.maxSimultaneousBookings || 1;

    const override = await SlotOverride.findOne({ date: targetDate, startTime });
    if (override && override.status === 'blocked') {
      return res.status(400).json({ message: 'This slot is blocked.' });
    }

    const capacity = override && override.status === 'modified' && override.customCapacity != null
      ? override.customCapacity
      : globalMaxCap;

    // Capacity Check — only count slot-occupying bookings:
    //   completed bookings or admin-confirmed manual bookings
    const existingBookings = await Booking.find({
      bookingDate: { $gte: targetDate, $lt: nextDate },
      ...Booking.getOccupiedSlotFilter(),
    });

    const timeToMins = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const reqStart = timeToMins(startTime);
    const reqEnd = timeToMins(endTime);

    const timesOverlap = (s1, e1, s2, e2) => Math.max(s1, s2) < Math.min(e1, e2);

    let bookedCount = 0;
    existingBookings.forEach((b) => {
      const bStart = timeToMins(b.startTime);
      const bEnd = timeToMins(b.endTime);
      if (timesOverlap(reqStart, reqEnd, bStart, bEnd)) bookedCount++;
    });

    if (bookedCount >= capacity) {
      return res.status(400).json({ message: 'Slot Full' });
    }

    const booking = await Booking.create({
      serviceId,
      bookingSource: 'admin',
      manualCustomerDetails: { name: customerName, phone: mobileNumber },
      manualVehicleDetails: { vehicleNumber, vehicleType },
      notes,
      bookingDate: targetDate,
      startTime,
      endTime,
      totalAmount: service.price,
      bookingStatus: 'confirmed',
      paymentStatus: 'pending',
      bookingCode: generateBookingCode(),
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('createManualBooking error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc  Approve cancellation request and refund
 * @route PUT /api/admin/bookings/:id/approve-cancel
 * @access Private (Admin)
 */
const approveCancellation = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.bookingStatus !== 'cancellation-requested' && !booking.cancellationRequested) {
      return res.status(400).json({ message: 'Booking is not eligible for cancellation approval' });
    }

    // Refund logic
    if (booking.paymentStatus === 'paid' && booking.totalAmount > 0) {
      if (booking.userId && isValidObjectId(booking.userId)) {
        const user = await User.findById(booking.userId);
        if (user) {
          // Fix for NaN if walletBalance is undefined on old users
          user.walletBalance = (user.walletBalance || 0) + booking.totalAmount;
          await user.save();

          await WalletTransaction.create({
            userId: user._id,
            type: 'Refund',
            amount: booking.totalAmount,
            description: 'Booking Cancelled',
            referenceId: booking.bookingCode
          });
        }
      }
      booking.refundStatus = 'completed';
    }

    // Gracefully handle slotId if it exists (even though it's dynamic in this system)
    if (booking.slotId) {
      // hypothetical slot release logic
      booking.slotId = null;
    }

    booking.bookingStatus = 'cancelled';
    await booking.save();

    res.status(200).json({ message: 'Cancellation approved and refunded', booking });
  } catch (error) {
    console.error("Approve Cancellation Error:", error);
    res.status(500).json({ message: 'Server Error during cancellation approval', error: error.message });
  }
};

/**
 * @desc  Reject cancellation request
 * @route PUT /api/admin/bookings/:id/reject-cancel
 * @access Private (Admin)
 */
const rejectCancellation = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.bookingStatus !== 'cancellation-requested') {
      return res.status(400).json({ message: 'Booking is not pending cancellation' });
    }

    booking.bookingStatus = 'confirmed';
    booking.cancellationReason = booking.cancellationReason
      ? booking.cancellationReason + ' [Cancellation Request Rejected]'
      : 'Cancellation Request Rejected';
    await booking.save();

    res.json({ message: 'Cancellation rejected, booking restored', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ==========================================
// EXPORTS
// ==========================================
module.exports = {
  getAdminDashboardStats,
  getCustomers,
  toggleBlockUser,
  getShopSettings,
  updateShopSettings,
  getAvailability,
  updateAvailability,
  getServices,
  getServiceById,
  addService,
  updateService,
  deleteService,
  getAllBookings,
  updateBookingStatusAdmin,
  // Slot management
  getDailySlots,
  blockSlot,
  editSlotCapacity,
  removeSlotOverride,
  createManualBooking,
  approveCancellation,
  rejectCancellation,
  getAdminReports,
};
