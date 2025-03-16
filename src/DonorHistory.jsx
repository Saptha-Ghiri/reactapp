import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

const DonorHistory = () => {
  const [completedDonations, setCompletedDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalDonated, setTotalDonated] = useState(0);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalReceivers: 0,
    vegItems: 0,
    nonVegItems: 0
  });

  useEffect(() => {
    const fetchCompletedDonations = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.uid) {
          setError("Please login to view your donation history");
          setLoading(false);
          return;
        }

        // Query for all completed donations by this user
        const donationsQuery = query(
          collection(db, "food items"),
          where("userId", "==", user.uid),
          where("status", "==", "completed")
        );

        const querySnapshot = await getDocs(donationsQuery);
        const donations = [];
        let totalItems = 0;
        const uniqueReceivers = new Set();
        let vegCount = 0;
        let nonVegCount = 0;

        querySnapshot.forEach((doc) => {
          const donation = { id: doc.id, ...doc.data() };
          donations.push(donation);
          totalItems++;
          
          // Track unique receivers
          if (donation.receivedBy) {
            uniqueReceivers.add(donation.receivedBy);
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

        setCompletedDonations(donations);
        setTotalDonated(donations.length);
        setStats({
          totalItems,
          totalReceivers: uniqueReceivers.size,
          vegItems: vegCount,
          nonVegItems: nonVegCount
        });
      } catch (err) {
        console.error("Error fetching donation history:", err);
        setError("Failed to load your donation history");
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedDonations();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-gray-500">Loading donation history...</div>
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
        <h1 className="text-3xl font-bold mb-6 text-center">Your Donation History</h1>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-500 text-sm">Total Donations</p>
            <p className="text-3xl font-bold text-purple-600">{stats.totalItems}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-500 text-sm">People Helped</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalReceivers}</p>
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

        {/* Achievement Badge - Only show if at least 5 donations */}
        {stats.totalItems >= 5 && (
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg shadow p-6 mb-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-2">Food Champion Badge Earned! 🏆</h2>
            <p className="mb-2">Thank you for making a difference! You've donated {stats.totalItems} food items to those in need.</p>
            <p className="text-sm">Share your achievement with friends and inspire others to donate!</p>
          </div>
        )}

        {/* History List */}
        {completedDonations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No Completed Donations Yet</h2>
            <p className="text-gray-600 mb-4">
              You haven't completed any donations yet. When someone receives your donated food,
              it will appear here in your history.
            </p>
            <a
              href="/posts"
              className="inline-block bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
            >
              Start Donating
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Completed Donations</h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completedDonations.map((donation) => (
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
                        <span className="font-medium">Receiver:</span>{" "}
                        {donation.receiverContact || "Anonymous"}
                      </p>
                      <p>
                        <span className="font-medium">Location:</span>{" "}
                        {donation.pickupLocation}
                      </p>
                    </div>

                    <div className="mt-4 text-center">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm inline-block">
                        Successfully Donated
                      </span>
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
            Thank you for your generosity! Want to help more people?
          </p>
          <a
            href="/posts"
            className="inline-block bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition font-medium"
          >
            Donate More Food
          </a>
        </div>
      </div>
    </div>
  );
};

export default DonorHistory;