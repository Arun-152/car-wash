const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');



router.get('/dashboard', protect, authorize('admin'), getAdminDashboardStats);

router.get('/users', protect, authorize('admin'), getCustomers);
router.put('/users/:id/block', protect, authorize('admin'), toggleBlockUser);

router.get('/settings', getShopSettings); // PUBLIC
router.put('/settings', protect, authorize('admin'), updateShopSettings);

router.get('/availability', protect, authorize('admin'), getAvailability);
router.put('/availability', protect, authorize('admin'), updateAvailability);

router.get('/services', getServices); // PUBLIC
router.get('/services/:id', getServiceById); // PUBLIC
router.post('/services', protect, authorize('admin'), addService);
router.put('/services/:id', protect, authorize('admin'), updateService);
router.delete('/services/:id', protect, authorize('admin'), deleteService);

router.get('/bookings', protect, authorize('admin'), getAllBookings);
router.put('/bookings/:id/status', protect, authorize('admin'), updateBookingStatusAdmin);

module.exports = router;
