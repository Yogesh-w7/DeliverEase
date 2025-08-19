const express = require("express");
const router = express.Router();
const parcelController = require("../controllers/parcelController");

// GET all parcels
router.get("/", parcelController.getAllParcels);

// POST a new parcel
router.post("/", parcelController.createParcel);

// GET a single parcel by ID (optional)
router.get("/:id", parcelController.getParcelById);

// UPDATE a parcel by ID (optional)
router.put("/:id", parcelController.updateParcel);

// DELETE a parcel by ID (optional)
router.delete("/:id", parcelController.deleteParcel);

module.exports = router;
