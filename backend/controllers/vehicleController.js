const Vehicle = require('../models/Vehicle');

// @desc    Get logged in user's vehicles
// @route   GET /api/vehicles
// @access  Private (Customer)
const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ userId: req.user._id });
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new vehicle
// @route   POST /api/vehicles
// @access  Private (Customer)
const addVehicle = async (req, res) => {
  try {
    const { vehicleNumber, vehicleType, brand, model } = req.body;

    // Check if vehicle number already exists for this user (optional but good for UX)
    const existingVehicle = await Vehicle.findOne({ userId: req.user._id, vehicleNumber });
    if (existingVehicle) {
      return res.status(400).json({ message: 'You have already added a vehicle with this number.' });
    }

    const vehicle = await Vehicle.create({
      userId: req.user._id,
      vehicleNumber,
      vehicleType,
      brand,
      model
    });

    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Private (Customer)
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    // Check if vehicle exists
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Ensure the vehicle belongs to the logged-in user
    if (vehicle.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to update this vehicle' });
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedVehicle);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (Customer)
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    // Check if vehicle exists
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Ensure the vehicle belongs to the logged-in user
    if (vehicle.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to delete this vehicle' });
    }

    await vehicle.deleteOne();

    res.json({ message: 'Vehicle removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle
};
