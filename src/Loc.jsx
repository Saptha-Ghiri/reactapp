import React, { useEffect, useState } from 'react';

const Loc = () => {
  const [mapLoaded, setMapLoaded] = useState(false);

  // Restaurant and home data
  const restaurants = [
    {"name": "Tasty Bites", "location": [13.026270, 80.174611]}, 
    {"name": "Food Haven", "location": [13.010610, 80.220119]},  
    {"name": "Spice Hub", "location": [12.998234, 80.192404]},  
    {"name": "Urban Diner", "location": [12.953598, 80.118532]},  
    {"name": "Green Eats", "location": [12.922068, 80.183565]},  
  ];

  const homes = [
    {"name": "Home A", "location": [13.015407, 80.225554], "required_kg": 10},  
    {"name": "Home B", "location": [13.009463, 80.213121], "required_kg": 15},  
    {"name": "Home C", "location": [12.995608, 80.188828], "required_kg": 15},   
    {"name": "Home D", "location": [12.959427, 80.145210], "required_kg": 18},  
    {"name": "Home E", "location": [12.912174, 80.191740], "required_kg": 12},  
  ];

  useEffect(() => {
    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
    script.integrity = 'sha512-BwHfrr4c9kmRkLw6iXFdzcdWV/PGkVgiIyIWLLlTSXzWQzxuSg4DiQUCpauz/EWjgk5TYQqX/kvn9pG1NpYfqg==';
    script.crossOrigin = 'anonymous';
    script.async = true;
    
    script.onload = () => {
      initializeMap();
      setMapLoaded(true);
    };
    
    document.body.appendChild(script);
    
    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  const initializeMap = () => {
    // Skip if L (Leaflet) is not available yet or if map is already initialized
    if (!window.L || document.getElementById('map').innerHTML !== '') return;

    // Calculate center of map
    const allLatitudes = [...restaurants.map(r => r.location[0]), ...homes.map(h => h.location[0])];
    const allLongitudes = [...restaurants.map(r => r.location[1]), ...homes.map(h => h.location[1])];
    
    const centerLat = allLatitudes.reduce((a, b) => a + b, 0) / allLatitudes.length;
    const centerLng = allLongitudes.reduce((a, b) => a + b, 0) / allLongitudes.length;

    // Initialize map
    const map = window.L.map('map').setView([centerLat, centerLng], 13);

    // Add OpenStreetMap tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Custom restaurant icon
    const restaurantIcon = window.L.divIcon({
      html: '<div class="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">R</div>',
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Custom home icon
    const homeIcon = window.L.divIcon({
      html: '<div class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">H</div>',
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Add restaurant markers
    restaurants.forEach(restaurant => {
      const marker = window.L.marker(restaurant.location, {icon: restaurantIcon}).addTo(map);
      marker.bindPopup(`<b>${restaurant.name}</b><br>Restaurant`);
    });

    // Add home markers
    homes.forEach(home => {
      const marker = window.L.marker(home.location, {icon: homeIcon}).addTo(map);
      marker.bindPopup(`<b>${home.name}</b><br>Required: ${home.required_kg} kg`);
    });

    // Fit map to show all markers
    const allPoints = [...restaurants.map(r => r.location), ...homes.map(h => h.location)];
    const bounds = window.L.latLngBounds(allPoints);
    map.fitBounds(bounds);
  };

  useEffect(() => {
    if (mapLoaded) {
      initializeMap();
    }
  }, [mapLoaded]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4">Food Waste Distribution Map - Chennai</h2>
      
      <div id="map" style={{ height: '500px', width: '100%' }}></div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="font-bold text-lg mb-2">Restaurants</h3>
          <ul className="space-y-1">
            {restaurants.map((restaurant, idx) => (
              <li key={idx} className="flex items-center">
                <span className="inline-block w-4 h-4 bg-red-500 rounded-full mr-2"></span>
                <span>{restaurant.name}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="font-bold text-lg mb-2">Old Age Homes</h3>
          <ul className="space-y-1">
            {homes.map((home, idx) => (
              <li key={idx} className="flex items-center">
                <span className="inline-block w-4 h-4 bg-blue-500 rounded-full mr-2"></span>
                <span>{home.name} - {home.required_kg} kg required</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Loc;