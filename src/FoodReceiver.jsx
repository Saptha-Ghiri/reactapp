// import React, { useState, useEffect } from "react";
// import {
//   collection,
//   getDocs,
//   doc,
//   updateDoc,
//   getDoc,
//   query,
//   where,
//   onSnapshot,
// } from "firebase/firestore";
// import { db } from "../firebase/config";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";

// const FoodReceiver = () => {
//   const [donations, setDonations] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [acceptedDonations, setAcceptedDonations] = useState([]);
//   const [rejectedDonations, setRejectedDonations] = useState([]);
//   const [mapCenter, setMapCenter] = useState([13.07801, 80.268846]);
//   const [processingAction, setProcessingAction] = useState(false);

//   // Custom icon for food markers
//   const foodIcon = L.icon({
//     iconUrl:
//       "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
//     shadowUrl:
//       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
//     iconSize: [25, 41],
//     iconAnchor: [12, 41],
//     popupAnchor: [1, -34],
//     shadowSize: [41, 41],
//   });

//   useEffect(() => {
//     fetchDonations();
//     subscribeToUserDonations();

//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         setMapCenter([position.coords.latitude, position.coords.longitude]);
//       },
//       (error) => console.error("Error getting location:", error)
//     );
//   }, []);

//   const subscribeToUserDonations = () => {
//     const user = JSON.parse(localStorage.getItem("user"));
//     if (!user?.uid) return;

//     const q = query(
//       collection(db, "food items"),
//       where("acceptedBy", "==", user.uid),
//       where("status", "in", ["accepted", "rejected"])
//     );

//     return onSnapshot(
//       q,
//       (snapshot) => {
//         const userDonations = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));

//         const accepted = userDonations.filter((d) => d.status === "accepted");
//         const rejected = userDonations.filter((d) => d.status === "rejected");

//         setAcceptedDonations(accepted);
//         setRejectedDonations(rejected);
//       },
//       (error) => {
//         console.error("Error subscribing to donations:", error);
//         setError("Failed to load your donations");
//       }
//     );
//   };

//   const fetchDonations = async () => {
//     try {
//       const querySnapshot = await getDocs(collection(db, "food items"));
//       const availableDonations = querySnapshot.docs
//         .map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }))
//         .filter((donation) => donation.status === "available");
//       setDonations(availableDonations);
//     } catch (err) {
//       setError("Failed to load donations");
//       console.error("Error fetching donations:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAccept = async (donationId) => {
//     const user = JSON.parse(localStorage.getItem("user"));
//     console.log("Current user:", user);

//     if (!user?.uid) {
//       alert("Please login to accept donations");
//       return;
//     }

//     setProcessingAction(true);
//     try {
//       const donationRef = doc(db, "food items", donationId);
//       const donationDoc = await getDoc(donationRef);

//       if (!donationDoc.exists()) {
//         throw new Error("Donation not found");
//       }

//       // Check if the donation is still available
//       const donationData = donationDoc.data();
//       if (donationData.status !== "available") {
//         throw new Error("Donation is no longer available");
//       }

//       // Create update object without undefined values
//       const updateData = {
//         status: "accepted",
//         acceptedBy: user.uid,
//         acceptedAt: new Date().toISOString(),
//       };

//       // Only add receiverContact if we have either email or phone
//       if (user.email || user.phoneNumber) {
//         updateData.receiverContact = user.email || user.phoneNumber;
//       }

//       await updateDoc(donationRef, updateData);

//       setDonations((prev) => prev.filter((d) => d.id !== donationId));
//       alert("Food donation accepted successfully!");
//     } catch (err) {
//       console.error("Error accepting donation:", err);
//       alert(`Failed to accept donation: ${err.message}`);
//     } finally {
//       setProcessingAction(false);
//     }
//   };

//   if (loading) {
//     return <div className="text-center p-8">Loading donations...</div>;
//   }

