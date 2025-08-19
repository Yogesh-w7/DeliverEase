const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  address: String,
  lat: {
    type: Number,
    required: true,
  },
  lng: {
    type: Number,
    required: true,
  },
  availability: {
    start: { type: Date },
    end: { type: Date },
  },
  confirmed: { type: Boolean, default: false },
}, { timestamps: true });

// Virtual GeoJSON location (optional if needed)
CustomerSchema.virtual("location").get(function () {
  return {
    type: "Point",
    coordinates: [this.lng, this.lat],
  };
});

CustomerSchema.set("toJSON", { virtuals: true });
CustomerSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Customer", CustomerSchema);
