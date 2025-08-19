import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DeliveryPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    id: "",
    customer: "",
    location: "",
    priority: 1,
  });

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch customers from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/customers")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched customers:", data);
        setCustomers(data);
      })
      .catch((err) => console.error("Failed to load customers:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const geocodeAddress = async (address) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    } else {
      throw new Error("Address not found");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const coords = await geocodeAddress(form.location);

      const delivery = {
        id: form.id.trim(),
        customer: form.customer, // ObjectId string
        location: {
          type: "Point",
          coordinates: [coords.lng, coords.lat],
        },
        priority: Number(form.priority),
      };

      console.log("Sending delivery:", delivery);

      const res = await fetch("http://localhost:5000/api/parcels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(delivery),
      });

      if (res.ok) {
        alert("✅ Delivery added successfully!");
        navigate("/");
      } else {
        const errorData = await res.json();
        alert("❌ Failed: " + (errorData.error || JSON.stringify(errorData)));
      }
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Add New Delivery</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="id"
          placeholder="Delivery ID"
          required
          value={form.id}
          onChange={handleChange}
        />

        <select
          name="customer"
          value={form.customer}
          onChange={handleChange}
          required
        >
          <option value="">Select Customer</option>
          {Array.isArray(customers) && customers.length > 0 ? (
            customers.map((cust) => (
              <option key={cust._id} value={cust._id}>
                {typeof cust.name === "string" ? cust.name : "Unnamed Customer"}
              </option>
            ))
          ) : (
            <option disabled>No customers found</option>
          )}
        </select>

        <input
          name="location"
          placeholder="Delivery Address"
          required
          value={form.location}
          onChange={handleChange}
        />
        <input
          name="priority"
          type="number"
          min="1"
          max="5"
          required
          value={form.priority}
          onChange={handleChange}
        />
        <div style={{ marginTop: "1rem" }}>
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Adding..." : "Add Delivery"}
          </button>
          <button
            type="button"
            className="outline-btn"
            style={{ marginLeft: "10px" }}
            onClick={() => navigate("/")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeliveryPage;
