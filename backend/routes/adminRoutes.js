const express = require('express');
const router = express.Router();
const {
  getAdminDashboardStats,
  getAdminReports,
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
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Dashboard
router.get('/dashboard', protect, authorize('admin'), getAdminDashboardStats);

// Reports
router.get('/reports', protect, authorize('admin'), getAdminReports);

// Users
router.get('/users', protect, authorize('admin'), getCustomers);
router.put('/users/:id/block', protect, authorize('admin'), toggleBlockUser);

// Shop Settings
router.get('/settings', getShopSettings); // PUBLIC — used on home page + booking page
router.put('/settings', protect, authorize('admin'), updateShopSettings);

// Availability
router.get('/availability', getAvailability); // PUBLIC — booking calendar needs working days & blocked dates
router.put('/availability', protect, authorize('admin'), updateAvailability);

// Services
router.get('/services', getServices);           // PUBLIC
router.get('/services/:id', getServiceById);    // PUBLIC
router.post('/services', protect, authorize('admin'), addService);
router.put('/services/:id', protect, authorize('admin'), updateService);
router.delete('/services/:id', protect, authorize('admin'), deleteService);

// Bookings
router.get('/bookings', protect, authorize('admin'), getAllBookings);
router.post('/bookings/manual', protect, authorize('admin'), createManualBooking);
router.put('/bookings/:id/status', protect, authorize('admin'), updateBookingStatusAdmin);
router.put('/bookings/:id/approve-cancel', protect, authorize('admin'), approveCancellation);
router.put('/bookings/:id/reject-cancel', protect, authorize('admin'), rejectCancellation);

// ── Slot Overrides (admin only) ──────────────────────────────────────────
router.get('/slots/daily', protect, authorize('admin'), getDailySlots);
router.post('/slots/block', protect, authorize('admin'), blockSlot);
router.post('/slots/edit-capacity', protect, authorize('admin'), editSlotCapacity);
router.delete('/slots/:id', protect, authorize('admin'), removeSlotOverride);

module.exports = router;
