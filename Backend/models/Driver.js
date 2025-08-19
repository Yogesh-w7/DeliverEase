const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: true,
  },

  currentLocation: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
      required: true,
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
      default: [79.0821, 21.1498], // Set your depot/default location here
    },
  },

  assignedParcels: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parcel",
    }
  ]
}, { timestamps: true });

// ✅ Geo index for geospatial queries
driverSchema.index({ currentLocation: "2dsphere" });

// ✅ Virtuals to access lat/lng directly
driverSchema.virtual("lat").get(function () {
  return this.currentLocation?.coordinates?.[1];
});
driverSchema.virtual("lng").get(function () {
  return this.currentLocation?.coordinates?.[0];
});

// Include virtuals when converting to JSON or object
driverSchema.set("toJSON", { virtuals: true });
driverSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Driver", driverSchema);
