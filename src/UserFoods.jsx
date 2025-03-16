import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";

const UserFoods = ({ userId: propUserId }) => {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(propUserId || null);
  const navigate = useNavigate();

  useEffect(() => {
    // If userId is provided as a prop, use it directly
    if (propUserId) {
      setUserId(propUserId);
      return;
    }

    // Otherwise, try to get it from localStorage (fix for auth issue)
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserId(userData.uid);
    } else {
      setError("User not logged in. Please log in to view your contributions.");
      setLoading(false);
    }
  }, [propUserId]);

  useEffect(() => {
    // Only run the fetch if we have a userId
    if (!userId) return;

    const fetchUserContributions = async () => {
      try {
        setLoading(true);

        // Get all food donations from activity logs
        const activityRef = collection(db, "activity-logs");
        const donationsQuery = query(
          activityRef,
          where("type", "==", "donation"),
          where("userId", "==", userId),
          orderBy("timestamp", "desc")
        );

        const activitySnapshot = await getDocs(donationsQuery);

        // Array to store all processed contributions
        const userContributions = [];

        // Process each donation activity
        for (const activityDoc of activitySnapshot.docs) {
          const activityData = activityDoc.data();

          // Fetch the station data to get current status
          const stationRef = doc(db, "food stations", activityData.stationId);
          const stationSnap = await getDoc(stationRef);

          if (stationSnap.exists()) {
            const stationData = stationSnap.data();

            // Find the rack where this food was placed
            const rack = stationData.racks?.find(
              (r) => r.id === activityData.rackId
            );

            // Check if the food is still there based on rack data
            const isStillThere = rack?.isFilled && rack?.donatedBy === userId;

            // Get collection activity if the food was taken
            let collectionActivity = null;
            // Always check for collection activity regardless of rack status
            // This is the key fix - we need to check collection logs directly
            const collectionsQuery = query(
              activityRef,
              where("type", "==", "collection"),
              where("stationId", "==", activityData.stationId),
              where("rackId", "==", activityData.rackId),
              orderBy("timestamp", "desc")
            );

            const collectionSnap = await getDocs(collectionsQuery);
            if (!collectionSnap.empty) {
              // Get the most recent collection
              collectionActivity = {
                id: collectionSnap.docs[0].id,
                ...collectionSnap.docs[0].data(),
                timestamp:
                  collectionSnap.docs[0].data().timestamp?.toDate?.() ||
                  new Date(),
              };
            }

            // Determine status based on collection activity
            const status = collectionActivity ? "taken" : "available";

            // Add to contributions list
            userContributions.push({
              id: activityDoc.id,
              stationId: activityData.stationId,
              stationName:
                stationData.name || `Station ${activityData.stationId}`,
              rackId: activityData.rackId,
              foodDetails: activityData.foodDetails,
              donatedAt: activityData.timestamp?.toDate?.() || new Date(),
              status: status,
              collectedBy: collectionActivity?.userId || null,
              collectedAt: collectionActivity?.timestamp || null,
            });
          }
        }

        setContributions(userContributions);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user contributions:", err);
        setError(`Failed to load your contributions: ${err.message}`);
        setLoading(false);
      }
    };

    fetchUserContributions();
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
      <h1 className="text-2xl font-bold mb-6">My Food Contributions</h1>

      {contributions.length === 0 ? (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
          You haven't donated any food yet. Visit a food station to make your
          first contribution!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {contributions.map((contribution) => (
            <div
              key={contribution.id}
              className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200"
            >
              <div className="flex flex-col md:flex-row">
                {/* Food image */}
                <div className="md:w-1/3">
                  {contribution.foodDetails?.imageUrl ? (
                    <img
                      src={contribution.foodDetails.imageUrl}
                      alt={contribution.foodDetails.name}
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
                      {contribution.foodDetails?.name || "Unnamed food"}
                    </h2>

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        contribution.status === "available"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {contribution.status === "available"
                        ? "Available"
                        : "Collected"}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    {contribution.foodDetails?.diet === "veg"
                      ? "Vegetarian"
                      : "Non-Vegetarian"}
                  </p>

                  <div className="space-y-2 text-gray-700">
                    <p>
                      <span className="font-medium">Station:</span>{" "}
                      {contribution.stationName}
                    </p>
                    <p>
                      <span className="font-medium">Rack:</span>{" "}
                      {contribution.rackId}
                    </p>
                    <p>
                      <span className="font-medium">Donated:</span>{" "}
                      {formatDate(contribution.donatedAt)}
                    </p>

                    {contribution.status === "taken" && (
                      <p>
                        <span className="font-medium">Collected:</span>{" "}
                        {formatDate(contribution.collectedAt)}
                      </p>
                    )}
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => goToStation(contribution.stationId)}
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

export default UserFoods;
