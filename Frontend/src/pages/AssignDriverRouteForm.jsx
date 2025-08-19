import React, { useEffect, useState } from "react";
import "../styles/AssignDriverRouteForm.css"; // Assuming you have a CSS file for styling

const AssignDriverRouteForm = () => {
  const [drivers, setDrivers] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedParcels, setSelectedParcels] = useState([]);

  // Fetch drivers and parcels from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/drivers")
      .then((res) => res.json())
      .then(setDrivers)
      .catch((err) => console.error("Driver fetch error:", err));

    fetch("http://localhost:5000/api/parcels")
      .then((res) => res.json())
      .then(setParcels)
      .catch((err) => console.error("Parcel fetch error:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDriver || selectedParcels.length === 0) {
      alert("Please select a driver and at least one parcel");
      return;
    }

    const payload = {
      driverId: selectedDriver,
      parcels: selectedParcels,
    };

    console.log("Submitting route payload:", payload);

    try {
      const response = await fetch("http://localhost:5000/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        data = { error: responseText };
      }

      if (response.ok) {
        alert("Route created successfully!");
        setSelectedDriver("");
        setSelectedParcels([]);
      } else {
        console.error("Response error:", data);
        alert("Failed to create route: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Route creation error:", err);
      alert("Something went wrong while creating the route.");
    }
  };

  return (
    <div className="route-form">
      <h2>Create Route & Assign Driver (Truck)</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Select Driver (Truck):
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            required
          >
            <option value="">-- Choose a driver --</option>
            {drivers.map((driver) => (
              <option key={driver._id} value={driver._id}>
                {driver.name} ({driver.phone})
              </option>
            ))}
          </select>
        </label>

        {selectedDriver && (
          <div className="driver-info-box">
            <h4>Truck Info:</h4>
            {drivers
              .filter((d) => d._id === selectedDriver)
              .map((d) => (
                <ul key={d._id}>
                  <li>
                    <strong>Driver:</strong> {d.name}
                  </li>
                  <li>
                    <strong>Phone:</strong> {d.phone}
                  </li>
                  <li>
                    <strong>Truck Location:</strong>{" "}
                    {d.currentLocation?.lat}, {d.currentLocation?.lng}
                  </li>
                  <li>
                    <strong>Assigned Parcels:</strong> {d.assignedParcels?.length || 0}
                  </li>
                </ul>
              ))}
          </div>
        )}

        <label>
          Select Parcels to Assign:
          <select
            multiple
            value={selectedParcels}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(
                (opt) => opt.value
              );
              setSelectedParcels(selected);
            }}
            required
          >
            {parcels.map((parcel) => (
              <option key={parcel._id} value={parcel._id}>
                #{parcel.id} - {parcel.customer?.name || "N/A"} (Priority {parcel.priority})
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className="primary-btn">
          Assign Route
        </button>
      </form>
    </div>
  );
};

export default AssignDriverRouteForm;
