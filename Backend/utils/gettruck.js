const getTruckLatLng = (truck) => {
  if (truck.location && truck.location.lat !== undefined && truck.location.lng !== undefined) {
    return [truck.location.lat, truck.location.lng];
  }

  if (
    truck.currentLocation &&
    Array.isArray(truck.currentLocation.coordinates) &&
    truck.currentLocation.coordinates.length === 2
  ) {
    // GeoJSON is [lng, lat], so reverse it
    return [truck.currentLocation.coordinates[1], truck.currentLocation.coordinates[0]];
  }

  return null; // fallback: no valid location
};
module.exports = getTruckLatLng;