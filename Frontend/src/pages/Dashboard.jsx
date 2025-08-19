import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import PerformanceChart from "../components/PerformanceChart";
import DeliveryMap from "../components/DeliveryMap";
import DashboardCard from "../components/DashboardCard";
import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("map-view");
  const [deliveries, setDeliveries] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [routeOptimizationInfo, setRouteOptimizationInfo] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [gpsTracking, setGpsTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [parcelsRes, driversRes, routesRes, trafficRes, gpsRes] = await Promise.all([
        fetch("http://localhost:5000/api/parcels"),
        fetch("http://localhost:5000/api/drivers"),
        fetch("http://localhost:5000/api/routes"),
        fetch("http://localhost:5000/api/traffic/live"),
        fetch("http://localhost:5000/api/gps/tracking"),
      ]);

      if (!parcelsRes.ok) throw new Error(`Parcels API error: ${parcelsRes.statusText}`);
      if (!driversRes.ok) throw new Error(`Drivers API error: ${driversRes.statusText}`);
      if (!routesRes.ok) throw new Error(`Routes API error: ${routesRes.statusText}`);
      if (!trafficRes.ok) throw new Error(`Traffic API error: ${trafficRes.statusText}`);
      if (!gpsRes.ok) throw new Error(`GPS API error: ${gpsRes.statusText}`);

      const [parcels, drivers, routes, traffic, gps] = await Promise.all([
        parcelsRes.json(),
        driversRes.json(),
        routesRes.json(),
        trafficRes.json(),
        gpsRes.json(),
      ]);

      setDeliveries(parcels ?? []);
      setTrucks(drivers ?? []);
      setRouteOptimizationInfo({ routes: routes ?? [] });
      setTrafficData(traffic ?? null);
      setGpsTracking(gps ?? null);
    } catch (err) {
      console.error("Dashboard fetch error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading dashboard data...</div>;
  if (error) return <div className="error">Error loading dashboard: {error}</div>;

  return (
    <div className="dashboard-container">
      <Sidebar switchTab={setActiveTab} />
      <div className="main-content">
        <TopBar />
        <div className="content-wrapper">
          {/* DASHBOARD TAB */}
          <div id="dashboard-tab" style={{ display: activeTab === "dashboard" ? "block" : "none" }}>
            <div className="card-grid">
              <DashboardCard
                title="Total Deliveries"
                value={(deliveries?.length ?? 0).toString()}
                icon="fa-boxes"
                color="blue"
                subText={["+12%", "vs last week"]}
              />
              <DashboardCard
                title="Active Vehicles"
                value={`${trucks?.length ?? 0}/12`}
                icon="fa-truck"
                progress={67}
                color="orange"
                subText={["Capacity", "67%"]}
              />
              <DashboardCard
                title="On-Time Rate"
                value="94%"
                icon="fa-clock"
                progress={94}
                color="green"
                subText={["Target: 95%", "+2% vs last month"]}
              />
              <DashboardCard
                title="Customer Rating"
                value="4.8/5"
                icon="fa-star"
                color="purple"
              />
            </div>

            <div className="dashboard-row">
              <div className="dashboard-card performance-card">
                <div className="card-header">
                  <h2>Delivery Performance</h2>
                  <select>
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>Last Quarter</option>
                  </select>
                </div>
                <div className="chart-placeholder">
                  <PerformanceChart />
                </div>
              </div>

              <div className="dashboard-card top-drivers-card">
                <h2>Top Drivers</h2>
                <div className="driver-list">
                  {trucks.slice(0, 3).map((driver) => (
                    <div className="driver-item" key={driver._id}>
                      <div className="driver-info">
                        <div className="driver-avatar blue">
                          {driver.name?.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p>{driver.name}</p>
                          <p className="sub-text">4.9 rating</p>
                        </div>
                      </div>
                      <div className="driver-stats">
                        <p><strong>{driver.assignedParcels?.length || 0} deliveries</strong></p>
                        <p className="success-text">98% on-time</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            

           
            </div>
          </div>

          {/* MAP VIEW TAB */}
          <div id="map-view-tab" style={{ display: activeTab === "map-view" ? "block" : "none" }} className="map-view">
            <div className="map-header">
              <h2>Live Delivery Map</h2>
              <div className="button-group">
                <button className="primary-btn" onClick={() => navigate("/add")}>
                  <i className="fas fa-plus"></i> Add Delivery
                </button>
                <button className="outline-btn" onClick={fetchData}>
                  <i className="fas fa-sync"></i> Refresh
                </button>
                <button className="secondary-btn" onClick={() => navigate("/assign-driver")}>
                  <i className="fas fa-plus"></i> Assign Driver
                </button>
                <button className="outline-btn" onClick={() => navigate("/add-driver")}>
  <i className="fas fa-plus"></i> Add Driver
</button>
                  <button className="outline-btn" onClick={() => navigate("/add-customer")}>
  <i className="fas fa-plus"></i> Add Customer
</button>

              </div>
            </div>

            <div className="map-layout">
              <div className="map-area">
                <DeliveryMap
  deliveries={deliveries}
  trucks={trucks}
  trafficData={trafficData}
  gpsTracking={gpsTracking}
  onUpdateDeliveries={setDeliveries} // ✅ add this prop
/>

              </div>

              <div className="map-side-panel">
                <div className="dashboard-card">
                  <h3>Active Deliveries</h3>
                  <div className="delivery-list">
                    {deliveries.map((delivery) => (
                      <div key={delivery._id} className="delivery-item">
                        <div className="delivery-header">
                          <div>
                            <p><strong>#{delivery.parcelId || delivery.id || delivery._id}</strong></p>
                            <p className="sub-text">
                              {delivery.type || "Parcel"} — Priority {delivery.priority || 3}
                            </p>
                          </div>
                          <span className={`priority-tag priority-${delivery.priority}`}>
                            {delivery.priority === 1 ? "Urgent" : delivery.priority === 2 ? "High" : "Medium"}
                          </span>
                        </div>
                        <div className="delivery-meta">
                          <p><i className="fas fa-user"></i> {delivery.customer?.name || delivery.customer || "N/A"}</p>
                          <p><i className="fas fa-clock"></i> ETA: {delivery.eta || "N/A"}</p>
                        </div>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${delivery.progress || 0}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dashboard-card">
                  <h3>Delivery Metrics</h3>
                  <div className="metrics">
                    <div>
                      <p className="metric-value">{deliveries.length}</p>
                      <p className="sub-text">Today's Deliveries</p>
                    </div>
                    <div>
                      <p className="metric-value">94%</p>
                      <p className="sub-text">On-Time Rate</p>
                    </div>
                    <div>
                      <p className="metric-value">4.8/5</p>
                      <p className="sub-text">Avg. Rating</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div> {/* end of map view tab */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
