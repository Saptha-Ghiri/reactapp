import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/config";

const ReceiverNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.uid) {
          setError("Please login to view notifications");
          setLoading(false);
          return;
        }

        // Query the receiver-notifications collection
        const notificationsRef = collection(db, "receiver-notifications");
        const q = query(notificationsRef, where("userId", "==", user.uid));

        const querySnapshot = await getDocs(q);
        const fetchedNotifications = [];

        querySnapshot.forEach((doc) => {
          fetchedNotifications.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        // Sort notifications: unread first, then by date (newest first)
        fetchedNotifications.sort((a, b) => {
          if (a.read !== b.read) return a.read ? 1 : -1;
          return new Date(b.rejectedAt) - new Date(a.rejectedAt);
        });

        setNotifications(fetchedNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up a timer to refresh notifications every 30 seconds
    const timer = setInterval(fetchNotifications, 30000);

    return () => clearInterval(timer);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, "receiver-notifications", notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });

      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-gray-500">
          Loading notifications...
        </div>
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
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-6">Your Notifications</h2>

      {notifications.length === 0 ? (
        <div className="text-center text-gray-500 p-8 bg-gray-50 rounded-lg">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 transition duration-200 ${
                !notification.read
                  ? "bg-red-50 border-red-200"
                  : "bg-white border-gray-200"
              }`}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-grow space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {notification.foodName}
                    </h3>
                    {!notification.read && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600">
                    Rejected on:{" "}
                    {new Date(notification.rejectedAt).toLocaleString()}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p>
                      <span className="font-medium">Quantity:</span>{" "}
                      {notification.quantity}
                    </p>
                    <p>
                      <span className="font-medium">Type:</span>{" "}
                      {notification.foodType}
                    </p>
                    <p>
                      <span className="font-medium">Location:</span>{" "}
                      {notification.pickupLocation}
                    </p>
                    {notification.donorContact && (
                      <p>
                        <span className="font-medium">Donor:</span>{" "}
                        {notification.donorContact}
                      </p>
                    )}
                  </div>

                  {notification.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-100 rounded-md">
                      <p className="text-sm text-red-700">
                        <span className="font-medium">Rejection reason:</span>{" "}
                        {notification.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <span className="px-3 py-1 rounded-full text-sm text-red-600 bg-red-100">
                  Donation Rejected
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceiverNotifications;
