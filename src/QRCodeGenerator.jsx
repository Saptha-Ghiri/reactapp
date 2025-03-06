// QRCodeGenerator.jsx
import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react"; // Change import to use named export
import { doc,collection, getDocs } from "firebase/firestore"; // Import from your existing firebase config file
import { db, storage } from "../firebase/config";

const QRCodeGenerator = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersCollection = collection(db, "userpass");
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching users: ", err);
        setError("Failed to load users");
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const downloadQRCode = (userId, userName) => {
    const canvas = document.getElementById(`qr-code-${userId}`);
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${userName || userId}_qrcode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="qr-generator-container">
      <h2>QR Code Generator</h2>
      <p>Generate QR codes for user document IDs</p>

      <div className="qr-codes-grid">
        {users.map((user) => (
          <div key={user.id} className="qr-code-item">
            <h3>{user.name || user.email || "User"}</h3>
            <QRCodeCanvas
              id={`qr-code-${user.id}`}
              value={user.id}
              size={200}
              level={"H"}
              includeMargin={true}
            />
            <p>Document ID: {user.id}</p>
            <button onClick={() => downloadQRCode(user.id, user.name)}>
              Download QR Code
            </button>
          </div>
        ))}
      </div>

      {users.length === 0 && <p>No users found in the database</p>}
    </div>
  );
};

export default QRCodeGenerator;
