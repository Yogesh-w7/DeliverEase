const express = require("express");
const router = express.Router();
const metricsController = require("../Controllers/metricsController");

router.get("/", metricsController.getAllMetrics);
router.post("/", metricsController.upsertMetric);

module.exports = router;