//   if (error) {
//     return (
//       <Alert variant="destructive" className="max-w-4xl mx-auto mt-4">
//         <AlertCircle className="h-4 w-4" />
//         <AlertDescription>{error}</AlertDescription>
//       </Alert>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-100 p-6">
//       <div className="max-w-6xl mx-auto space-y-8">
//         {/* Rejection Notifications */}
//         {rejectedDonations.length > 0 && (
//           <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//             <h2 className="text-xl font-bold text-red-700 mb-4">
//               Rejected Donations
//             </h2>
//             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//               {rejectedDonations.map((donation) => (
//                 <div
//                   key={donation.id}
//                   className="bg-white border border-red-200 rounded-lg p-4"
//                 >
//                   <div className="flex justify-between items-start">
//                     <h3 className="text-lg font-semibold">
//                       {donation.foodName}
//                     </h3>
//                     <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
//                       Rejected
//                     </span>
//                   </div>
//                   <div className="mt-2 space-y-2 text-sm">
//                     <p>
//                       <span className="font-medium">Rejected on:</span>{" "}
//                       {new Date(donation.rejectedAt).toLocaleString()}
//                     </p>
//                     {donation.rejectionReason && (
//                       <p className="text-red-600">
//                         <span className="font-medium">Reason:</span>{" "}
//                         {donation.rejectionReason}
//                       </p>
//                     )}
//                     <p>
//                       <span className="font-medium">Location:</span>{" "}
//                       {donation.pickupLocation}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Map View */}
//         <div className="bg-white p-4 rounded-lg shadow">
//           <h2 className="text-xl font-bold mb-4">
//             Available Donations Near You
//           </h2>
//           <div className="h-[400px] rounded-lg overflow-hidden">
//             <MapContainer
//               center={mapCenter}
//               zoom={13}
//               className="h-full w-full"
//             >
//               <TileLayer
//                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//               />
//               {donations.map((donation) => (
//                 <Marker
//                   key={donation.id}
//                   position={[donation.latitude, donation.longitude]}
//                   icon={foodIcon}
//                 >
//                   <Popup>
//                     <div className="max-w-xs">
//                       <h3 className="font-bold">{donation.foodName}</h3>
//                       <p>Quantity: {donation.quantity}</p>
//                       <p>Type: {donation.foodType}</p>
//                       <button
//                         onClick={() => handleAccept(donation.id)}
//                         disabled={processingAction}
//                         className="mt-2 bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 disabled:bg-gray-400"
//                       >
//                         {processingAction ? "Processing..." : "Accept"}
//                       </button>
//                     </div>
//                   </Popup>
//                 </Marker>
//               ))}
//             </MapContainer>
//           </div>
//         </div>

//         {/* Available Donations List */}
//         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//           {donations.map((donation) => (
//             <div key={donation.id} className="bg-white rounded-lg shadow p-4">
//               {donation.imageUrl && (
//                 <img
//                   src={donation.imageUrl}
//                   alt={donation.foodName}
//                   className="w-full h-48 object-cover rounded-lg mb-4"
//                 />
//               )}
//               <div className="flex justify-between items-start mb-2">
//                 <h3 className="text-xl font-bold">{donation.foodName}</h3>
//                 <span
//                   className={`px-2 py-1 rounded-full text-sm ${
//                     donation.foodType === "Veg"
//                       ? "bg-green-100 text-green-800"
//                       : "bg-red-100 text-red-800"
//                   }`}
//                 >
//                   {donation.foodType}
//                 </span>
//               </div>
//               <div className="space-y-2 mb-4">
//                 <p>
//                   <span className="font-semibold">Quantity:</span>{" "}
//                   {donation.quantity}
//                 </p>
//                 <p>
//                   <span className="font-semibold">Location:</span>{" "}
//                   {donation.pickupLocation}
//                 </p>
//                 <p>
//                   <span className="font-semibold">Expires:</span>{" "}
//                   {new Date(donation.expiryDate).toLocaleString()}
//                 </p>
//                 {donation.notes && (
//                   <p className="italic text-gray-600">{donation.notes}</p>
//                 )}
//               </div>
//               <button
//                 onClick={() => handleAccept(donation.id)}
//                 disabled={processingAction}
//                 className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition duration-200 disabled:bg-gray-400"
//               >
//                 {processingAction ? "Processing..." : "Accept Donation"}
//               </button>
//             </div>
//           ))}
//         </div>

