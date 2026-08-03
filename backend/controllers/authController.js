const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const generateToken = require('../utils/generateToken');
const { isValidEmail, isValidPhone } = require('../utils/validators');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
const registerCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: 'Invalid phone format (must be 10 digits)' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'customer'
    });

    if (user) {
      res.status(201).json({
        message: 'Account created successfully. Please login.',
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    next(error);
  }
};


// @desc    Authenticate user & get token (Login for all roles)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (user.isBlocked) {
        return res.status(403).json({ message: 'Your account has been blocked by the admin' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile (Check session)
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get wallet history
// @route   GET /api/auth/wallet/history
// @access  Private
const getWalletHistory = async (req, res, next) => {
  try {
    const { page, limit, type, search } = req.query;

    let query = { userId: req.user._id };

    if (type && type !== 'All') {
      // e.g., type="Credit", we want it case-insensitive
      query.type = { $regex: new RegExp(`^${type}$`, 'i') };
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { referenceId: { $regex: search, $options: 'i' } }
      ];
    }

    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      // We need to fetch the paginated transactions
      const totalDocuments = await WalletTransaction.countDocuments(query);
      const transactions = await WalletTransaction.find(query)
        .sort({ createdAt: -1, date: -1 }) // Ensure consistent sorting
        .skip(skip)
        .limit(limitNum);

      // We also need the global summaries (ignoring pagination & search/type filters, just user global totals)
      const summaryAggregation = await WalletTransaction.aggregate([
        { $match: { userId: req.user._id } },
        {
          $group: {
            _id: { $toLower: "$type" },
            totalAmount: { $sum: "$amount" }
          }
        }
      ]);

      let totalCredits = 0;
      let totalDebits = 0;
      let totalRefunds = 0;

      summaryAggregation.forEach(item => {
        if (item._id === 'credit') totalCredits = item.totalAmount;
        if (item._id === 'debit') totalDebits = item.totalAmount;
        if (item._id === 'refund') totalRefunds = item.totalAmount;
      });

      return res.json({
        transactions,
        totalPages: Math.ceil(totalDocuments / limitNum),
        currentPage: pageNum,
        summary: {
          totalCredits,
          totalDebits,
          totalRefunds
        }
      });
    }

    // Fallback
    const transactions = await WalletTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

// @desc    Change User Password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    // Update password
    user.password = newPassword;
    await user.save(); // pre-save hook will hash it

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        walletBalance: updatedUser.walletBalance
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const user = await User.findOne({ email });

    // Do not reveal whether email exists for security
    if (!user) {
      return res.status(200).json({ message: 'OTP generated successfully.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP directly (no hash) as per requirements
    user.resetPasswordOtp = otp;

    // Set expire (5 minutes)
    user.resetPasswordExpires = Date.now() + 5 * 60 * 1000;

    await user.save();

    console.log("Password Reset OTP:", otp);

    res.status(200).json({ message: 'OTP generated successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and OTP' });
    }

    const user = await User.findOne({ email });

    if (!user || user.resetPasswordOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired.' });
    }

    res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and OTP' });
    }

    const user = await User.findOne({ email });

    if (!user || user.resetPasswordOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired.' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password changed successfully. Please log in again.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCustomer,
  login,
  getMe,
  getWalletHistory,
  changePassword,
  updateProfile,
  forgotPassword,
  verifyOTP,
  resetPassword
};
