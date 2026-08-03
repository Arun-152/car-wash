const express = require('express');
const router = express.Router();
const { 
  registerCustomer, 
  login, 
  getMe,
  getWalletHistory,
  changePassword,
  updateProfile,
  forgotPassword,
  verifyOTP,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerCustomer);

router.post('/login', login);

router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.put('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.get('/wallet/history', protect, getWalletHistory);
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);

module.exports = router;
