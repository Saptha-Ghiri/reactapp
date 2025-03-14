import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const FoodStationDetail = () => {
  const { stationId } = useParams();
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStationDetails = async () => {
      try {
        setLoading(true);
        const stationRef = doc(db, "food stations", stationId);
        const stationSnap = await getDoc(stationRef);

        if (stationSnap.exists()) {
          setStation({
            id: stationSnap.id,
            ...stationSnap.data(),
            // Ensure the station has rack information
            racks: stationSnap.data().racks || [
              { id: 1, name: "Rack 1", isFilled: false, items: [] },
              { id: 2, name: "Rack 2", isFilled: false, items: [] },
              { id: 3, name: "Rack 3", isFilled: false, items: [] },
            ],
          });
        } else {
          setError("Food station not found");
        }
      } catch (err) {
        console.error("Error fetching food station:", err);
        setError(`Failed to load food station: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStationDetails();
  }, [stationId]);

  // Calculate station status
  const calculateStationStatus = (racks) => {
    if (!racks || racks.length === 0) return "empty";

    const filledRacks = racks.filter((rack) => rack.isFilled).length;
    if (filledRacks === 0) return "empty";
    if (filledRacks === racks.length) return "full";
    return "partial";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl text-gray-500">
          Loading food station details...
        </div>
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
    <div className="w-full max-w-4xl mx-auto p-3 sm:p-6">
      <Link
        to="/food-station"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 sm:mb-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 sm:h-5 sm:w-5 mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm sm:text-base">Back to Map</span>
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              {station.name}
            </h1>
            <span
              className={`self-start px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${
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

          {/* Location Info */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">
              Location
            </h2>
            <p className="text-gray-700 text-sm sm:text-base">
              {station.address || station.location || "No address information"}
            </p>
            <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">
              Coordinates: {station.latitude}, {station.longitude}
            </div>
          </div>

          {/* Visual Representation of Rack with Food */}
          <div className="mt-4 sm:mt-8 p-3 sm:p-6 border rounded-lg shadow-inner bg-gray-50">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-center">
              Food Station Cabinet
            </h2>
            <div className="flex justify-center">
              {/* Visual Rack with shelves */}
              <div className="relative w-full max-w-xs sm:max-w-md md:max-w-lg">
                {/* Cabinet Background */}
                <div
                  className="sm:h-[500px] h-80 w-full bg-contain bg-no-repeat bg-center mx-auto"
                  style={{
                    backgroundImage: "url('/food box.png')",
                    maxWidth: "500px",
                  }}
                ></div>

                {/* Food Items Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between items-center p-2 sm:p-3">
                  {/* Rack 1 (Top) */}
                  <div className="h-1/3 w-full px-2 justify-between items-center">
                    {station.racks[0]?.isFilled ? (
                      <div className="w-full h-full flex bg-black bg-opacity-40 rounded justify-between items-center">
                        {/* Left side - Image */}
                        <div className="w-1/3 h-full flex justify-center items-center p-1">
                          <img
                            src={
                              station.racks[0]?.imageUrl ||
                              "/placeholder-food.png"
                            }
                            alt={station.racks[0]?.Diet || "Food"}
                            className="max-h-full max-w-full object-contain rounded shadow-md"
                            onError={(e) => {
                              e.target.src = "/placeholder-food.png";
                            }}
                          />
                        </div>

                        {/* Right side - Details */}
                        <div className="w-2/3 p-1 sm:p-2 text-white">
                          <p className="font-bold text-xs sm:text-sm">
                            {station.racks[0]?.name}
                          </p>

                          <p className="text-xs sm:text-sm">
                            Date: {station.racks[0]?.date}
                          </p>
                          <p className="text-xs sm:text-sm">
                            Food Type: {station.racks[0]?.Diet}
                          </p>
                          {station.racks[0]?.items?.length > 0 && (
                            <p className="text-xs mt-1 truncate">
                              {station.racks[0]?.items.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-40 text-white rounded">
                        <div className="text-center">
                          <p className="font-bold text-xs sm:text-sm">
                            {station.racks[0]?.name || "Unknown Rack"}
                          </p>
                          <p className="text-red-300 font-semibold text-xs sm:text-sm">
                            Empty
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rack 2 (Middle) */}
                  <div className="h-1/3 w-full px-2">
                    {station.racks[1]?.isFilled ? (
                      <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-40 rounded">
                        {/* Left side - Image */}
                        <div className="w-1/3 h-full flex justify-center items-center p-1">
                          <img
                            src={
                              station.racks[1]?.imageUrl ||
                              "/placeholder-food.png"
                            }
                            alt={station.racks[1]?.Diet || "Food"}
                            className="max-h-full max-w-full object-contain rounded shadow-md"
                            onError={(e) => {
                              e.target.src = "/placeholder-food.png";
                            }}
                          />
                        </div>

                        {/* Right side - Details */}
                        <div className="w-2/3 p-1 sm:p-2 text-white">
                          <p className="font-bold text-xs sm:text-sm">
                            {station.racks[1]?.name}
                          </p>
                          <p className="text-green-300 font-semibold text-xs sm:text-sm">
                            Filled
                          </p>
                          <p className="text-xs sm:text-sm">
                            Food Type: {station.racks[1]?.Diet}
                          </p>
                          {station.racks[1]?.items?.length > 0 && (
                            <p className="text-xs mt-1 truncate">
                              {station.racks[1]?.items.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-40 text-white rounded">
                        <div className="text-center">
                          <p className="font-bold text-xs sm:text-sm">
                            {station.racks[1]?.name || "Unknown Rack"}
                          </p>
                          <p className="text-red-300 font-semibold text-xs sm:text-sm">
                            Empty
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rack 3 (Bottom) */}
                  <div className="h-1/3 w-full px-2">
                    {station.racks[2]?.isFilled ? (
                      <div className="w-full h-full flex items-center bg-black bg-opacity-40 rounded">
                        {/* Left side - Image */}
                        <div className="w-1/3 h-full flex justify-center items-center p-1">
                          <img
                            src={
                              station.racks[2]?.imageUrl ||
                              "/placeholder-food.png"
                            }
                            alt={station.racks[2]?.Diet || "Food"}
                            className="max-h-full max-w-full object-contain rounded shadow-md"
                            onError={(e) => {
                              e.target.src = "/placeholder-food.png";
                            }}
                          />
                        </div>

                        {/* Right side - Details */}
                        <div className="w-2/3 p-1 sm:p-2 text-white">
                          <p className="font-bold text-xs sm:text-sm">
                            {station.racks[2]?.name}
                          </p>
                          <p className="text-green-300 font-semibold text-xs sm:text-sm">
                            Filled
                          </p>
                          <p className="text-xs sm:text-sm">
                            Food Type: {station.racks[2]?.Diet}
                          </p>
                          {station.racks[2]?.items?.length > 0 && (
                            <p className="text-xs mt-1 truncate">
                              {station.racks[2]?.items.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-40 text-white rounded">
                        <div className="text-center">
                          <p className="font-bold text-xs sm:text-sm">
                            {station.racks[2]?.name || "Unknown Rack"}
                          </p>
                          <p className="text-red-300 font-semibold text-xs sm:text-sm">
                            Empty
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodStationDetail;
