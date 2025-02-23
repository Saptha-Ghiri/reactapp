import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

const LocationPicker = ({ latitude, longitude, setLatitude, setLongitude }) => {
  const [position, setPosition] = useState({ lat: latitude, lng: longitude });

  useEffect(() => {
    if (latitude && longitude) {
      setPosition({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  return (
    <div className="w-full h-64 rounded-md">
      {latitude && longitude ? (
        <MapContainer center={[latitude, longitude]} zoom={12} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker setLatitude={setLatitude} setLongitude={setLongitude} setPosition={setPosition} />
          <Marker position={[position.lat, position.lng]} icon={L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png", iconSize: [32, 32] })} />
        </MapContainer>
      ) : (
        <p className="text-gray-500">Fetching location...</p>
      )}
    </div>
  );
};

// Component to allow user to place a pin on the map
const LocationMarker = ({ setLatitude, setLongitude, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setLatitude(e.latlng.lat);
      setLongitude(e.latlng.lng);
    },
  });

  return null;
};

export default LocationPicker;
