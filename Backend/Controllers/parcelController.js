const Parcel = require("../models/Parcel");

// GET all parcels
exports.getAllParcels = async (req, res) => {
  try {
    const parcels = await Parcel.find().populate("customer assignedDriver routeId");
    res.json(parcels);
  } catch (err) {
    console.error("[GET ALL] Parcel error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET one parcel by ID
exports.getParcelById = async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id).populate("customer assignedDriver routeId");

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    res.json(parcel);
  } catch (err) {
    console.error("[GET BY ID] Parcel error:", err);
    res.status(500).json({ error: err.message });
  }
};

// POST create parcel
exports.createParcel = async (req, res) => {
  try {
    const { id, customer, priority, location } = req.body;

    if (!id || !customer || !priority || !location) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    // Validate GeoJSON location
    if (
      location.type !== "Point" ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2 ||
      typeof location.coordinates[0] !== "number" ||
      typeof location.coordinates[1] !== "number"
    ) {
      return res.status(400).json({ error: "Invalid GeoJSON location format" });
    }

    const newParcel = new Parcel({
      id,
      customer,
      priority,
      location,
    });

    await newParcel.save();
    res.status(201).json(newParcel);
  } catch (err) {
    console.error("[CREATE] Parcel error:", err);
    res.status(400).json({ error: err.message });
  }
};

// PUT update parcel
exports.updateParcel = async (req, res) => {
  try {
    const { location, ...rest } = req.body;
    const updatedData = { ...rest };

    if (location) {
      // Validate GeoJSON location
      if (
        location.type !== "Point" ||
        !Array.isArray(location.coordinates) ||
        location.coordinates.length !== 2 ||
        typeof location.coordinates[0] !== "number" ||
        typeof location.coordinates[1] !== "number"
      ) {
        return res.status(400).json({ error: "Invalid GeoJSON location format" });
      }

      updatedData.location = location;
    }

    const updatedParcel = await Parcel.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    if (!updatedParcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    res.json(updatedParcel);
  } catch (err) {
    console.error("[UPDATE] Parcel error:", err);
    res.status(400).json({ error: err.message });
  }
};

// DELETE parcel
exports.deleteParcel = async (req, res) => {
  try {
    const deletedParcel = await Parcel.findByIdAndDelete(req.params.id);
    if (!deletedParcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    res.json({ message: "Parcel deleted" });
  } catch (err) {
    console.error("[DELETE] Parcel error:", err);
    res.status(500).json({ error: err.message });
  }
};
