import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DeliveryPage from "./pages/DeliveryPage";
import AssignDriverRouteForm from "./pages/AssignDriverRouteForm";
import DriverForm from "./pages/DriverForm";
import AddCustomer from "./pages/AddCustomer";

// Inside your routes


function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<DeliveryPage />} />
        <Route path="/assign-driver" element={<AssignDriverRouteForm />} />
        <Route path="/add-driver" element={<DriverForm />} />
        <Route path="/add-customer" element={<AddCustomer />} />

      </Routes>
    </div>
  );
}

export default App;
