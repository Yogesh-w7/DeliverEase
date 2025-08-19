require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const notificationFallback = require("./utils/fallbackJob");

const parcelRoutes = require("./route/parcelRoutes");
const driverRoutes = require("./route/driverRoutes");
const customerRoutes = require("./route/customerRoutes");
const routeRoutes = require("./route/routes");
const notificationRoutes = require("./route/notificationRoutes");
const metricsRoutes = require("./route/metricsRoutes");
const trafficRoute = require('./route/trafficRoutes');
const gpsRoutes = require("./route/gpsRoutes");





const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Start cron job to handle timeouts
notificationFallback();

// API endpoints
app.use("/api/parcels", parcelRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/metrics", metricsRoutes);
app.use('/api/traffic', trafficRoute);
app.use("/api/gps", gpsRoutes);
app.get("/", (req, res) => res.send("Walmart Delivery Hub Backend"));

module.exports = app;