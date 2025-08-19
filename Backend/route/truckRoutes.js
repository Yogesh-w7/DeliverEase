const express = require("express");
const router = express.Router();

// Dummy truck list
router.get("/", (req, res) => {
  res.json([
    {
      id: "T001",
      lat: 40.715,
      lng: -74.002,
      driver: "John Davis",
      parcels: 10,
      progress: 50,
    },
    {
      id: "T002",
      lat: 40.720,
      lng: -74.001,
      driver: "Emma Green",
      parcels: 8,
      progress: 60,
    },
  ]);
});

module.exports = router;
