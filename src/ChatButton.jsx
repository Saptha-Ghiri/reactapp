// File: src/ChatButton.jsx
// This file should be placed directly in your src folder

import React, { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config"; // Adjust path as needed for your project

// Export as both default and named export to handle different import styles
const ChatButton = ({ donationId, donorId, receiverId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const checkExistingConversation = async () => {
      if (!currentUser?.uid || !donationId) return;

      try {
        // Check if conversation exists
        const conversationsQuery = query(
          collection(db, "conversations"),
          where("donationId", "==", donationId),
          where("participants", "array-contains", currentUser.uid)
        );

        const querySnapshot = await getDocs(conversationsQuery);
        if (!querySnapshot.empty) {
          setConversationId(querySnapshot.docs[0].id);
        }
      } catch (err) {
        console.error("Error checking for existing conversation:", err);
      }
    };

    checkExistingConversation();
  }, [currentUser?.uid, donationId]);

  const startChat = async () => {
    if (!currentUser?.uid) {
      alert("Please log in to use the chat feature");
      return;
    }

    setLoading(true);
    try {
      if (conversationId) {
        // If conversation exists, navigate to it
        window.location.href = `/chat?conversation=${conversationId}`;
        return;
      }

      // Get donation details
      const donationDoc = await getDoc(doc(db, "food items", donationId));
      if (!donationDoc.exists()) {
        throw new Error("Donation not found");
      }

      const donationData = donationDoc.data();
      const participants = [donationData.userId];

      // If receiverId is provided (for donor view), use it
      // Otherwise, use the current user (for receiver view)
      if (receiverId) {
        participants.push(receiverId);
      } else {
        participants.push(currentUser.uid);
      }

      // Create a new conversation
      const newConversation = {
        participants,
        donationId,
        donationName: donationData.foodName,
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageTime: serverTimestamp(),
        unreadCount: {
          [participants[0]]: 0,
          [participants[1]]: 0,
        },
      };

      const conversationRef = await addDoc(
        collection(db, "conversations"),
        newConversation
      );

      // Navigate to chat with the new conversation
      window.location.href = `/chat?conversation=${conversationRef.id}`;
    } catch (err) {
      console.error("Error starting chat:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={startChat}
      disabled={loading}
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors disabled:bg-gray-400"
    >
      {loading ? (
        "Loading..."
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-5 w-5 mr-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {conversationId ? "Open Chat" : "Start Chat"}
        </>
      )}
    </button>
  );
};

// Export as both default export and named export to handle different import styles
export { ChatButton };
export default ChatButton;
