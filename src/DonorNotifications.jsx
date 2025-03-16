import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  deleteDoc, // Add this import
} from "firebase/firestore";
import { db } from "../firebase/config";

const DonorNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.uid) {
      setError("Please login to view notifications");
      setLoading(false);
      return;
    }

    const donationsRef = collection(db, "food items");
    const q = query(
      donationsRef,
      where("userId", "==", user.uid),
      where("status", "in", ["accepted", "rejected"])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newNotifications = [];
        snapshot.forEach((doc) => {
          newNotifications.push({
            id: doc.id,
            ...doc.data(),
            read: doc.data().notificationRead || false,
          });
        });

        newNotifications.sort((a, b) => {
          // Sort by read status first (unread first)
          if (a.read !== b.read) return a.read ? 1 : -1;
          // Then by date
          return (
            new Date(b.acceptedAt || b.rejectedAt) -
            new Date(a.acceptedAt || a.rejectedAt)
          );
        });

        setNotifications(newNotifications);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setError("Failed to load notifications");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const deleteAssociatedChat = async (donationId) => {
    try {
      // Find any conversations related to this donation
      const conversationsQuery = query(
        collection(db, "conversations"),
        where("donationId", "==", donationId)
      );

      const conversationSnapshots = await getDocs(conversationsQuery);

      // Delete each conversation and its messages
      const deletePromises = conversationSnapshots.docs.map(
        async (conversationDoc) => {
          const conversationId = conversationDoc.id;

          // First delete all messages in the conversation
          const messagesQuery = collection(
            db,
            "conversations",
            conversationId,
            "messages"
          );
          const messageSnapshots = await getDocs(messagesQuery);

          // Delete each message
          const messageDeletePromises = messageSnapshots.docs.map(
            (messageDoc) =>
              deleteDoc(
                doc(
                  db,
                  "conversations",
                  conversationId,
                  "messages",
                  messageDoc.id
                )
              )
          );

          // Wait for all messages to be deleted
          await Promise.all(messageDeletePromises);

          // Then delete the conversation itself
          return deleteDoc(doc(db, "conversations", conversationId));
        }
      );

      // Wait for all conversations to be deleted
      await Promise.all(deletePromises);

      console.log(
        `Successfully deleted all chats associated with donation: ${donationId}`
      );
    } catch (error) {
      console.error("Error deleting associated chats:", error);
    }
  };

  // 2. Next, let's modify the handleRejectDonation function in DonorNotifications.jsx
  // to delete the chat when a donor rejects a food request

  const handleRejectDonation = async (donation) => {
    const reason = window.prompt(
      "Please provide a reason for rejection (optional):"
    );
    if (reason === null) return; // User cancelled

    setProcessingAction(true);
    try {
      const docRef = doc(db, "food items", donation.id);

      // Store the receiver ID before updating the document
      const receiverId = donation.acceptedBy;
      const receiverContact = donation.receiverContact;

      // First, create a notification for the receiver
      if (receiverId) {
        // Add to a 'receiver-notifications' collection
        await addDoc(collection(db, "receiver-notifications"), {
          userId: receiverId,
          foodItemId: donation.id,
          foodName: donation.foodName,
          donorId: donation.userId,
          donorContact: donation.donorContact || "Unknown",
          status: "rejected",
          rejectionReason: reason || "No reason provided",
          rejectedAt: new Date().toISOString(),
          read: false,
          // Include other relevant food details
          foodType: donation.foodType,
          quantity: donation.quantity,
          pickupLocation: donation.pickupLocation,
        });
      }

      // Delete any associated chat conversations
      await deleteAssociatedChat(donation.id);

      // Then update the food item status to be available again
      const rejectionData = {
        status: "available", // Changed from 'rejected' to 'available'
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason || "No reason provided",
        notificationRead: true,
        // Clear receiver information
        acceptedBy: null,
        acceptedAt: null,
        receiverContact: null,
      };

      await updateDoc(docRef, rejectionData);

      setActionFeedback({
        type: "success",
        message:
          "Request rejected successfully. The receiver has been notified and food is now available for other users.",
      });

      // Clear feedback after 5 seconds
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (error) {
      console.error("Error rejecting donation:", error);
      setActionFeedback({
        type: "error",
        message: "Failed to reject request. Please try again.",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUndoRejection = async (donation) => {
    setProcessingAction(true);
    try {
      const docRef = doc(db, "food items", donation.id);
      await updateDoc(docRef, {
        status: "available",
        rejectedAt: null,
        rejectionReason: null,
        acceptedBy: null,
        acceptedAt: null,
        notificationRead: true,
      });

      setActionFeedback({
        type: "success",
        message: "Rejection undone. The donation is now available again.",
      });

      setTimeout(() => setActionFeedback(null), 5000);
    } catch (error) {
      console.error("Error undoing rejection:", error);
      setActionFeedback({
        type: "error",
        message: "Failed to undo rejection. Please try again.",
      });
    } finally {
      setProcessingAction(false);
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
      <Alert variant="destructive" className="max-w-4xl mx-auto mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-6">Donation Notifications</h2>

      {actionFeedback && (
        <Alert
          variant={
            actionFeedback.type === "success" ? "default" : "destructive"
          }
        >
          {actionFeedback.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>{actionFeedback.message}</AlertDescription>
        </Alert>
      )}

      {notifications.length === 0 ? (
        <div className="text-center text-gray-500 p-8 bg-gray-50 rounded-lg">
          No notifications yet. Your accepted donations will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 transition duration-200 ${
                notification.status === "rejected"
                  ? "bg-red-50 border-red-200"
                  : !notification.read
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-grow space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {notification.foodName}
                    </h3>
                    {!notification.read && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600">
                    {notification.status === "accepted"
                      ? `Accepted on: ${new Date(
                          notification.acceptedAt
                        ).toLocaleString()}`
                      : `Rejected on: ${new Date(
                          notification.rejectedAt
                        ).toLocaleString()}`}
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
                    {notification.receiverContact && (
                      <p>
                        <span className="font-medium">Receiver:</span>{" "}
                        {notification.receiverContact}
                      </p>
                    )}
                  </div>

                  {notification.status === "rejected" &&
                    notification.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-100 rounded-md">
                        <p className="text-sm text-red-700">
                          <span className="font-medium">Rejection reason:</span>{" "}
                          {notification.rejectionReason}
                        </p>
                      </div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                  {notification.status === "accepted" && (
                    <button
                      onClick={() => handleRejectDonation(notification)}
                      disabled={processingAction}
                      className="text-sm bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Reject Request
                    </button>
                  )}

                  {notification.status === "rejected" && (
                    <button
                      onClick={() => handleUndoRejection(notification)}
                      disabled={processingAction}
                      className="text-sm bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Undo Rejection
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    notification.status === "accepted"
                      ? "text-yellow-600 bg-yellow-100"
                      : "text-red-600 bg-red-100"
                  }`}
                >
                  {notification.status === "accepted"
                    ? "Awaiting Pickup"
                    : "Rejected"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonorNotifications;
