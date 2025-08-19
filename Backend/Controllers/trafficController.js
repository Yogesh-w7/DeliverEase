// Controllers/trafficController.js
const axios = require('axios');

const getLiveTraffic = async (req, res) => {
  try {
    const orsApiKey = process.env.ORS_API_KEY;
    if (!orsApiKey) {
      return res.status(500).json({ error: "ORS_API_KEY not configured in environment variables" });
    }

    // Example coordinates: from New York City point A to point B
    const requestBody = {
      coordinates: [
        [-74.006, 40.7128], // start point [lng, lat]
        [-74.002, 40.715],  // end point [lng, lat]
      ],
      // You can add more ORS options here (e.g. avoid areas, traffic info, etc.)
    };

    const response = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car',
      requestBody,
      {
        headers: {
          Authorization: orsApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    // Return the whole response data or parse out relevant traffic info
    return res.json(response.data);

  } catch (error) {
    console.error("Error fetching live traffic:", error.message);
    return res.status(500).json({ error: "Failed to fetch live traffic data" });
  }
};

module.exports = { getLiveTraffic };
