// App.js
import React, { useState, useEffect } from "react";
import { ref, onValue, set, getDatabase } from "firebase/database";

function Display() {
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    gasValue: 0,
    distance: 0,
    foodPresent: false,
    foodSpoiled: false,
    lastUpdate: null,
  });

  // For UI state of the app
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const rtdb = getDatabase();
    const sensorRef = ref(rtdb, "foodMonitor");

    // Set up listener for real-time updates
    setLoading(true);
    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        setLoading(false);
        const data = snapshot.val();
        if (data) {
          setSensorData((prevData) => ({
            ...prevData,
            ...data,
            lastUpdate: new Date().toLocaleString(),
          }));
        } else {
          setError("No data available");
        }
      },
      (err) => {
        setLoading(false);
        setError("Failed to load data: " + err.message);
      }
    );

    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  const sendCommand = (command) => {
    try {
      const rtdb = getDatabase();
      const commandRef = ref(rtdb, "foodMonitor/commands");
      set(commandRef, { servo: command });
    } catch (err) {
      setError("Failed to send command: " + err.message);
    }
  };

  // Helper function to determine temperature status
  const getTemperatureStatus = (temp) => {
    if (temp === null || temp === undefined) return "text-gray-500";
    if (temp > 30) return "text-red-500";
    if (temp > 25) return "text-yellow-500";
    return "text-green-500";
  };

  // Helper function to determine gas status
  const getGasStatus = (gasValue) => {
    if (gasValue === null || gasValue === undefined) return "text-gray-500";
    if (gasValue > 400) return "text-red-500";
    if (gasValue > 300) return "text-yellow-500";
    return "text-green-500";
  };

  // Helper function to determine food status badge color
  const getFoodStatusColor = (isPresent, isSpoiled) => {
    if (!isPresent) return "bg-gray-200 text-gray-800";
    if (isSpoiled) return "bg-red-500 text-white";
    return "bg-green-500 text-white";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading sensor data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Smart Food Monitor
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {sensorData.lastUpdate || "Never"}
          </p>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto">
          {/* Status Overview */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Current Status</h2>
            <div className="flex flex-wrap items-center">
              <div className="flex-1 min-w-[200px] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">
                    Food Present:
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      sensorData.foodPresent
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {sensorData.foodPresent ? "Yes" : "No"}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-[200px] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">
                    Food Status:
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      sensorData.foodSpoiled
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {sensorData.foodSpoiled ? "Spoiled" : "Safe"}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-[200px] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Container:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      sensorData.distance < 10
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {sensorData.distance < 10 ? "Closed" : "Open"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sensor Readings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Temperature Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 bg-blue-50 border-b border-blue-100">
                <h3 className="font-medium text-blue-800">Temperature</h3>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Current</p>
                    <p
                      className={`text-2xl font-bold ${getTemperatureStatus(
                        sensorData.temperature
                      )}`}
                    >
                      {sensorData.temperature}°C
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Threshold</p>
                  <p className="text-sm font-medium text-gray-700">30°C</p>
                </div>
              </div>
            </div>

            {/* Humidity Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 bg-blue-50 border-b border-blue-100">
                <h3 className="font-medium text-blue-800">Humidity</h3>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Current</p>
                    <p className="text-2xl font-bold text-blue-500">
                      {sensorData.humidity}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Optimal Range</p>
                  <p className="text-sm font-medium text-gray-700">40-60%</p>
                </div>
              </div>
            </div>

            {/* Gas Sensor Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 bg-blue-50 border-b border-blue-100">
                <h3 className="font-medium text-blue-800">Gas Sensor</h3>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Current</p>
                    <p
                      className={`text-2xl font-bold ${getGasStatus(
                        sensorData.gasValue
                      )}`}
                    >
                      {sensorData.gasValue}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Threshold</p>
                  <p className="text-sm font-medium text-gray-700">400</p>
                </div>
              </div>
            </div>

            {/* Distance Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 bg-blue-50 border-b border-blue-100">
                <h3 className="font-medium text-blue-800">Distance</h3>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Current</p>
                    <p className="text-2xl font-bold text-blue-500">
                      {sensorData.distance} cm
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Threshold</p>
                  <p className="text-sm font-medium text-gray-700">10 cm</p>
                </div>
              </div>
            </div>
          </div>

          {/* Food Status Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <h3 className="font-medium text-blue-800">Food Status</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="w-full sm:w-1/2 bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-lg font-medium text-gray-700 mb-2">
                    Container Status
                  </div>
                  <div
                    className={`inline-flex items-center px-4 py-2 rounded-full ${
                      sensorData.foodPresent
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    <span className="text-lg font-medium">
                      {sensorData.foodPresent ? "Food Present" : "Empty"}
                    </span>
                  </div>
                </div>
                <div className="w-full sm:w-1/2 bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-lg font-medium text-gray-700 mb-2">
                    Food Quality
                  </div>
                  <div
                    className={`inline-flex items-center px-4 py-2 rounded-full ${
                      !sensorData.foodSpoiled
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    <span className="text-lg font-medium">
                      {!sensorData.foodSpoiled ? "Safe to Consume" : "Spoiled"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Food Status Message */}
              <div className="mt-6 p-4 rounded-lg bg-blue-50">
                <p className="text-center text-blue-800">
                  {!sensorData.foodPresent
                    ? "No food detected in the container."
                    : sensorData.foodSpoiled
                    ? "Warning: Food spoilage detected! Please check the container."
                    : "Food is fresh and safe to consume."}
                </p>
              </div>
            </div>
          </div>

          {/* Remote Control */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <h3 className="font-medium text-blue-800">Remote Control</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4 text-center">
                Control the food container lid remotely:
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => sendCommand("open")}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                  Open Lid
                </button>
                <button
                  onClick={() => sendCommand("close")}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  Close Lid
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 bg-gray-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            Smart Food Monitor System &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Display;
