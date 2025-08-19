const PerformanceMetric = require("../models/PerformanceMetric");

// Get all performance metrics
exports.getAllMetrics = async (req, res) => {
  try {
    const metrics = await PerformanceMetric.find();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add/update metric for supplier
exports.upsertMetric = async (req, res) => {
  try {
    const { supplierId, supplierName, onTimeRate, lateCount, complianceScore } = req.body;
    let metric = await PerformanceMetric.findOne({ supplierId });
    if (metric) {
      metric.onTimeRate = onTimeRate;
      metric.lateCount = lateCount;
      metric.complianceScore = complianceScore;
      await metric.save();
    } else {
      metric = new PerformanceMetric({ supplierId, supplierName, onTimeRate, lateCount, complianceScore });
      await metric.save();
    }
    res.json(metric);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

