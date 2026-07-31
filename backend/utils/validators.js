const mongoose = require('mongoose');

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  // Simple 10 digit validation
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
};

module.exports = {
  isValidObjectId,
  isValidEmail,
  isValidPhone
};
