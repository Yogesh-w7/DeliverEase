const mongoose = require("mongoose");

const parcelSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },

  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    default: null,
  },

  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
    default: null,
  },

  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
      default: "Point",
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
      validate: {
        validator: function (v) {
          return (
            Array.isArray(v) &&
            v.length === 2 &&
            typeof v[0] === "number" &&
            typeof v[1] === "number"
          );
        },
        message: "Coordinates must be [lng, lat] as numbers",
      },
    },
  },

  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 1,
  },

  status: {
    type: String,
    enum: ["pending", "in-transit", "delivered", "skipped"],
    default: "pending",
  },

  scheduledTime: {
    type: Date,
    default: null,
  },
});

// Geospatial index
parcelSchema.index({ location: "2dsphere" });

// Virtuals for lat/lng
parcelSchema.virtual("lat").get(function () {
  return this.location?.coordinates?.[1];
});
parcelSchema.virtual("lng").get(function () {
  return this.location?.coordinates?.[0];
});

parcelSchema.set("toJSON", { virtuals: true });
parcelSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Parcel", parcelSchema);
