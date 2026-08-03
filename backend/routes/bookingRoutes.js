const express = require('express');
const router = express.Router();
const {
  getAvailableSlots,
  createBooking,
  getBookingById,
  getMyBookings,
  requestCancellation
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/my', authorize('customer'), getMyBookings);
router.get('/slots', authorize('customer', 'admin'), getAvailableSlots);
router.post('/', authorize('customer'), createBooking);
router.put('/:id/cancel-request', authorize('customer'), requestCancellation);

router.get('/:id', getBookingById);

module.exports = router;
