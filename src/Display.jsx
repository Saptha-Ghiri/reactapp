import React, { useState, useEffect } from "react";
import { getDatabase,  ref, onValue, set } from "firebase/database"; // Import from your firebase.js
import {
  Thermometer,
  Droplets,
  Wind,
  Box,
  BellRing,
  Activity,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

const Display = () => {
  const [sensorData, setSensorData] = useState({
    Temperature: 0,
    Humidity: 0,
    GasValue: 0,
    Distance: 0,
    FoodPresent: false,
    FoodSpoiled: false,
    ServoStatus: "Unknown",
  });
  const rtdb = getDatabase();

  const [motorStatus, setMotorStatus] = useState("closed");
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Listen for sensor data changes
    const sensorRef = ref(rtdb, "sensorData");
    const unsubscribeSensor = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorData(data);
      }
    });

    // Listen for motor status changes
    const motorRef = ref(rtdb, "motorStatus");
    const unsubscribeMotor = onValue(motorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (typeof data === "string") {
          setMotorStatus(data);
        } else if (data.status) {
          setMotorStatus(data.status);
        }
      }
    });

    // Cleanup function to unsubscribe from listeners
    return () => {
      // Firebase automatically handles cleanup when component unmounts
    };
  }, []);

  const handleOpenClose = (status) => {
    // Update Firebase with the new motor status
    const motorRef = ref(rtdb, "motorStatus");
    set(motorRef, status)
      .then(() => console.log(`Motor status updated to: ${status}`))
      .catch((error) => console.error("Error updating motor status:", error));
  };

  // Determine status colors
  const getTemperatureColor = () => {
    if (sensorData.Temperature > 30) return "text-red-600";
    if (sensorData.Temperature > 25) return "text-yellow-500";
    return "text-green-500";
  };

  const getGasColor = () => {
    if (sensorData.GasValue > 400) return "text-red-600";
    if (sensorData.GasValue > 300) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Smart Food Container Monitor
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => handleOpenClose("open")}
            className={`px-4 py-2 rounded-lg ${
              motorStatus === "open"
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Open
          </button>
          <button
            onClick={() => handleOpenClose("closed")}
            className={`px-4 py-2 rounded-lg ${
              motorStatus === "closed"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Close
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2">
              <Box className="text-blue-500" size={24} />
              <span className="text-lg font-medium">Container Status:</span>
              <span className="text-lg">
                {sensorData.ServoStatus ||
                  (motorStatus === "open" ? "Open" : "Closed")}
              </span>
            </div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2">
              <Activity
                className={
                  sensorData.FoodPresent ? "text-green-500" : "text-gray-400"
                }
                size={24}
              />
              <span className="text-lg font-medium">Food Status:</span>
              <span
                className={`text-lg ${
                  sensorData.FoodSpoiled
                    ? "text-red-600 font-bold"
                    : "text-green-500"
                }`}
              >
                {!sensorData.FoodPresent
                  ? "No Food Detected"
                  : sensorData.FoodSpoiled
                  ? "SPOILED - ATTENTION NEEDED!"
                  : "Healthy"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {sensorData.FoodSpoiled && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 flex items-center">
          <BellRing className="mr-2" />
          <div>
            <p className="font-bold">Food Alert!</p>
            <p>Potential food spoilage detected. Please check immediately.</p>
          </div>
        </div>
      )}

      {/* Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Temperature Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Thermometer className="text-red-500 mr-2" />
              <h3 className="font-medium">Temperature</h3>
            </div>
            <span className={`text-xl font-bold ${getTemperatureColor()}`}>
              {sensorData.Temperature}°C
            </span>
          </div>
        </div>

        {/* Humidity Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Droplets className="text-blue-500 mr-2" />
              <h3 className="font-medium">Humidity</h3>
            </div>
            <span className="text-xl font-bold text-blue-500">
              {sensorData.Humidity}%
            </span>
          </div>
        </div>

        {/* Gas Value Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Wind className="text-purple-500 mr-2" />
              <h3 className="font-medium">Gas Level</h3>
            </div>
            <span className={`text-xl font-bold ${getGasColor()}`}>
              {sensorData.GasValue}
            </span>
          </div>
        </div>

        {/* Distance Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Box className="text-gray-500 mr-2" />
              <h3 className="font-medium">Distance</h3>
            </div>
            <span className="text-xl font-bold">{sensorData.Distance} cm</span>
          </div>
        </div>
      </div>

      {/* Detailed Metrics Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-center py-2 border border-gray-300 rounded-lg mb-4"
      >
        {showDetails ? (
          <>
            <span className="mr-1">Hide Details</span>
            <ChevronUp size={16} />
          </>
        ) : (
          <>
            <span className="mr-1">Show Details</span>
            <ChevronDown size={16} />
          </>
        )}
      </button>

      {/* Detailed Metrics */}
      {showDetails && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-4">Detailed Metrics</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="font-medium">Metric</div>
              <div className="font-medium">Value</div>
              <div className="font-medium">Status</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>Temperature</div>
              <div>{sensorData.Temperature}°C</div>
              <div className={getTemperatureColor()}>
                {sensorData.Temperature > 30
                  ? "Critical"
                  : sensorData.Temperature > 25
                  ? "Warning"
                  : "Normal"}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>Humidity</div>
              <div>{sensorData.Humidity}%</div>
              <div className="text-blue-500">Normal</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>Gas Level</div>
              <div>{sensorData.GasValue}</div>
              <div className={getGasColor()}>
                {sensorData.GasValue > 400
                  ? "Critical"
                  : sensorData.GasValue > 300
                  ? "Warning"
                  : "Normal"}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>Distance</div>
              <div>{sensorData.Distance} cm</div>
              <div>{sensorData.FoodPresent ? "Food Detected" : "No Food"}</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>Container</div>
              <div>
                {sensorData.ServoStatus ||
                  (motorStatus === "open" ? "Open" : "Closed")}
              </div>
              <div
                className={
                  motorStatus === "open" ? "text-green-500" : "text-blue-500"
                }
              >
                {motorStatus === "open" ? "Open" : "Closed"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Display;
