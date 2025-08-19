const mongoose = require("mongoose");
const RouteSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  parcels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Parcel" }],
  optimizedPath: [{ lat: Number, lng: Number, parcelId: { type: mongoose.Schema.Types.ObjectId, ref: "Parcel" } }],
  status: { type: String, enum: ["pending", "active", "completed"], default: "pending" }
}, { timestamps: true });
module.exports = mongoose.model("Route", RouteSchema);
