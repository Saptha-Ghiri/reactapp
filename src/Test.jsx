import React, { useState } from 'react';
import {
    collection,
    getDoc,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
  } from "firebase/firestore";
  import { db, storage } from "../firebase/config";

const AddSampleStations = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Sample food station data
  const sampleStations = [
    {
      name: "Central Food Station",
      latitude: 13.07801,
      longitude: 80.268846,
      address: "123 Main Street, Chennai",
      location: "Downtown",
      imageUrl: "https://example.com/images/central-station.jpg",
      racks: [
        { id: 1, name: "Rack 1", isFilled: true, Diet: "Rice" },
        { id: 2, name: "Rack 2", isFilled: false, Diet: [] },
        { id: 3, name: "Rack 3", isFilled: true, Diet: "Bread" }
      ]
    }
  ];

  // Function to add a single food station
  const addFoodStation = async (stationData) => {
    try {
      const docRef = await addDoc(collection(db, "food stations"), stationData);
      return docRef.id;
    } catch (error) {
      throw error;
    }
  };

  // Handle adding all sample stations
  const handleAddSampleStations = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    setProgress({ current: 0, total: sampleStations.length });

    try {
      for (let i = 0; i < sampleStations.length; i++) {
        const station = sampleStations[i];
        await addFoodStation(station);
        setProgress({ current: i + 1, total: sampleStations.length });
      }
      
      setMessage({ 
        text: `Successfully added ${sampleStations.length} food stations to Firestore!`, 
        type: 'success' 
      });
    } catch (error) {
      console.error("Error adding sample stations:", error);
      setMessage({ 
        text: `Error adding stations: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Add Sample Food Stations</h2>
      
      {message.text && (
        <div className={`p-4 mb-4 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}
      
      {loading && progress.total > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress:</span>
            <span>{progress.current} of {progress.total} stations</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          This will add {sampleStations.length} sample food stations to your Firestore database. 
          Each station includes location data and rack information.
        </p>
      </div>
      
      <button
        onClick={handleAddSampleStations}
        disabled={loading}
        className={`w-full py-3 rounded-md text-white font-medium transition-colors ${
          loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Adding Stations...' : 'Add Sample Stations'}
      </button>
    </div>
  );
};

export default AddSampleStations;