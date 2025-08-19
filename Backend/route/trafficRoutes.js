// routes/trafficRoute.js
const express = require('express');
const router = express.Router();
const { getLiveTraffic } = require('../Controllers/trafficController');

// Route: GET /api/traffic/live
router.get('/live', getLiveTraffic);

module.exports = router;
