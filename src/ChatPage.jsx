// src/ChatPage.jsx
// Place this file in the same directory as your ChatButton.jsx for simplicity

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Chat from "./Chat"; // Assuming you'll create a Chat.jsx file here too

const ChatPage = () => {
  const [activeConversationId, setActiveConversationId] = useState(null);
  const location = useLocation();

  // Extract conversation ID from URL query parameters if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const conversationId = params.get("conversation");
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
  }, [location]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      <Chat initialConversationId={activeConversationId} />
    </div>
  );
};

export default ChatPage;
