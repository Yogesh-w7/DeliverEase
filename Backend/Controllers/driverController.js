const Driver = require("../models/Driver");

// Get all drivers
exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().populate("assignedParcels");
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get driver by ID
exports.getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).populate("assignedParcels");
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create driver
exports.createDriver = async (req, res) => {
  try {
    const newDriver = new Driver(req.body);
    await newDriver.save();
    res.status(201).json(newDriver);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update driver
exports.updateDriver = async (req, res) => {
  try {
    const updatedDriver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedDriver) return res.status(404).json({ message: "Driver not found" });
    res.json(updatedDriver);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete driver
exports.deleteDriver = async (req, res) => {
  try {
    const deletedDriver = await Driver.findByIdAndDelete(req.params.id);
    if (!deletedDriver) return res.status(404).json({ message: "Driver not found" });
    res.json({ message: "Driver deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
