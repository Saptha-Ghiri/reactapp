import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch user's conversations
  useEffect(() => {
    if (!currentUser?.uid) {
      setError("Please log in to use the chat feature");
      setLoading(false);
      return;
    }

    // Query for conversations where the user is either the donor or the receiver
    const conversationsQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      async (snapshot) => {
        try {
          const conversationsData = [];
          const userIds = new Set();
          const unreadCountsData = {};

          snapshot.docs.forEach((doc) => {
            const conversation = { id: doc.id, ...doc.data() };
            conversationsData.push(conversation);
            
            // Get the other participant's ID
            const otherUserId = conversation.participants.find(
              (id) => id !== currentUser.uid
            );
            userIds.add(otherUserId);
            
            // Store unread counts
            if (conversation.unreadCount && conversation.unreadCount[currentUser.uid]) {
              unreadCountsData[conversation.id] = conversation.unreadCount[currentUser.uid];
            }
          });

          // Fetch user details for all participants
          const usersDetails = {};
          await Promise.all(
            Array.from(userIds).map(async (userId) => {
              const userDoc = await getDoc(doc(db, "userpass", userId));
              if (userDoc.exists()) {
                usersDetails[userId] = userDoc.data();
              }
            })
          );

          setUserDetails(usersDetails);
          setUnreadCounts(unreadCountsData);
          setConversations(conversationsData);
        } catch (err) {
          console.error("Error processing conversations:", err);
          setError("Failed to load conversations");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching conversations:", error);
        setError("Failed to load conversations");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Load messages for the active chat
  useEffect(() => {
    if (!activeChat) return;

    const messagesQuery = query(
      collection(db, "conversations", activeChat.id, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesData);
      
      // Mark messages as read
      markMessagesAsRead(activeChat.id);
      
      // Update unread counts
      setUnreadCounts((prev) => ({
        ...prev,
        [activeChat.id]: 0,
      }));
    });

    return () => unsubscribe();
  }, [activeChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const markMessagesAsRead = async (conversationId) => {
    try {
      // Get the conversation document
      const conversationRef = doc(db, "conversations", conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const conversationData = conversationDoc.data();
        const unreadCount = { ...conversationData.unreadCount };
        
        // If there are unread messages for the current user, mark them as read
        if (unreadCount && unreadCount[currentUser.uid]) {
          unreadCount[currentUser.uid] = 0;
          await updateDoc(conversationRef, { unreadCount });
        }
      }
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChat) return;

    try {
      const otherUserId = activeChat.participants.find(
        (id) => id !== currentUser.uid
      );

      // Add message to the messages subcollection
      await addDoc(collection(db, "conversations", activeChat.id, "messages"), {
        text: messageInput.trim(),
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        read: false,
      });

      // Update conversation with last message and update unread count for the other user
      const conversationRef = doc(db, "conversations", activeChat.id);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const conversationData = conversationDoc.data();
        const unreadCount = { ...conversationData.unreadCount } || {};
        
        // Increment unread count for the other user
        unreadCount[otherUserId] = (unreadCount[otherUserId] || 0) + 1;
        
        await updateDoc(conversationRef, {
          lastMessage: messageInput.trim(),
          lastMessageTime: serverTimestamp(),
          lastMessageSender: currentUser.uid,
          unreadCount,
        });
      }

      // Clear input
      setMessageInput("");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getConversationName = (conversation) => {
    if (!conversation) return "";
    
    const otherUserId = conversation.participants.find(
      (id) => id !== currentUser.uid
    );
    
    if (userDetails[otherUserId]) {
      return userDetails[otherUserId].displayName || userDetails[otherUserId].email || "Unknown User";
    }
    
    return "Unknown User";
  };

  const startNewChat = async (donationId) => {
    try {
      // First get the donation details to identify the donor
      const donationDoc = await getDoc(doc(db, "food items", donationId));
      
      if (!donationDoc.exists()) {
        throw new Error("Donation not found");
      }
      
      const donationData = donationDoc.data();
      const donorId = donationData.userId;
      const receiverId = currentUser.uid;
      
      // Check if the current user is trying to chat with themselves
      if (donorId === receiverId) {
        setError("You cannot chat with yourself");
        return;
      }
      
      // Check if a conversation already exists between these users for this donation
      const conversationsQuery = query(
        collection(db, "conversations"),
        where("donationId", "==", donationId),
        where("participants", "array-contains", currentUser.uid)
      );
      
      const existingConversations = await getDocs(conversationsQuery);
      
      if (!existingConversations.empty) {
        // Conversation exists, set it as active
        const existingConversation = {
          id: existingConversations.docs[0].id,
          ...existingConversations.docs[0].data(),
        };
        setActiveChat(existingConversation);
        return;
      }
      
      // Create a new conversation
      const newConversation = {
        participants: [donorId, receiverId],
        donationId,
        donationName: donationData.foodName,
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageTime: serverTimestamp(),
        lastMessageSender: "",
        unreadCount: {
          [donorId]: 0,
          [receiverId]: 0,
        },
      };
      
      const conversationRef = await addDoc(
        collection(db, "conversations"),
        newConversation
      );
      
      setActiveChat({
        id: conversationRef.id,
        ...newConversation,
      });
    } catch (err) {
      console.error("Error starting new chat:", err);
      setError(`Failed to start new chat: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading chats...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-[80vh] bg-gray-100 rounded-lg overflow-hidden shadow-lg">
      {/* Conversations List */}
      <div className="w-1/3 bg-white border-r border-gray-300">
        <div className="p-4 bg-gray-50 border-b border-gray-300">
          <h2 className="text-xl font-semibold">Chats</h2>
        </div>
        
        <div className="overflow-y-auto h-[calc(80vh-60px)]">
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                  activeChat?.id === conversation.id ? "bg-blue-50" : ""
                }`}
                onClick={() => setActiveChat(conversation)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      {getConversationName(conversation)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {conversation.donationName}
                    </p>
                  </div>
                  {unreadCounts[conversation.id] > 0 && (
                    <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1">
                      {unreadCounts[conversation.id]}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex justify-between">
                  <p className="text-sm text-gray-500 truncate max-w-[70%]">
                    {conversation.lastMessage || "No messages yet"}
                  </p>
                  <span className="text-xs text-gray-400">
                    {formatTime(conversation.lastMessageTime)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="w-2/3 flex flex-col">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-300 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">
                  {getConversationName(activeChat)}
                </h2>
                <p className="text-sm text-gray-600">
                  {activeChat.donationName}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#e5ded8]">
              {messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((message, index) => {
                    // Check if we should show date header
                    let showDate = false;
                    if (index === 0) {
                      showDate = true;
                    } else {
                      const prevMessage = messages[index - 1];
                      const prevDate = prevMessage.timestamp?.toDate().toDateString();
                      const currentDate = message.timestamp?.toDate().toDateString();
                      if (prevDate !== currentDate) {
                        showDate = true;
                      }
                    }

                    const isSentByMe = message.senderId === currentUser.uid;

                    return (
                      <React.Fragment key={message.id}>
                        {showDate && (
                          <div className="flex justify-center my-2">
                            <span className="bg-white px-2 py-1 rounded-lg text-xs text-gray-500">
                              {formatDate(message.timestamp)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${
                            isSentByMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] px-3 py-2 rounded-lg ${
                              isSentByMe
                                ? "bg-[#dcf8c6] rounded-tr-none"
                                : "bg-white rounded-tl-none"
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            <div className="flex justify-end items-center mt-1">
                              <span className="text-xs text-gray-500">
                                {formatTime(message.timestamp)}
                              </span>
                              {isSentByMe && (
                                <span className="ml-1 text-xs text-blue-500">
                                  ✓✓
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 bg-white p-3 rounded-lg">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-3 bg-gray-50 border-t border-gray-300 flex">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                placeholder="Type a message"
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="ml-2 bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a chat from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;