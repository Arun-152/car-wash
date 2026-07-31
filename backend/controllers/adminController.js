const User = require('../models/User');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const ShopSettings = require('../models/ShopSettings');
const Availability = require('../models/Availability');
const { isValidObjectId } = require('../utils/validators');

// ==========================================
// 1. DASHBOARD ANALYTICS
// ==========================================
const getAdminDashboardStats = async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalBookings = await Booking.countDocuments();
    const cancelledBookings = await Booking.countDocuments({ bookingStatus: 'cancelled' });
    const completedWashes = await Booking.countDocuments({ bookingStatus: 'completed' });
    
    const revenueResult = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysRevenueResult = await Booking.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const todaysRevenue = todaysRevenueResult.length > 0 ? todaysRevenueResult[0].total : 0;
    
    const todaysBookings = await Booking.countDocuments({ bookingDate: { $gte: today, $lt: tomorrow } });
    const upcomingBookings = await Booking.countDocuments({ bookingDate: { $gte: tomorrow }, bookingStatus: { $in: ['pending', 'confirmed'] } });

    const recentBookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('serviceId', 'serviceName')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalCustomers,
      totalBookings,
      cancelledBookings,
      completedWashes,
      totalRevenue,
      todaysRevenue,
      todaysBookings,
      upcomingBookings,
      recentBookings
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ==========================================
// 2. USER MANAGEMENT
// ==========================================
const getCustomers = async (req, res) => {
  try {
    const users = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot block admins' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, user });
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
    const services = await Service.find().sort({ createdAt: -1 });
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
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
    const bookings = await Booking.find()
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
  updateBookingStatusAdmin
};