//         {/* Accepted Donations Section */}
//         {acceptedDonations.length > 0 && (
//           <div className="mt-8">
//             <h2 className="text-2xl font-bold mb-4">Your Accepted Donations</h2>
//             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//               {acceptedDonations.map((donation) => (
//                 <div
//                   key={donation.id}
//                   className="bg-white rounded-lg shadow p-4"
//                 >
//                   <div className="flex justify-between items-start mb-2">
//                     <h3 className="text-xl font-bold">{donation.foodName}</h3>
//                     <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
//                       Accepted
//                     </span>
//                   </div>
//                   <div className="space-y-2">
//                     <p>
//                       <span className="font-semibold">Accepted on:</span>{" "}
//                       {new Date(donation.acceptedAt).toLocaleString()}
//                     </p>
//                     <p>
//                       <span className="font-semibold">Donor Contact:</span>{" "}
//                       {donation.donorContact}
//                     </p>
//                     <p>
//                       <span className="font-semibold">Pickup Location:</span>{" "}
//                       {donation.pickupLocation}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default FoodReceiver;

import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const FoodReceiver = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptedDonations, setAcceptedDonations] = useState([]);
  const [rejectedDonations, setRejectedDonations] = useState([]);
  const [mapCenter, setMapCenter] = useState([13.07801, 80.268846]);
  const [processingAction, setProcessingAction] = useState(false);

  // Custom icon for food markers
  const foodIcon = L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const subscribeToNotifications = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.uid) return;

    const q = query(
      collection(db, "food items"),
      where("acceptedBy", "==", user.uid),
      where("status", "in", ["rejected"])
    );

    return onSnapshot(q, (snapshot) => {
      const userNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(userNotifications);
    });
  };

  useEffect(() => {
    fetchDonations();
    subscribeToUserDonations();
    subscribeToNotifications(); // Make sure to call this

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter([position.coords.latitude, position.coords.longitude]);
      },
      (error) => console.error("Error getting location:", error)
    );
  }, []);

  const subscribeToUserDonations = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.uid) return;

    const q = query(
      collection(db, "food items"),
      where("acceptedBy", "==", user.uid),
      where("status", "in", ["accepted", "rejected"])
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const userDonations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const accepted = userDonations.filter((d) => d.status === "accepted");
        const rejected = userDonations.filter((d) => d.status === "rejected");

        setAcceptedDonations(accepted);
        setRejectedDonations(rejected);
      },
      (error) => {
        console.error("Error subscribing to donations:", error);
        setError("Failed to load your donations");
      }
    );
  };

  const fetchDonations = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "food items"));
      const availableDonations = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((donation) => donation.status === "available");
      setDonations(availableDonations);
    } catch (err) {
      setError("Failed to load donations");
      console.error("Error fetching donations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (donationId) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.uid) {
      alert("Please login to accept donations");
      return;
    }

    setProcessingAction(true);
    try {
      const donationRef = doc(db, "food items", donationId);
      const donationDoc = await getDoc(donationRef);

      if (!donationDoc.exists()) {
        throw new Error("Donation not found");
      }

      const donationData = donationDoc.data();
      if (donationData.status !== "available") {
        throw new Error("Donation is no longer available");
      }

      const updateData = {
        status: "accepted",
        acceptedBy: user.uid,
        acceptedAt: new Date().toISOString(),
      };

      if (user.email || user.phoneNumber) {
        updateData.receiverContact = user.email || user.phoneNumber;
      }

      await updateDoc(donationRef, updateData);
      setDonations((prev) => prev.filter((d) => d.id !== donationId));
      alert("Food donation accepted successfully!");
    } catch (err) {
      console.error("Error accepting donation:", err);
      alert(`Failed to accept donation: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCancel = async (donationId) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.uid) {
      alert("Please login to cancel donations");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this acceptance?")) {
      return;
    }

    setProcessingAction(true);
    try {
      const donationRef = doc(db, "food items", donationId);
      const donationDoc = await getDoc(donationRef);

      if (!donationDoc.exists()) {
        throw new Error("Donation not found");
      }

      const donationData = donationDoc.data();
      if (donationData.acceptedBy !== user.uid) {
        throw new Error("You can only cancel your own accepted donations");
      }

      await updateDoc(donationRef, {
        status: "available",
        acceptedBy: null,
        acceptedAt: null,
        receiverContact: null,
        cancellationReason: "Cancelled by receiver",
        cancelledAt: new Date().toISOString(),
      });

      setAcceptedDonations((prev) => prev.filter((d) => d.id !== donationId));
      alert("Donation acceptance cancelled successfully!");
    } catch (err) {
      console.error("Error cancelling donation:", err);
      alert(`Failed to cancel donation: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading donations...</div>;
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {rejectedDonations.map((donation) => (
          <div
            key={donation.id}
            className="bg-white border border-red-200 rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold">{donation.foodName}</h3>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                Rejected
              </span>
            </div>
            <div className="mt-2 space-y-2 text-sm">
              <p>
                <span className="font-medium">Rejected on:</span>{" "}
                {new Date(donation.rejectedAt).toLocaleString()}
              </p>
              {donation.rejectionReason && (
                <p className="text-red-600">
                  <span className="font-medium">Reason:</span>{" "}
                  {donation.rejectionReason}
                </p>
              )}
              {!donation.rejectionReason && (
                <p className="text-gray-500 italic">
                  No rejection reason provided
                </p>
              )}
              <p>
                <span className="font-medium">Location:</span>{" "}
                {donation.pickupLocation}
              </p>
            </div>
          </div>
        ))}

        {/* Map View */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">
            Available Donations Near You
          </h2>
          <div className="h-[400px] rounded-lg overflow-hidden">
            <MapContainer
              center={mapCenter}
              zoom={13}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {donations.map((donation) => (
                <Marker
                  key={donation.id}
                  position={[donation.latitude, donation.longitude]}
                  icon={foodIcon}
                >
                  <Popup>
                    <div className="max-w-xs">
                      <h3 className="font-bold">{donation.foodName}</h3>
                      <p>Quantity: {donation.quantity}</p>
                      <p>Type: {donation.foodType}</p>
                      <button
                        onClick={() => handleAccept(donation.id)}
                        disabled={processingAction}
                        className="mt-2 bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 disabled:bg-gray-400"
                      >
                        {processingAction ? "Processing..." : "Accept"}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Available Donations List */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {donations.map((donation) => (
            <div key={donation.id} className="bg-white rounded-lg shadow p-4">
              {donation.imageUrl && (
                <img
                  src={donation.imageUrl}
                  alt={donation.foodName}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
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
              <div className="space-y-2 mb-4">
                <p>
                  <span className="font-semibold">Quantity:</span>{" "}
                  {donation.quantity}
                </p>
                <p>
                  <span className="font-semibold">Location:</span>{" "}
                  {donation.pickupLocation}
                </p>
                <p>
                  <span className="font-semibold">Expires:</span>{" "}
                  {new Date(donation.expiryDate).toLocaleString()}
                </p>
                {donation.notes && (
                  <p className="italic text-gray-600">{donation.notes}</p>
                )}
              </div>
              <button
                onClick={() => handleAccept(donation.id)}
                disabled={processingAction}
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition duration-200 disabled:bg-gray-400"
              >
                {processingAction ? "Processing..." : "Accept Donation"}
              </button>
            </div>
          ))}
        </div>

        {/* Accepted Donations Section */}
        {acceptedDonations.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Your Accepted Donations</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {acceptedDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="bg-white rounded-lg shadow p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">{donation.foodName}</h3>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                      Accepted
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Accepted on:</span>{" "}
                      {new Date(donation.acceptedAt).toLocaleString()}
                    </p>
                    <p>
                      <span className="font-semibold">Donor Contact:</span>{" "}
                      {donation.donorContact}
                    </p>
                    <p>
                      <span className="font-semibold">Pickup Location:</span>{" "}
                      {donation.pickupLocation}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancel(donation.id)}
                    disabled={processingAction}
                    className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition duration-200 disabled:bg-gray-400"
                  >
                    {processingAction ? "Processing..." : "Cancel Acceptance"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodReceiver;
