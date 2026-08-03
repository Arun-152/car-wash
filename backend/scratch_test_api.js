const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const Service = require('./models/Service');
const generateToken = require('./utils/generateToken');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/carwash_db')
  .then(async () => {
    // 1. Get admin
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log("No admin found");
      return process.exit(0);
    }
    
    // 2. Generate token
    const token = generateToken(admin._id);
    console.log("Generated token for", admin.email);

    // 3. Get a service to update
    const service = await Service.findOne();
    if (!service) {
      console.log("No services found");
      return process.exit(0);
    }
    
    console.log("Attempting to update service:", service._id);

    // 4. Update service
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/services/${service._id}`, {
        serviceName: service.serviceName,
        description: service.description,
        price: service.price,
        duration: service.duration,
        isActive: service.isActive
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log("Update SUCCESS:", res.data);
    } catch(e) {
      console.error("Update FAILED:", e.response ? e.response.status + " " + JSON.stringify(e.response.data) : e.message);
    }

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
