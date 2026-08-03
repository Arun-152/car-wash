const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/carwash')
  .then(async () => {
    const users = await User.find({ role: 'admin' });
    console.log("Admin Users:", users);
    
    // Check if there are any blocked users
    const blocked = await User.find({ isBlocked: true });
    console.log("Blocked Users:", blocked.length);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
