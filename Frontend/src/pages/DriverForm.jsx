import React, { useState } from "react";
import "../styles/DriverForm.css";

const DriverForm = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const geocodeLocation = async (address) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Geocoding API error");
      const data = await res.json();
      if (data.length === 0) return null;
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location.trim()) {
      alert("Please enter a location.");
      return;
    }

    setLoading(true);

    const coords = await geocodeLocation(location);
    if (!coords) {
      alert("Location not found. Please enter a valid address.");
      setLoading(false);
      return;
    }

    const driverData = {
      name,
      phone,
      currentLocation: {
        type: "Point",
        coordinates: [coords.lng, coords.lat], // GeoJSON format
      },
    };

    try {
      const res = await fetch("http://localhost:5000/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(driverData),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Driver added successfully!");
        setName("");
        setPhone("");
        setLocation("");
      } else {
        alert("Error: " + result.error);
      }
    } catch (err) {
      console.error("Add driver error:", err);
      alert("Failed to add driver.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="driver-form-container">
      <h2>Add New Driver</h2>
      <form onSubmit={handleSubmit} className="driver-form">
        <label>
          Name:
          <input
            type="text"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </label>
        <label>
          Phone:
          <input
            type="tel"
            value={phone}
            required
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />
        </label>
        <label>
          Location (Address):
          <input
            type="text"
            value={location}
            required
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter address or location"
            disabled={loading}
          />
        </label>
        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Adding Driver..." : "Add Driver"}
        </button>
      </form>
    </div>
  );
};

export default DriverForm;
