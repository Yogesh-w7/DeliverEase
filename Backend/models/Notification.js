const mongoose = require("mongoose");
const NotificationSchema = new mongoose.Schema({
  parcel: { type: mongoose.Schema.Types.ObjectId, ref: "Parcel", required: true },
  status: { type: String, enum: ["pending", "responded", "timed-out"], default: "pending" },
  deadline: { type: Date, required: true }
}, { timestamps: true });
module.exports = mongoose.model("Notification", NotificationSchema);
