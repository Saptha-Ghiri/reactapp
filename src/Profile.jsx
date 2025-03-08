import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { db, doc, getDoc } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { Download, User, QrCode } from "lucide-react";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Get user from localStorage
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
          setError("Not logged in");
          setLoading(false);
          return;
        }

        const userData = JSON.parse(storedUser);

        // Fetch the complete user document from Firestore using the UID
        const userDocRef = doc(db, "userpass", userData.uid);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
          setUser({
            id: userSnapshot.id,
            ...userSnapshot.data(),
            ...userData,
          });
        } else {
          setError("User document not found");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching user data: ", err);
        setError("Failed to load user data");
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const downloadQRCode = () => {
    if (!user) return;

    const canvas = document.getElementById(`qr-code-${user.id}`);
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${user.username || user.id}_qrcode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your QR code...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 mb-4 text-5xl">
            <QrCode className="mx-auto" size={64} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Error
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-6 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-6 px-6 text-white">
          <h2 className="text-2xl font-bold flex items-center">
            <User className="mr-2" />
            Your Profile
          </h2>
          <p className="opacity-80">Your personal QR code</p>
        </div>

        <div className="p-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {user.username || "User"}
            </h3>

            <div className="bg-gray-50 p-4 rounded-lg inline-block mx-auto border border-gray-200">
              <QRCodeCanvas
                id={`qr-code-${user.id}`}
                value={user.id}
                size={200}
                level={"H"}
                includeMargin={true}
                bgColor={"#FFFFFF"}
                fgColor={"#9333EA"}
              />
            </div>

            <p className="text-gray-500 mt-4 text-sm">Document ID: {user.id}</p>

            <button
              onClick={downloadQRCode}
              className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-6 rounded-lg flex items-center justify-center mx-auto transform hover:scale-[1.02] transition-all"
            >
              <Download size={18} className="mr-2" />
              Download QR Code
            </button>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-sm text-gray-500 text-center">
              This QR code contains your unique user identifier. Keep it safe
              and use it to quickly identify yourself in the app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
