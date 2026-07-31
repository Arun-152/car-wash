const express = require('express');
const router = express.Router();
const {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All vehicle routes require the user to be logged in and have the 'customer' role
router.use(protect);
router.use(authorize('customer'));

router.route('/')
  .get(getVehicles)
  .post(addVehicle);

router.route('/:id')
  .put(updateVehicle)
  .delete(deleteVehicle);

module.exports = router;
