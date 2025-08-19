const axios = require("axios");

/**
 * Optimize route with parcels and depot location
 * @param {Array} parcels - Array of parcel documents with valid GeoJSON location
 * @param {Array} depotCoords - Array with [lng, lat] of depot/start and end location
 * @returns {Object} optimization result from OpenRouteService API
 */
async function optimizeRoute(parcels, depotCoords) {
  if (!Array.isArray(parcels) || parcels.length === 0) {
    throw new Error("Parcels array must be a non-empty array");
  }

  if (
    !Array.isArray(depotCoords) ||
    depotCoords.length !== 2 ||
    typeof depotCoords[0] !== "number" ||
    typeof depotCoords[1] !== "number"
  ) {
    throw new Error("Depot coordinates must be an array of two numbers: [lng, lat]");
  }

  // Prepare jobs for the optimization API, validating location for each parcel
  const jobs = parcels.map((p, idx) => {
    if (
      !p.location ||
      !Array.isArray(p.location.coordinates) ||
      p.location.coordinates.length !== 2 ||
      typeof p.location.coordinates[0] !== "number" ||
      typeof p.location.coordinates[1] !== "number"
    ) {
      throw new Error(`Parcel with id ${p._id} does not have valid location coordinates`);
    }

    return {
      id: idx + 1,
      location: p.location.coordinates, // Format: [lng, lat]
    };
  });

  // Vehicle data — use depotCoords for start/end location
  const vehicles = [
    {
      id: 1,
      profile: "driving-car",
      start: depotCoords,
      end: depotCoords,
    },
  ];

  const body = { jobs, vehicles };

  try {
    // Call OpenRouteService Optimization API
    const response = await axios.post(
      "https://api.openrouteservice.org/optimization",
      body,
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error calling OpenRouteService optimization API:",
      error.response?.data || error.message
    );
    throw new Error(
      "Failed to optimize route: " + (error.response?.data?.error || error.message)
    );
  }
}

module.exports = { optimizeRoute };
