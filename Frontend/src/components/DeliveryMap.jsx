import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import io from "socket.io-client";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "../styles/DeliveryMap.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faCar, faLocationDot, faRoute, faBrain, faHouse } from "@fortawesome/free-solid-svg-icons";
import Chart from "chart.js/auto";

const SOCKET_SERVER_URL = "http://localhost:5000";
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;
const CUSTOMER_RESPONSE_TIMEOUT = 120000; // 2 minutes

const DeliveryMap = ({ deliveries, trucks, onUpdateDeliveries }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const deliveryMarkers = useRef(null);
  const heatmapLayers = useRef([]);
  const trafficLayers = useRef([]);
  const gpsTruckMarkers = useRef({});
  const routeLayer = useRef(null);
  const socketRef = useRef(null);
  const blockageLayers = useRef([]);
  const neighborMarkers = useRef([]);

  const [trafficData, setTrafficData] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [routeMenuOpen, setRouteMenuOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [deliveryToConfirm, setDeliveryToConfirm] = useState(null);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [suggestedSchedule, setSuggestedSchedule] = useState(null);
  const [neighborModalVisible, setNeighborModalVisible] = useState(false);
  const [neighborPoints, setNeighborPoints] = useState([]);
  const [manualNeighborModalVisible, setManualNeighborModalVisible] = useState(false);
  const [manualNeighborData, setManualNeighborData] = useState({ lat: "", lng: "", name: "" });
  const chartRef = useRef(null);

  // Helper to get truck lat/lng
  const getTruckLatLng = (truck) => {
    if (truck.location && truck.location.lat !== undefined && truck.location.lng !== undefined) {
      return { lat: truck.location.lat, lng: truck.location.lng };
    } else if (
      truck.currentLocation &&
      Array.isArray(truck.currentLocation.coordinates) &&
      truck.currentLocation.coordinates.length === 2
    ) {
      return {
        lng: truck.currentLocation.coordinates[0],
        lat: truck.currentLocation.coordinates[1],
      };
    }
    return null;
  };

  // Find neighbor points (within 100m) or prompt for manual input
  const findNeighborPoints = (delivery) => {
    const neighbors = deliveries
      .filter((d) => d.id !== delivery.id)
      .filter((d) => {
        const distance = Math.hypot(d.lat - delivery.lat, d.lng - delivery.lng) * 111000; // meters
        return distance <= 100;
      })
      .map((d) => ({ ...d, isNeighbor: true }));

    setNeighborPoints(neighbors);
    if (neighbors.length === 0) {
      setManualNeighborModalVisible(true);
      setManualNeighborData({ lat: delivery.lat.toFixed(4), lng: delivery.lng.toFixed(4), name: "" });
    } else {
      setNeighborModalVisible(true);
    }
    return neighbors;
  };

  // Show neighbor points on map
  const showNeighborMarkers = (neighbors) => {
    neighborMarkers.current.forEach((marker) => mapInstance.current.removeLayer(marker));
    neighborMarkers.current = [];

    neighbors.forEach((neighbor) => {
      if (Number.isFinite(neighbor.lat) && Number.isFinite(neighbor.lng)) {
        const marker = L.marker([neighbor.lat, neighbor.lng], {
          icon: L.divIcon({
            className: "neighbor-marker",
            html: `<span><i class="fas fa-house"></i></span>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        }).bindPopup(`
          <div class="popup-content">
            <h4>Neighbor: ${neighbor.customer?.name || "Unknown"}</h4>
            <button class="select-neighbor-btn" data-id="${neighbor.id}" data-lat="${neighbor.lat}" data-lng="${neighbor.lng}">
              Deliver Here
            </button>
          </div>
        `);
        marker.addTo(mapInstance.current);
        neighborMarkers.current.push(marker);
      }
    });
  };

  // Handle manual neighbor submission
  const handleManualNeighborSubmit = () => {
    const { lat, lng, name } = manualNeighborData;
    if (!lat || !lng || !name) {
      alert("Please fill in all fields for the neighbor point.");
      return;
    }
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      alert("Invalid latitude or longitude.");
      return;
    }
    const newNeighbor = {
      id: `manual-neighbor-${Date.now()}`,
      lat: parsedLat,
      lng: parsedLng,
      customer: { name },
      priority: deliveryToConfirm?.priority || 1,
      isNeighbor: true,
    };
    setNeighborPoints([newNeighbor]);
    setManualNeighborModalVisible(false);
    setNeighborModalVisible(true);
  };

  // Update neighbor markers when neighborPoints changes
  useEffect(() => {
    if (neighborPoints.length > 0) {
      showNeighborMarkers(neighborPoints);
    } else {
      neighborMarkers.current.forEach((marker) => mapInstance.current.removeLayer(marker));
      neighborMarkers.current = [];
    }
  }, [neighborPoints]);

  // Mock AI prediction function for rescheduling
  const predictOptimalSchedule = (deliveries, trafficData, blockages, trucks) => {
    const sortedDeliveries = [...deliveries].sort((a, b) => {
      const aTraffic = trafficData.some(
        (area) =>
          Math.hypot(area.lat - a.lat, area.lng - a.lng) * 111000 <= area.radius &&
          area.congestionLevel === "high"
      );
      const bTraffic = trafficData.some(
        (area) =>
          Math.hypot(area.lat - b.lat, area.lng - b.lng) * 111000 <= area.radius &&
          area.congestionLevel === "high"
      );
      const aBlocked = blockages.some(
        (b) => Math.hypot(b.lat - a.lat, b.lng - a.lng) * 111000 < 80
      );
      const bBlocked = blockages.some(
        (b) => Math.hypot(b.lat - b.lat, b.lng - b.lng) * 111000 < 80
      );

      return (
        (b.priority - a.priority) ||
        (aTraffic ? 1 : -1) ||
        (aBlocked ? 1 : -1) - (bBlocked ? 1 : -1)
      );
    });

    const availableTrucks = trucks.filter((t) => (t.parcels || 0) < 10);
    if (availableTrucks.length === 0) return null;

    return sortedDeliveries.map((d, index) => ({
      ...d,
      order: index + 1,
      estimatedTime: new Date(Date.now() + index * 30 * 60 * 1000).toLocaleTimeString(),
    }));
  };

  // Handle rescheduling
  const handleReschedule = () => {
    const blockages = blockageLayers.current.map((layer) => layer.getLatLng());
    const newSchedule = predictOptimalSchedule(deliveries, trafficData, blockages, trucks);
    if (newSchedule) {
      setSuggestedSchedule(newSchedule);
      setRescheduleModalVisible(true);
    } else {
      alert("Unable to generate schedule: No available trucks or deliveries.");
    }
  };

  // Apply rescheduled deliveries
  const applyReschedule = () => {
    if (typeof onUpdateDeliveries === "function") {
      onUpdateDeliveries(suggestedSchedule);
      drawOptimizedRoute(suggestedSchedule);
      setRescheduleModalVisible(false);
      setSuggestedSchedule(null);
      // Clear neighbor markers after rescheduling
      neighborMarkers.current.forEach((marker) => mapInstance.current.removeLayer(marker));
      neighborMarkers.current = [];
      setNeighborPoints([]);
    } else {
      alert("No update function provided for deliveries.");
    }
  };

  // Route button click handler
  useEffect(() => {
    const mapEl = mapRef.current;
    const handleRouteButtonClick = (e) => {
      if (e.target && e.target.classList.contains("route-to-btn")) {
        const id = e.target.getAttribute("data-id");
        const lat = parseFloat(e.target.getAttribute("data-lat"));
        const lng = parseFloat(e.target.getAttribute("data-lng"));
        const delivery = deliveries.find((d) => String(d.id) === id);
        if (delivery) {
          setDeliveryToConfirm(delivery);
          setConfirmModalVisible(true);
        }
      }
      if (e.target && e.target.classList.contains("select-neighbor-btn")) {
        const id = e.target.getAttribute("data-id");
        const lat = parseFloat(e.target.getAttribute("data-lat"));
        const lng = parseFloat(e.target.getAttribute("data-lng"));
        const neighbor = neighborPoints.find((n) => String(n.id) === id);
        if (neighbor) {
          setNeighborModalVisible(false);
          drawRouteToDelivery(neighbor);
          setSelectedDelivery(neighbor);
          setRouteMenuOpen(false);
          // Clear neighbor markers after routing
          neighborMarkers.current.forEach((marker) => mapInstance.current.removeLayer(marker));
          neighborMarkers.current = [];
          setNeighborPoints([]);
        }
      }
    };
    mapEl.addEventListener("click", handleRouteButtonClick);
    return () => mapEl.removeEventListener("click", handleRouteButtonClick);
  }, [deliveries, neighborPoints]);

  // Create truck marker
  const createTruckMarker = (truck) => {
    const coords = getTruckLatLng(truck);
    if (!coords) return null;
    const { lat, lng } = coords;
    const truckIcon = L.divIcon({
      className: "truck-marker",
      html: `<div class="pulse" style="width: 50px; height: 50px; background: url('https://img.icons8.com/color/96/delivery--v1.png') no-repeat center; background-size: contain;"></div>`,
      iconSize: [50, 50],
      iconAnchor: [25, 25],
      popupAnchor: [0, -25],
    });
    return L.marker([lat, lng], { icon: truckIcon }).bindPopup(`
      <div class="popup-content">
        <h4>${truck.id}</h4>
        <p>Driver: ${truck.driver || "N/A"}</p>
        <p>Parcels: ${truck.parcels || 0}</p>
        <p>Progress: ${truck.progress || 0}%</p>
      </div>
    `);
  };

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation([latitude, longitude]);
        },
        (err) => console.error("Geolocation error:", err.message)
      );
    }
  }, []);

  // Initialize map and markers
  useEffect(() => {
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        doubleClickZoom: true,
        scrollWheelZoom: true,
      }).setView([40.7128, -74.006], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapInstance.current);

      deliveryMarkers.current = L.markerClusterGroup();
      mapInstance.current.addLayer(deliveryMarkers.current);
    }

    deliveryMarkers.current.clearLayers();
    deliveries.forEach((location) => {
      const marker = L.marker([location.lat, location.lng], {
        icon: L.divIcon({
          className: `parcel-marker priority-${location.priority}`,
          html: `<span>${location.order || location.priority}</span>`,
        }),
      });
      marker.bindPopup(`
        <div class="popup-content">
          <h4>${location.id}</h4>
          <p>${location.customer?.name || location.customer || "Unknown"}</p>
          <button class="route-to-btn" data-id="${location.id}" data-lat="${location.lat}" data-lng="${location.lng}">
            Route to here
          </button>
        </div>
      `);
      deliveryMarkers.current.addLayer(marker);
    });

    Object.values(gpsTruckMarkers.current).forEach((marker) => {
      mapInstance.current.removeLayer(marker);
    });
    gpsTruckMarkers.current = {};

    trucks.forEach((truck) => {
      const coords = getTruckLatLng(truck);
      if (!coords) {
        console.warn("Truck missing location:", truck);
        return;
      }
      const marker = createTruckMarker({ ...truck, location: coords });
      if (marker) {
        marker.addTo(mapInstance.current);
        gpsTruckMarkers.current[truck.id] = marker;
      }
    });

    fetch("http://localhost:5000/api/traffic/live")
      .then((res) => {
        if (!res.ok) throw new Error(`Traffic API error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const parsed = parseTrafficFromORS(data);
        setTrafficData(parsed);
      })
      .catch((err) => {
        console.error("Traffic fetch error:", err.message);
        setTrafficData([]);
      });

    return () => {
      deliveryMarkers.current.clearLayers();
      heatmapLayers.current.forEach((layer) => mapInstance.current.removeLayer(layer));
      trafficLayers.current.forEach((layer) => mapInstance.current.removeLayer(layer));
      Object.values(gpsTruckMarkers.current).forEach((marker) => mapInstance.current.removeLayer(marker));
      gpsTruckMarkers.current = {};
      neighborMarkers.current.forEach((marker) => mapInstance.current.removeLayer(marker));
      neighborMarkers.current = [];
    };
  }, [deliveries, trucks]);

  // Fetch blockages
  useEffect(() => {
    const fetchBlockagesFromOverpass = async () => {
      try {
        const query = `
          [out:json];
          (
            way["highway"~"construction|closed"](around:5000,40.7128,-74.006);
          );
          out geom;
        `;
        const response = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: query,
        });
        const data = await response.json();
        const blockages = data.elements.map((el) => {
          const lat = el.geometry?.[0]?.lat;
          const lng = el.geometry?.[0]?.lon;
          return { lat, lng, type: el.tags?.highway || "blockage" };
        });

        blockageLayers.current.forEach((layer) => mapInstance.current.removeLayer(layer));
        blockageLayers.current = [];

        blockages.forEach(({ lat, lng, type }) => {
          if (lat && lng) {
            const marker = L.circle([lat, lng], {
              radius: 50,
              color: "black",
              fillColor: "gray",
              fillOpacity: 0.7,
            }).bindPopup(`Blocked: ${type}`);
            marker.addTo(mapInstance.current);
            blockageLayers.current.push(marker);
          }
        });
      } catch (error) {
        console.error("Overpass blockage fetch error:", error);
      }
    };
    fetchBlockagesFromOverpass();
  }, [deliveries, trucks]);

  // Update traffic circles
  useEffect(() => {
    trafficLayers.current.forEach((layer) => mapInstance.current.removeLayer(layer));
    trafficLayers.current = [];
    trafficData.forEach((area) => {
      const color =
        area.congestionLevel === "high"
          ? "rgba(255,0,0,0.5)"
          : area.congestionLevel === "medium"
          ? "rgba(255,165,0,0.4)"
          : "rgba(255,255,0,0.3)";
      const circle = L.circle([area.lat, area.lng], {
        radius: area.radius,
        fillColor: color,
        color: color,
        weight: 1,
        fillOpacity: 0.5,
      });
      circle.addTo(mapInstance.current);
      trafficLayers.current.push(circle);
    });
  }, [trafficData]);

  // WebSocket for GPS updates
  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);
    socketRef.current.on("gpsUpdate", (updatedTrucks) => {
      updatedTrucks.forEach((truck) => {
        if (!truck.location || truck.location.lat === undefined || truck.location.lng === undefined) {
          console.warn("GPS update truck missing location:", truck);
          return;
        }
        if (gpsTruckMarkers.current[truck.id]) {
          gpsTruckMarkers.current[truck.id].setLatLng([truck.location.lat, truck.location.lng]);
        } else {
          const marker = createTruckMarker(truck);
          marker.addTo(mapInstance.current);
          gpsTruckMarkers.current[truck.id] = marker;
        }
      });
    });
    return () => socketRef.current.disconnect();
  }, []);

  // Route-to event listener
  useEffect(() => {
    const handleRouteTo = (e) => {
      drawRouteToDelivery(e.detail);
      setSelectedDelivery(null);
      setRouteMenuOpen(false);
      // Clear neighbor markers after routing
      neighborMarkers.current.forEach((marker) => mapInstance.current.removeLayer(marker));
      neighborMarkers.current = [];
      setNeighborPoints([]);
    };
    window.addEventListener("route-to", handleRouteTo);
    return () => window.removeEventListener("route-to", handleRouteTo);
  }, [trucks]);

  // Customer response timeout
  useEffect(() => {
    if (confirmModalVisible) {
      const timer = setTimeout(() => {
        setConfirmModalVisible(false);
        setDeliveryToConfirm(null);
        // Clear neighbor markers on timeout
        neighborMarkers.current.forEach((marker) => mapInstance.current.removeLayer(marker));
        neighborMarkers.current = [];
        setNeighborPoints([]);
      }, CUSTOMER_RESPONSE_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [confirmModalVisible]);

  // Chart.js for reschedule modal
  useEffect(() => {
    if (rescheduleModalVisible && chartRef.current) {
      const ctx = chartRef.current.getContext("2d");
      const originalTime = deliveries.length * 30; // Mock: 30 min per delivery
      const optimizedTime = suggestedSchedule ? suggestedSchedule.length * 25 : originalTime; // Mock: 25 min per delivery

      new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Original", "AI-Optimized"],
          datasets: [
            {
              label: "Estimated Time (min)",
              data: [originalTime, optimizedTime],
              backgroundColor: ["#ff6384", "#36a2eb"],
              borderColor: ["#ff6384", "#36a2eb"],
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: "Time (minutes)" },
            },
          },
          plugins: {
            legend: { display: true },
          },
        },
      });
    }
  }, [rescheduleModalVisible, suggestedSchedule]);

  // Find nearest truck
  const findNearestTruck = (lat, lng) => {
    if (!trucks || trucks.length === 0) return null;
    return trucks.reduce(
      (nearest, truck) => {
        let truckLat, truckLng;
        if (truck.location && truck.location.lat !== undefined && truck.location.lng !== undefined) {
          truckLat = truck.location.lat;
          truckLng = truck.location.lng;
        } else if (
          truck.currentLocation &&
          Array.isArray(truck.currentLocation.coordinates) &&
          truck.currentLocation.coordinates.length === 2
        ) {
          truckLng = truck.currentLocation.coordinates[0];
          truckLat = truck.currentLocation.coordinates[1];
        } else {
          return nearest;
        }
        const dist = Math.hypot(truckLat - lat, truckLng - lng);
        return dist < nearest.dist ? { truck, dist } : nearest;
      },
      { truck: null, dist: Infinity }
    ).truck;
  };

  // Draw route to delivery
  const drawRouteToDelivery = async (destination) => {
    if (!trucks || trucks.length === 0) {
      alert("No trucks available.");
      return;
    }
    const nearestTruck = findNearestTruck(destination.lat, destination.lng);
    if (!nearestTruck) {
      alert("No truck found.");
      return;
    }
    const truckCoords = getTruckLatLng(nearestTruck);
    if (!truckCoords) {
      alert("Nearest truck location is invalid.");
      return;
    }

    const isHighTraffic = trafficData.some((area) => {
      const dLat = area.lat - destination.lat;
      const dLng = area.lng - destination.lng;
      const distance = Math.sqrt(dLat * dLat + dLng * dLng) * 111000;
      return area.congestionLevel === "high" && distance <= area.radius;
    });

    const isNearBlockedRoad = blockageLayers.current.some((marker) => {
      const pos = marker.getLatLng();
      const d = Math.sqrt((pos.lat - destination.lat) ** 2 + (pos.lng - destination.lng) ** 2) * 111000;
      return d < 80;
    });

    if (isNearBlockedRoad) {
      alert("⚠️ Nearby blockage detected! Consider an optimized route.");
    }

    if (isHighTraffic) {
      const proceed = window.confirm("High traffic detected near the destination. Do you want to use an optimized route instead?");
      if (proceed) {
        drawOptimizedRoute();
        return;
      }
    }

    try {
      const response = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          method: "POST",
          headers: {
            Authorization: ORS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            coordinates: [
              [truckCoords.lng, truckCoords.lat],
              [destination.lng, destination.lat],
            ],
          }),
        }
      );

      if (!response.ok) throw new Error(`ORS API error: ${response.status}`);
      const data = await response.json();
      const lineFeature = data.features.find((f) => f.geometry.type === "LineString");
      if (!lineFeature) {
        alert("No route line found.");
        return;
      }

      if (routeLayer.current) {
        mapInstance.current.removeLayer(routeLayer.current);
      }

      routeLayer.current = L.geoJSON(lineFeature, {
        style: { color: "#007bff", weight: 5, opacity: 0.9 },
      }).addTo(mapInstance.current);
      mapInstance.current.fitBounds(routeLayer.current.getBounds());
    } catch (error) {
      console.error("Error fetching ORS route:", error);
      alert("Failed to fetch route.");
    }
  };

  // Draw optimized route
  const drawOptimizedRoute = async (customDeliveries = null) => {
    const deliveryList = customDeliveries || deliveries;
    if (!deliveryList || deliveryList.length === 0) {
      alert("No deliveries to route.");
      return;
    }
    if (!trucks || trucks.length === 0) {
      alert("No trucks available.");
      return;
    }

    const startTruck = findNearestTruck(deliveryList[0].lat, deliveryList[0].lng);
    if (!startTruck) {
      alert("No truck found.");
      return;
    }
    const startTruckCoords = getTruckLatLng(startTruck);
    if (!startTruckCoords) {
      alert("Start truck location is invalid.");
      return;
    }

    try {
      const jobs = deliveryList
        .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng))
        .map((d, i) => ({
          id: i + 1,
          location: [d.lng, d.lat],
        }));

      const vehicles = [
        {
          id: 1,
          start: [startTruckCoords.lng, startTruckCoords.lat],
          end: [startTruckCoords.lng, startTruckCoords.lat],
          profile: "driving-car",
        },
      ];

      const payload = { jobs, vehicles };
      const response = await fetch("https://api.openrouteservice.org/optimization", {
        method: "POST",
        headers: {
          Authorization: ORS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      if (!response.ok) {
        console.error("ORS optimization error:", response.status, responseText);
        alert("ORS optimization request failed.");
        return;
      }

      const data = JSON.parse(responseText);
      if (!data.routes || data.routes.length === 0) {
        alert("No optimized route found.");
        return;
      }

      const orderedCoords = data.routes[0].steps
        .filter((step) => Array.isArray(step.location) && step.location.length === 2)
        .map((step) => step.location);

      if (orderedCoords.length < 2) {
        alert("Optimized route too short.");
        return;
      }

      const directionsRes = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          method: "POST",
          headers: {
            Authorization: ORS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ coordinates: orderedCoords }),
        }
      );

      if (!directionsRes.ok) {
        throw new Error(`ORS directions error: ${directionsRes.status}`);
      }

      const directionsData = await directionsRes.json();
      const lineFeature = directionsData.features.find((f) => f.geometry.type === "LineString");
      if (!lineFeature) {
        alert("No route line found in directions response.");
        return;
      }

      if (routeLayer.current) {
        mapInstance.current.removeLayer(routeLayer.current);
      }

      routeLayer.current = L.geoJSON(lineFeature, {
        style: { color: "#28a745", weight: 5, opacity: 0.9 },
      }).addTo(mapInstance.current);
      mapInstance.current.fitBounds(routeLayer.current.getBounds());
    } catch (error) {
      console.error("Error fetching optimized route:", error);
      alert("Failed to fetch optimized route.");
    }
  };

  const parseTrafficFromORS = (data) => {
    const midCoord = data?.features?.[0]?.geometry?.coordinates?.[0] || [-74.006, 40.7128];
    return [{ lat: midCoord[1], lng: midCoord[0], radius: 300, congestionLevel: "medium" }];
  };

  const toggleHeatmap = () => {
    if (heatmapLayers.current.length === 0) {
      deliveries.forEach((location) => {
        const circle = L.circle([location.lat, location.lng], {
          radius: location.priority * 80,
          fillColor: "rgba(255, 140, 0, 0.5)",
          color: "rgba(255, 140, 0, 0.2)",
          weight: 1,
        }).addTo(mapInstance.current);
        heatmapLayers.current.push(circle);
      });
    } else {
      heatmapLayers.current.forEach((layer) => mapInstance.current.removeLayer(layer));
      heatmapLayers.current = [];
    }
  };

  const toggleTraffic = () => {
    if (trafficLayers.current.length > 0) {
      trafficLayers.current.forEach((layer) => mapInstance.current.removeLayer(layer));
      trafficLayers.current = [];
    } else {
      trafficData.forEach((area) => {
        const color =
          area.congestionLevel === "high"
            ? "rgba(255,0,0,0.5)"
            : area.congestionLevel === "medium"
            ? "rgba(255,165,0,0.4)"
            : "rgba(255,255,0,0.3)";
        const circle = L.circle([area.lat, area.lng], {
          radius: area.radius,
          fillColor: color,
          color: color,
          weight: 1,
          fillOpacity: 0.5,
        });
        circle.addTo(mapInstance.current);
        trafficLayers.current.push(circle);
      });
    }
  };

  const focusOnUser = () => {
    if (userLocation) mapInstance.current.setView(userLocation, 13);
  };

  return (
    <div className="map-container" style={{ height: "700px", position: "relative" }}>
      <div ref={mapRef} id="map" style={{ height: "100%", width: "100%" }} />

      {/* Controls */}
      <div className="map-controls">
        <button onClick={toggleHeatmap} title="Demand Heatmap" className="map-button">
          <FontAwesomeIcon icon={faFire} className="icon-orange" />
        </button>
        <button onClick={toggleTraffic} title="Traffic Data" className="map-button">
          <FontAwesomeIcon icon={faCar} className="icon-blue" />
        </button>
        <button onClick={focusOnUser} title="My Location" className="map-button">
          <FontAwesomeIcon icon={faLocationDot} className="icon-green" />
        </button>
       
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setRouteMenuOpen(!routeMenuOpen)}
            title="Route Planning"
            className="map-button"
          >
            <FontAwesomeIcon icon={faRoute} className="icon-purple" />
          </button>
          {routeMenuOpen && (
            <div className="route-menu">
              <button
                onClick={() => {
                  if (selectedDelivery) {
                    drawRouteToDelivery(selectedDelivery);
                    setRouteMenuOpen(false);
                  }
                }}
                disabled={!selectedDelivery}
                className="modal-button"
              >
                Route to Selected
              </button>
              <button
                onClick={() => {
                  drawOptimizedRoute();
                  setRouteMenuOpen(false);
                }}
                className="modal-button"
              >
                Optimized Route
              </button>
              <button
                onClick={() => {
                  if (routeLayer.current) {
                    mapInstance.current.removeLayer(routeLayer.current);
                    routeLayer.current = null;
                  }
                  setRouteMenuOpen(false);
                  neighborMarkers.current.forEach((marker) => mapInstance.current.removeLayer(marker));
                  neighborMarkers.current = [];
                  setNeighborPoints([]);
                }}
                className="modal-button"
              >
                Clear Route
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delivery List */}
      <div className="delivery-list">
        <h4>Deliveries</h4>
        {deliveries.length === 0 && <p>No deliveries</p>}
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {deliveries.map((d) => (
            <li
              key={d.id}
              onClick={() => setSelectedDelivery(d)}
              style={{
                padding: "6px",
                marginBottom: "4px",
                cursor: "pointer",
                backgroundColor: selectedDelivery?.id === d.id ? "#007bff" : "transparent",
                color: selectedDelivery?.id === d.id ? "white" : "black",
                borderRadius: "3px",
              }}
            >
              {d.customer?.name || "Unknown Customer"} (Priority {d.priority}{d.order ? `, Order ${d.order}` : ""})
            </li>
          ))}
        </ul>
      </div>

      {/* Customer Confirmation Modal */}
      {confirmModalVisible && deliveryToConfirm && (
        <div className="modal-overlay modal-animate">
          <div className="modal-content modal-animate">
            <p>
              Is the customer <strong>{deliveryToConfirm.customer?.name || "Unknown"}</strong> at home for delivery?
            </p>
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-around" }}>
              <button
                onClick={() => {
                  setConfirmModalVisible(false);
                  drawRouteToDelivery(deliveryToConfirm);
                  setSelectedDelivery(deliveryToConfirm);
                  setRouteMenuOpen(false);
                  neighborMarkers.current.forEach((marker) => mapInstance.current.removeLayer(marker));
                  neighborMarkers.current = [];
                  setNeighborPoints([]);
                }}
                className="modal-button"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  setConfirmModalVisible(false);
                  if (typeof onUpdateDeliveries === "function") {
                    const filtered = deliveries.filter((d) => d.id !== deliveryToConfirm.id);
                    onUpdateDeliveries(filtered);
                    findNeighborPoints(deliveryToConfirm);
                  } else {
                    alert("No update function provided for deliveries - can't reroute.");
                  }
                  setSelectedDelivery(null);
                  setRouteMenuOpen(false);
                }}
                className="modal-button"
              >
                No
              </button>
              <button
                onClick={() => {
                  setConfirmModalVisible(false);
                  setDeliveryToConfirm(null);
                  neighborMarkers.current.forEach((marker) => mapInstance.current.removeLayer(marker));
                  neighborMarkers.current = [];
                  setNeighborPoints([]);
                }}
                className="modal-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Neighbor Selection Modal */}
      {neighborModalVisible && neighborPoints.length > 0 && (
        <div className="modal-overlay modal-animate">
          <div className="modal-content modal-animate">
            <h3>Select a Neighbor for Delivery</h3>
            <p>Customer unavailable. Choose a nearby delivery point:</p>
            <ul style={{ listStyle: "none", padding: 0, textAlign: "left" }}>
              {neighborPoints.map((n) => (
                <li key={n.id} style={{ marginBottom: "8px" }}>
                  <button
                    onClick={() => {
                      setNeighborModalVisible(false);
                      drawRouteToDelivery(n);
                      setSelectedDelivery(n);
                      setRouteMenuOpen(false);
                      neighborMarkers.current.forEach((marker) => mapInstance.current.removeLayer(marker));
                      neighborMarkers.current = [];
                      setNeighborPoints([]);
                    }}
                    className="modal-button"
                  >
                    {n.customer?.name || "Unknown"} (Lat: {n.lat.toFixed(4)}, Lng: {n.lng.toFixed(4)})
                  </button>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-around" }}>
              <button
                onClick={() => {
                  setNeighborModalVisible(false);
                  setManualNeighborModalVisible(true);
                  setManualNeighborData({
                    lat: deliveryToConfirm?.lat.toFixed(4) || "",
                    lng: deliveryToConfirm?.lng.toFixed(4) || "",
                    name: "",
                  });
                }}
                className="modal-button"
              >
                Add Manual Neighbor
              </button>
              <button
                onClick={() => {
                  setNeighborModalVisible(false);
                  neighborMarkers.current.forEach((marker) => mapInstance.current.removeLayer(marker));
                  neighborMarkers.current = [];
                  setNeighborPoints([]);
                }}
                className="modal-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Neighbor Input Modal */}
      {manualNeighborModalVisible && (
        <div className="modal-overlay modal-animate">
          <div className="modal-content modal-animate">
            <h3>Add Manual Neighbor Point</h3>
            <p>No nearby neighbors found. Enter details for an alternate delivery point:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Neighbor Name"
                value={manualNeighborData.name}
                onChange={(e) => setManualNeighborData({ ...manualNeighborData, name: e.target.value })}
                style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
              <input
                type="number"
                placeholder="Latitude"
                value={manualNeighborData.lat}
                onChange={(e) => setManualNeighborData({ ...manualNeighborData, lat: e.target.value })}
                style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
              <input
                type="number"
                placeholder="Longitude"
                value={manualNeighborData.lng}
                onChange={(e) => setManualNeighborData({ ...manualNeighborData, lng: e.target.value })}
                style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <button onClick={handleManualNeighborSubmit} className="modal-button">
                Add Neighbor
              </button>
              <button
                onClick={() => {
                  setManualNeighborModalVisible(false);
                  neighborMarkers.current.forEach((marker) => mapInstance.current.removeLayer(marker));
                  neighborMarkers.current = [];
                  setNeighborPoints([]);
                }}
                className="modal-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    
              
            </div>
          
        
      
  
  );
};

export default DeliveryMap;
