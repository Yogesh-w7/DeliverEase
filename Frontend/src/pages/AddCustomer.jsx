import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddCustomer = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
      const coords = await geocodeAddress(form.address);

      const res = await fetch("http://localhost:5000/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          lat: coords.lat,
          lng: coords.lng,
        }),
      });

      if (res.ok) {
        alert("✅ Customer added!");
        navigate("/delivery"); // Go back to delivery page
      } else {
        const err = await res.json();
        alert("❌ Failed: " + (err.error || "Something went wrong"));
      }
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Add Customer</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Name"
          required
          value={form.name}
          onChange={handleChange}
        />
        <input
          name="phone"
          placeholder="Phone"
          required
          value={form.phone}
          onChange={handleChange}
        />
        <input
          name="address"
          placeholder="Address"
          required
          value={form.address}
          onChange={handleChange}
        />
        <div style={{ marginTop: "1rem" }}>
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Adding..." : "Add Customer"}
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

export default AddCustomer;
