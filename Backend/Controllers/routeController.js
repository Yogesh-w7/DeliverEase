const Route = require("../models/Route");
const { optimizeRoute } = require("../utils/routeOptimizer");
const Parcel = require("../models/Parcel");
const Driver = require("../models/Driver");

// Set your depot coordinates here (lng, lat)
const DEPOT_COORDS = [79.0820556, 21.1498134]; // <-- Replace with your actual depot location

// Get all routes
exports.getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find().populate("driverId parcels");
    res.json(routes);
  } catch (err) {
    console.error("getAllRoutes error:", err);
    res.status(500).json({ error: "Failed to fetch routes" });
  }
};

// Get route by ID
exports.getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id).populate("driverId parcels");
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }
    res.json(route);
  } catch (err) {
    console.error("getRouteById error:", err);
    res.status(500).json({ error: "Failed to fetch route" });
  }
};

// Create new route
exports.createRoute = async (req, res) => {
  try {
    const { driverId, parcels } = req.body;

    if (!driverId || !Array.isArray(parcels) || parcels.length === 0) {
      return res.status(400).json({ error: "driverId and parcels array are required" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    const parcelDocs = await Parcel.find({ _id: { $in: parcels } });
    if (parcelDocs.length !== parcels.length) {
      return res.status(404).json({ error: "One or more parcels not found" });
    }

    // Validate parcels have valid GeoJSON location coordinates
    for (const parcel of parcelDocs) {
      if (
        !parcel.location ||
        parcel.location.type !== "Point" ||
        !Array.isArray(parcel.location.coordinates) ||
        parcel.location.coordinates.length !== 2 ||
        parcel.location.coordinates.some((c) => typeof c !== "number")
      ) {
        return res.status(400).json({
          error: `Parcel with id ${parcel._id} does not have valid location coordinates`,
        });
      }
    }

    console.log("Optimizing route for parcels:", parcelDocs.map(p => p._id));
    const optimizedPath = await optimizeRoute(parcelDocs, DEPOT_COORDS);
    console.log("Optimized path received:", optimizedPath);

    const newRoute = new Route({
      driverId,
      parcels,
      optimizedPath,
      status: "pending",
    });

    await newRoute.save();

    // Update parcels to reference this new route
    await Parcel.updateMany(
      { _id: { $in: parcels } },
      { routeId: newRoute._id }
    );

    res.status(201).json(newRoute);
  } catch (err) {
    console.error("createRoute error:", err);
    res.status(500).json({ error: "Failed to create route", details: err.message });
  }
};

// Update route (including re-optimization)
exports.updateRoute = async (req, res) => {
  try {
    const { parcels } = req.body;

    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    if (!Array.isArray(parcels) || parcels.length === 0) {
      return res.status(400).json({ error: "parcels must be a non-empty array" });
    }

    const parcelDocs = await Parcel.find({ _id: { $in: parcels } });
    if (parcelDocs.length !== parcels.length) {
      return res.status(404).json({ error: "One or more parcels not found" });
    }

    // Validate parcels have valid GeoJSON location coordinates
    for (const parcel of parcelDocs) {
      if (
        !parcel.location ||
        parcel.location.type !== "Point" ||
        !Array.isArray(parcel.location.coordinates) ||
        parcel.location.coordinates.length !== 2 ||
        parcel.location.coordinates.some((c) => typeof c !== "number")
      ) {
        return res.status(400).json({
          error: `Parcel with id ${parcel._id} does not have valid location coordinates`,
        });
      }
    }

    // Update parcels and re-optimize route
    route.parcels = parcels;
    route.optimizedPath = await optimizeRoute(parcelDocs, DEPOT_COORDS);

    // Clear old route references from previous parcels
    await Parcel.updateMany({ routeId: route._id }, { $unset: { routeId: "" } });

    // Assign new parcels to this route
    await Parcel.updateMany(
      { _id: { $in: parcels } },
      { routeId: route._id }
    );

    await route.save();

    res.json(route);
  } catch (err) {
    console.error("updateRoute error:", err);
    res.status(500).json({ error: "Failed to update route", details: err.message });
  }
};

// Delete route
exports.deleteRoute = async (req, res) => {
  try {
    const deletedRoute = await Route.findByIdAndDelete(req.params.id);
    if (!deletedRoute) {
      return res.status(404).json({ message: "Route not found" });
    }

    // Remove route reference from parcels
    await Parcel.updateMany(
      { routeId: deletedRoute._id },
      { $unset: { routeId: "" } }
    );

    res.json({ message: "Route deleted" });
  } catch (err) {
    console.error("deleteRoute error:", err);
    res.status(500).json({ error: "Failed to delete route", details: err.message });
  }
};
