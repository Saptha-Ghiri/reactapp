import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

const FoodMap = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([13.07801, 80.268846]); // Default center

  // Create a custom icon for food donations
  const createFoodIcon = (imageUrl) => {
    return L.divIcon({
      className: "custom-food-icon",
      html: `
        <div class="relative group">
          <div class="w-12 h-12 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
            <img 
              src="${imageUrl || "/placeholder-food-image.png"}" 
              alt="Food" 
              class="w-full h-full object-cover"
              onerror="this.src='/placeholder-food-image.png'"
            />
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div class="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -48],
    });
  };

  // Fetch available food donations
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        // Create a query for available food items only
        const q = query(collection(db, "food items"), where("status", "==", "available"));
        const querySnapshot = await getDocs(q);
        
        const donationData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((donation) => donation.latitude && donation.longitude); // Only include donations with location data

        setDonations(donationData);

        // If we have donations, center the map on the first donation
        if (donationData.length > 0) {
          setMapCenter([donationData[0].latitude, donationData[0].longitude]);
        }
      } catch (err) {
        console.error("Error fetching donations:", err);
        setError("Failed to load available donations");
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl text-gray-500">Loading available donations map...</div>
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

        {donations.map((donation) => (
          <Marker
            key={donation.id}
            position={[donation.latitude, donation.longitude]}
            icon={createFoodIcon(donation.imageUrl)}
          >
            <Popup className="custom-popup">
              <div className="max-w-xs">
                {donation.imageUrl && (
                  <img
                    src={donation.imageUrl}
                    alt={donation.foodName}
                    className="w-full h-32 object-cover rounded-t-lg"
                    onError={(e) => {
                      e.target.src = "/placeholder-food-image.png";
                    }}
                  />
                )}
                <div className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">
                      {donation.foodName}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        donation.foodType === "Veg"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {donation.foodType}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Quantity:</span>{" "}
                      {donation.quantity}
                    </p>
                    <p>
                      <span className="font-medium">Location:</span>{" "}
                      {donation.pickupLocation}
                    </p>
                    <p>
                      <span className="font-medium">Expires:</span>{" "}
                      {new Date(donation.expiryDate).toLocaleString()}
                    </p>
                    {donation.donorContact && (
                      <p>
                        <span className="font-medium">Contact:</span>{" "}
                        {donation.donorContact}
                      </p>
                    )}
                    {donation.notes && (
                      <p className="italic text-gray-600 border-l-2 border-gray-300 pl-2">
                        {donation.notes}
                      </p>
                    )}
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

export default FoodMap;