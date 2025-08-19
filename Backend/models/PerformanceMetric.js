const mongoose = require("mongoose");
const PerfSchema = new mongoose.Schema({
  supplierId: String,
  supplierName: String,
  onTimeRate: Number,
  lateCount: Number,
  complianceScore: Number,
}, { timestamps: true });
module.exports = mongoose.model("PerformanceMetric", PerfSchema);
