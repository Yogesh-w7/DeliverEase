const express = require("express");
const router = express.Router();
const notificationController = require("../Controllers/notificationController");

router.post("/ping", notificationController.pingCustomer);
router.post("/response", notificationController.receiveResponse);

module.exports = router;
