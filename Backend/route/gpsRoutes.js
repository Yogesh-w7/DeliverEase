const express = require('express');
const router = express.Router();
const { getTruckPositions } = require('../Controllers/gpsController');

router.get('/tracking', getTruckPositions);
module.exports = router;
