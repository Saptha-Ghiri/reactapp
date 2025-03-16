import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

const ReceiverHistory = () => {
  const [receivedDonations, setReceivedDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalDonors: 0,
    vegItems: 0,
    nonVegItems: 0
  });

  useEffect(() => {
    const fetchReceivedDonations = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.uid) {
          setError("Please login to view your received food history");
          setLoading(false);
          return;
        }

        // Query for all completed donations received by this user
        const donationsQuery = query(
          collection(db, "food items"),
          where("receivedBy", "==", user.uid),
          where("status", "==", "completed")
        );

        const querySnapshot = await getDocs(donationsQuery);
        const donations = [];
        let totalItems = 0;
        const uniqueDonors = new Set();
        let vegCount = 0;
        let nonVegCount = 0;

        querySnapshot.forEach((doc) => {
          const donation = { id: doc.id, ...doc.data() };
          donations.push(donation);
          totalItems++;
          
          // Track unique donors
          if (donation.userId) {
            uniqueDonors.add(donation.userId);
          }

          // Count veg vs non-veg
          if (donation.foodType === "Veg") {
            vegCount++;
          } else if (donation.foodType === "Non-Veg") {
            nonVegCount++;
          }
        });

        // Sort by most recent first
        donations.sort((a, b) => {
          return new Date(b.receivedAt) - new Date(a.receivedAt);
        });

        setReceivedDonations(donations);
        setStats({
          totalItems,
          totalDonors: uniqueDonors.size,
          vegItems: vegCount,
          nonVegItems: nonVegCount
        });
      } catch (err) {
        console.error("Error fetching received food history:", err);
        setError("Failed to load your food receipt history");
      } finally {
        setLoading(false);
      }
    };

    fetchReceivedDonations();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-gray-500">Loading food receipt history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Food Receipt History</h1>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-500 text-sm">Total Received</p>
            <p className="text-3xl font-bold text-purple-600">{stats.totalItems}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-500 text-sm">Donors Who Helped</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalDonors}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-500 text-sm">Vegetarian Items</p>
            <p className="text-3xl font-bold text-green-600">{stats.vegItems}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-500 text-sm">Non-Vegetarian Items</p>
            <p className="text-3xl font-bold text-red-600">{stats.nonVegItems}</p>
          </div>
        </div>

        {/* History List */}
        {receivedDonations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No Food Receipts Yet</h2>
            <p className="text-gray-600 mb-4">
              You haven't marked any food as received yet. When you confirm receipt of a donation,
              it will appear here in your history.
            </p>
            <a
              href="/receive"
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Find Available Food
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Food You've Received</h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {receivedDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="bg-white rounded-lg shadow overflow-hidden transition-transform hover:scale-[1.02]"
                >
                  {donation.imageUrl && (
                    <img
                      src={donation.imageUrl}
                      alt={donation.foodName}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold">{donation.foodName}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          donation.foodType === "Veg"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {donation.foodType}
                      </span>
                    </div>

                    <div className="space-y-2 text-gray-600">
                      <p><span className="font-medium">Quantity:</span> {donation.quantity}</p>
                      <p>
                        <span className="font-medium">Received on:</span>{" "}
                        {new Date(donation.receivedAt).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Donor:</span>{" "}
                        {donation.donorContact || "Anonymous"}
                      </p>
                      <p>
                        <span className="font-medium">Pickup Location:</span>{" "}
                        {donation.pickupLocation}
                      </p>
                    </div>

                    {/* Feedback section - can be expanded in the future */}
                    <div className="mt-4 flex justify-center">
                      {donation.feedbackProvided ? (
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm inline-block">
                          Feedback Provided
                        </span>
                      ) : (
                        <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm inline-block hover:bg-blue-200 transition">
                          Leave Feedback
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Call to Action */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Need more food assistance?
          </p>
          <a
            href="/receive"
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition font-medium"
          >
            Find Available Food
          </a>
        </div>
      </div>
    </div>
  );
};

export default ReceiverHistory;