import React, { useState } from "react";
import DeliveryMap from "./DeliveryMap";
import DeliveryPage from "../pages/DeliveryPage";

const DeliveryApp = ({ initialTrucks }) => {
  const [showDeliveryPage, setShowDeliveryPage] = useState(false);
  const [deliveries, setDeliveries] = useState([]);

  // When parcels are submitted from DeliveryPage
  const handleParcelsSubmit = (newParcels) => {
    if (!initialTrucks || initialTrucks.length === 0) {
      if (
        window.confirm(
          "No trucks are available now. Do you want to schedule delivery for later?"
        )
      ) {
        alert("Delivery scheduled for later. We will notify you when trucks are available.");
      }
      return;
    }
    setDeliveries(newParcels);
    setShowDeliveryPage(false);
  };

  return (
    <div style={{ padding: 10 }}>
      <button onClick={() => setShowDeliveryPage(!showDeliveryPage)} style={{ marginBottom: 10 }}>
        {showDeliveryPage ? "Back to Map" : "Add Parcels for Delivery"}
      </button>

      {showDeliveryPage ? (
        <DeliveryPage onSubmit={handleParcelsSubmit} />
      ) : (
        <DeliveryMap deliveries={deliveries} trucks={initialTrucks} />
      )}
    </div>
  );
};

export default DeliveryApp;
