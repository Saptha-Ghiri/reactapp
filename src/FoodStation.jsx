import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

const FoodStationMap = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([13.07801, 80.268846]); // Default center
  const navigate = useNavigate();

  // Create a custom icon for food stations
  const createStationIcon = (status) => {
    // Different colors based on station status (empty, partially filled, full)
    const fillColor = 
      status === "full" ? "#22c55e" : 
      status === "partial" ? "#eab308" : 
      "#ef4444"; // empty
    
    return L.divIcon({
      className: "custom-station-icon",
      html: `
        <div class="relative group cursor-pointer">
          <div class="w-14 h-14 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
            <div class="w-10 h-10 rounded-full" style="background-color: ${fillColor};">
              <div class="h-full w-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
            </div>
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div class="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
          </div>
        </div>
      `,
      iconSize: [56, 56],
      iconAnchor: [28, 56],
      popupAnchor: [0, -56],
    });
  };

  // Calculate station status based on racks
  const calculateStationStatus = (racks) => {
    if (!racks || racks.length === 0) return "empty";
    
    const filledRacks = racks.filter(rack => rack.isFilled).length;
    if (filledRacks === 0) return "empty";
    if (filledRacks === racks.length) return "full";
    return "partial";
  };

  // Fetch all food stations
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "food stations"));
        const stationData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Ensure each station has rack information
            racks: doc.data().racks || [
              { id: 1, name: "Rack 1", isFilled: false, items: [] },
              { id: 2, name: "Rack 2", isFilled: false, items: [] },
              { id: 3, name: "Rack 3", isFilled: false, items: [] }
            ]
          }))
          .filter((station) => station.latitude && station.longitude); // Only include stations with location data

        setStations(stationData);

        // If we have stations, center the map on the first station
        if (stationData.length > 0) {
          setMapCenter([stationData[0].latitude, stationData[0].longitude]);
        }
      } catch (err) {
        console.error("Error fetching food stations:", err);
        setError("Failed to load food stations");
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  // Handle click on a station marker
  const handleStationClick = (stationId) => {
    navigate(`/food-station/${stationId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl text-gray-500">Loading food stations map...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer center={mapCenter} zoom={13} className="w-full h-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {stations.map((station) => (
          <Marker
            key={station.id}
            position={[station.latitude, station.longitude]}
            icon={createStationIcon(calculateStationStatus(station.racks))}
            eventHandlers={{
              click: () => {
                handleStationClick(station.id);
              }
            }}
          >
            <Popup className="custom-popup">
              <div className="max-w-xs">
                {station.imageUrl && (
                  <img
                    src={station.imageUrl}
                    alt={station.name}
                    className="w-full h-32 object-cover rounded-t-lg"
                    onError={(e) => {
                      e.target.src = "/placeholder-station-image.png";
                    }}
                  />
                )}
                <div className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">
                      {station.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        calculateStationStatus(station.racks) === "full"
                          ? "bg-green-100 text-green-800"
                          : calculateStationStatus(station.racks) === "partial"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {calculateStationStatus(station.racks) === "full" 
                        ? "Full" 
                        : calculateStationStatus(station.racks) === "partial" 
                        ? "Partially Filled" 
                        : "Empty"}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Address:</span>{" "}
                      {station.address || station.location}
                    </p>
                    
                    {/* Rack status information */}
                    <div className="mt-2">
                      <p className="font-medium mb-1">Rack Status:</p>
                      <div className="flex gap-2">
                        {station.racks.map(rack => (
                          <div 
                            key={rack.id} 
                            className={`w-8 h-8 rounded-md flex items-center justify-center 
                              ${rack.isFilled 
                                ? "bg-green-500 text-white" 
                                : "bg-gray-200 text-gray-600"}`}
                            title={`${rack.name}: ${rack.isFilled ? "Filled" : "Empty"}`}
                          >
                            {rack.id}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleStationClick(station.id)}
                      className="mt-3 w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default FoodStationMap;