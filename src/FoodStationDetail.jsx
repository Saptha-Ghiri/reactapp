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
                <div className="absolute inset-0 flex flex-col justify-between sm:mx-10 sm:my-5 mx-5 my-3 items-center p-2 sm:p-3">
                  {/* Rack 1 (Top) */}
                  <div className="h-1/2 w-full px-2 justify-between items-center m-2">
                    {station.racks[0]?.isFilled ? (
                      <div className="w-full h-full text-center flex bg-black bg-opacity-40 rounded justify-between items-center border border-white">
                        {/* Left side - Image */}
                        <div className=" h-full flex justify-center items-center p-1">
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
                  <div className="h-1/2 w-full px-2">
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



// // FoodStationDetails.jsx - Component for viewing food station details
// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
// import { db } from "../firebase/config";

// const FoodStationDetails = () => {
//   const [station, setStation] = useState(null);
//   const [recentActivity, setRecentActivity] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
  
//   const { stationId } = useParams();
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchStationData = async () => {
//       try {
//         setLoading(true);
        
//         // Fetch station details
//         const stationRef = doc(db, "food stations", stationId);
//         const stationSnap = await getDoc(stationRef);
        
//         if (stationSnap.exists()) {
//           setStation({
//             id: stationSnap.id,
//             ...stationSnap.data()
//           });
          
//           // Fetch recent activity for this station
//           const activityQuery = query(
//             collection(db, "activity-logs"),
//             where("stationId", "==", stationId),
//             orderBy("timestamp", "desc"),
//             limit(10)
//           );
          
//           const activitySnap = await getDocs(activityQuery);
//           const activityData = [];
          
//           activitySnap.forEach((doc) => {
//             activityData.push({
//               id: doc.id,
//               ...doc.data(),
//               timestamp: doc.data().timestamp?.toDate?.() || new Date()
//             });
//           });
          
//           setRecentActivity(activityData);
//         } else {
//           setError("Food station not found");
//         }
//       } catch (err) {
//         console.error("Error fetching station data:", err);
//         setError(`Error: ${err.message}`);
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     fetchStationData();
//   }, [stationId]);

//   const handleInteract = () => {
//     navigate(`/food-station/${stationId}/interact`);
//   };

//   if (loading) {
//     return (
//       <div className="w-full max-w-4xl mx-auto p-4 flex justify-center items-center h-64">
//         <div className="text-center">
//           <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
//           <p className="mt-2">Loading station details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="w-full max-w-4xl mx-auto p-4">
//         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
//           {error}
//         </div>
//         <button
//           onClick={() => navigate("/")}
//           className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//         >
//           Go Home
//         </button>
//       </div>
//     );
//   }

//   if (!station) {
//     return null;
//   }

//   return (
//     <div className="w-full max-w-4xl mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">{station.name}</h1>
      
//       {/* Station details */}
//       <div className="bg-white shadow-md rounded-lg p-6 mb-6">
//         <div className="flex flex-col md:flex-row mb-4">
//           <div className="md:w-1/2 mb-4 md:mb-0">
//             <h2 className="text-xl font-semibold mb-2">Station Details</h2>
//             <p className="mb-2"><strong>Location:</strong> {station.location}</p>
//             <p className="mb-2"><strong>Status:</strong> {station.status || "Active"}</p>
//             <p><strong>Last Maintained:</strong> {
//               station.lastMaintenance 
//                 ? new Date(station.lastMaintenance.seconds * 1000).toLocaleDateString() 
//                 : "Not available"
//             }</p>
//           </div>
          
//           <div className="md:w-1/2">
//             <h2 className="text-xl font-semibold mb-2">Available Racks</h2>
//             <div className="space-y-2">
//               {station.racks?.map((rack) => (
//                 <div key={rack.id} className="flex items-center">
//                   <div className={`w-3 h-3 rounded-full mr-2 ${rack.isFilled ? "bg-red-500" : "bg-green-500"}`}></div>
//                   <span>{rack.name || `Rack ${rack.id}`}: {rack.isFilled ? "Filled" : "Empty"}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
        
//         <div className="mt-4">
//           <button
//             onClick={handleInteract}
//             className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//           >
//             Interact with Station
//           </button>
//         </div>
//       </div>
      
//       {/* Available Foods */}
//       <div className="bg-white shadow-md rounded-lg p-6 mb-6">
//         <h2 className="text-xl font-semibold mb-4">Available Foods</h2>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {station.racks?.filter(rack => rack.isFilled).map((rack) => (
//             <div key={rack.id} className="border rounded p-4">
//               <div className="flex flex-col items-center">
//                 {rack.imageUrl && (
//                   <img 
//                     src={rack.imageUrl} 
//                     alt={rack.name} 
//                     className="w-full h-48 object-cover rounded mb-4"
//                   />
//                 )}
//                 <h3 className="text-lg font-semibold">{rack.name}</h3>
//                 <div className="mt-2 flex items-center">
//                   <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
//                     rack.Diet === "veg" ? "bg-green-500" : "bg-red-500"
//                   }`}></span>
//                   <span>{rack.Diet === "veg" ? "Vegetarian" : "Non-Vegetarian"}</span>
//                 </div>
//                 <p className="text-gray-600 mt-1">Best before: {rack.date}</p>
//                 <p className="text-gray-600 mt-1">Added: {
//                   rack.donatedAt 
//                     ? new Date(rack.donatedAt).toLocaleDateString() 
//                     :
//                     "Not available"
//                 }</p>
//               </div>
//             </div>
//           ))}
          
//           {station.racks?.filter(rack => rack.isFilled).length === 0 && (
//             <div className="col-span-2 text-center p-4 bg-gray-100 rounded">
//               <p>No food items are currently available at this station.</p>
//             </div>
//           )}
//         </div>
//       </div>
      
//       {/* Sensor data display */}
//       <div className="bg-white shadow-md rounded-lg p-6 mb-6">
//         <h2 className="text-xl font-semibold mb-4">Sensor Data</h2>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {station.racks?.map((rack) => (
//             <div key={rack.id} className="border rounded p-4">
//               <h3 className="font-semibold mb-2">{rack.name || `Rack ${rack.id}`}</h3>
//               <div className="space-y-1">
//                 <div className="flex items-center justify-between">
//                   <span>Ultrasonic Sensor:</span>
//                   <span className="font-medium">
//                     {rack.distance ? `${rack.distance} cm` : "No data"}
//                     {rack.distance && rack.isFilled && rack.distance < 10 && (
//                       <span className="ml-2 text-green-600">● Food detected</span>
//                     )}
//                   </span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span>Temperature:</span>
//                   <span className="font-medium">
//                     {rack.temperature ? `${rack.temperature}°C` : "No data"}
//                     {rack.temperature && (
//                       <span className={`ml-2 ${
//                         rack.temperature > 30 ? "text-red-600" : "text-green-600"
//                       }`}>
//                         {rack.temperature > 30 ? "● High" : "● Normal"}
//                       </span>
//                     )}
//                   </span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span>Gas Sensor:</span>
//                   <span className="font-medium">
//                     {rack.gasLevel ? `${rack.gasLevel} ppm` : "No data"}
//                     {rack.gasLevel && (
//                       <span className={`ml-2 ${
//                         rack.gasLevel > 500 ? "text-red-600" : "text-green-600"
//                       }`}>
//                         {rack.gasLevel > 500 ? "● Warning" : "● Normal"}
//                       </span>
//                     )}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
      
//       {/* Recent Activity */}
//       <div className="bg-white shadow-md rounded-lg p-6">
//         <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        
//         {recentActivity.length > 0 ? (
//           <div className="overflow-x-auto">
//             <table className="w-full table-auto">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-4 py-2 text-left">Type</th>
//                   <th className="px-4 py-2 text-left">Food</th>
//                   <th className="px-4 py-2 text-left">Rack</th>
//                   <th className="px-4 py-2 text-left">Time</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 {recentActivity.map((activity) => (
//                   <tr key={activity.id}>
//                     <td className="px-4 py-2">
//                       <span className={`px-2 py-1 rounded text-xs font-medium ${
//                         activity.type === "donation" 
//                           ? "bg-green-100 text-green-800" 
//                           : "bg-blue-100 text-blue-800"
//                       }`}>
//                         {activity.type === "donation" ? "Donated" : "Collected"}
//                       </span>
//                     </td>
//                     <td className="px-4 py-2">
//                       {activity.foodDetails?.name || "Unknown food"}
//                     </td>
//                     <td className="px-4 py-2">
//                       Rack {activity.rackId}
//                     </td>
//                     <td className="px-4 py-2">
//                       {activity.timestamp instanceof Date 
//                         ? activity.timestamp.toLocaleString() 
//                         : "Unknown time"
//                       }
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <div className="text-center p-4 bg-gray-100 rounded">
//             <p>No recent activity for this station.</p>
//           </div>
//         )}
//       </div>
      
//       {/* Navigation buttons */}
//       <div className="mt-6 flex justify-between">
//         <button
//           onClick={() => navigate("/")}
//           className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
//         >
//           Back to Home
//         </button>
        
//         <button
//           onClick={handleInteract}
//           className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//         >
//           Interact with Station
//         </button>
//       </div>
//     </div>
//   );
// };

// export default FoodStationDetails;