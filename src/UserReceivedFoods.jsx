import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy
} from "firebase/firestore";
import { db } from "../firebase/config";
import { getAuth } from "firebase/auth";

const UserReceivedFoods = ({ userId: propUserId }) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(propUserId || null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    // If userId is provided as a prop, use it directly
    if (propUserId) {
      setUserId(propUserId);
      return;
    }
    
    // Try to get user from localStorage instead of Firebase Auth
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserId(userData.uid);
    } else {
      setError("User not logged in. Please log in to view your collections.");
      setLoading(false);
    }
  }, [propUserId]);

  useEffect(() => {
    // Only run the fetch if we have a userId
    if (!userId) return;

    const fetchUserCollections = async () => {
      try {
        setLoading(true);
        
        // Get all food collections from activity logs
        const activityRef = collection(db, "activity-logs");
        const collectionsQuery = query(
          activityRef,
          where("type", "==", "collection"),
          where("userId", "==", userId),
          orderBy("timestamp", "desc")
        );
        
        const activitySnapshot = await getDocs(collectionsQuery);
        
        // Array to store all processed collections
        const userCollections = [];
        
        // Process each collection activity
        for (const activityDoc of activitySnapshot.docs) {
          const activityData = activityDoc.data();
          
          // Fetch the station data
          const stationRef = doc(db, "food stations", activityData.stationId);
          const stationSnap = await getDoc(stationRef);
          
          if (stationSnap.exists()) {
            const stationData = stationSnap.data();
            
            // Get donation activity to see who donated this food
            let donationActivity = null;
            const donationsQuery = query(
              activityRef,
              where("type", "==", "donation"),
              where("stationId", "==", activityData.stationId),
              where("rackId", "==", activityData.rackId)
            );
            
            const donationSnap = await getDocs(donationsQuery);
            if (!donationSnap.empty) {
              // Get the donation info
              donationActivity = {
                id: donationSnap.docs[0].id,
                ...donationSnap.docs[0].data(),
                timestamp: donationSnap.docs[0].data().timestamp?.toDate?.() || new Date()
              };
            }
            
            // Add to collections list
            userCollections.push({
              id: activityDoc.id,
              stationId: activityData.stationId,
              stationName: stationData.name || `Station ${activityData.stationId}`,
              rackId: activityData.rackId,
              foodDetails: activityData.foodDetails || donationActivity?.foodDetails || { name: "Unknown Food" },
              collectedAt: activityData.timestamp?.toDate?.() || new Date(),
              donatedBy: donationActivity?.userId || null,
              donatedAt: donationActivity?.timestamp || null
            });
          }
        }
        
        setCollections(userCollections);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user collections:", err);
        setError(`Failed to load your collections: ${err.message}`);
        setLoading(false);
      }
    };

    fetchUserCollections();
  }, [userId]);

  // Function to format date
  const formatDate = (date) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleString();
  };

  // Navigate to the station details
  const goToStation = (stationId) => {
    navigate(`/food-station/${stationId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Food I've Received</h1>
      
      {collections.length === 0 ? (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
          You haven't collected any food yet. Visit a food station to find available food!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {collections.map((collection) => (
            <div 
              key={collection.id} 
              className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200"
            >
              <div className="flex flex-col md:flex-row">
                {/* Food image */}
                <div className="md:w-1/3">
                  {collection.foodDetails?.imageUrl ? (
                    <img 
                      src={collection.foodDetails.imageUrl} 
                      alt={collection.foodDetails.name} 
                      className="w-full h-48 md:h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 md:h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                </div>
                
                {/* Food details */}
                <div className="md:w-2/3 p-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold mb-2">
                      {collection.foodDetails?.name || "Unnamed food"}
                    </h2>
                    
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      Collected
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {collection.foodDetails?.diet === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                  </p>
                  
                  <div className="space-y-2 text-gray-700">
                    <p>
                      <span className="font-medium">Station:</span> {collection.stationName}
                    </p>
                    <p>
                      <span className="font-medium">Rack:</span> {collection.rackId}
                    </p>
                    <p>
                      <span className="font-medium">Collected:</span> {formatDate(collection.collectedAt)}
                    </p>
                    
                    {collection.donatedAt && (
                      <p>
                        <span className="font-medium">Was donated:</span> {formatDate(collection.donatedAt)}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={() => goToStation(collection.stationId)}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                    >
                      View Station
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserReceivedFoods;