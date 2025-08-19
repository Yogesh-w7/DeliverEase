// controllers/gpsController.js
exports.getTruckPositions = async (req, res) => {
  try {
    // Simulate live GPS positions in GeoJSON-style
    const trucks = [
      {
        id: 'T001',
        name: 'Truck A',
        driver: 'Singh',
        assignedParcels: [],
        currentLocation: {
          type: 'Point',
          coordinates: [-74.002, 40.715], // [lng, lat]
        },
      },
      {
        id: 'T002',
        name: 'Truck B',
        driver: 'DORA',
        assignedParcels: [],
        currentLocation: {
          type: 'Point',
          coordinates: [-74.004, 40.713],
        },
      },
    ];

    res.json(trucks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
