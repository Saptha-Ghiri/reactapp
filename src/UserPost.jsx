import { useEffect, useState } from "react";
import {
  collection,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../firebase/config";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ChatButton from "./ChatButton";

const createAnimatedIcon = () => {
  const customIcon = L.divIcon({
    className: "custom-div-icon",
    html: `
      <div class="relative">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 100 100"
          style="position: absolute; top: -48px; left: -48px; width: 96px; height: 96px;"
        >
          <circle cx="50" cy="50" r="40" fill="rgba(33, 150, 243, 0.1)">
            <animate attributeName="r" from="20" to="40" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="50" cy="50" r="30" fill="rgba(33, 150, 243, 0.2)">
            <animate attributeName="r" from="15" to="30" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.7" to="0.1" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="50" cy="50" r="8" fill="none" stroke="white" stroke-width="2"/>
          <circle cx="50" cy="50" r="8" fill="#2196F3">
            <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite"/>
          </circle>
        </svg>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    className: "custom-div-icon-no-background",
  });

  return customIcon;
};

const styles = `
.custom-div-icon-no-background {
  background: none !important;
  border: none !important;
}
`;

const icons = {
  liveLocation: createAnimatedIcon(),
  selectedLocation: L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
};

// Enhanced LiveLocation component with automatic map centering
const LiveLocation = ({ setLiveLocation }) => {
  const map = useMap();

  useEffect(() => {
    let watchId;

    const handlePositionUpdate = (position) => {
      const { latitude, longitude } = position.coords;
      const newLocation = [latitude, longitude];
      setLiveLocation(newLocation);
      // Automatically center map on new location
      map.setView(newLocation, map.getZoom());
    };

    const startWatching = () => {
      // Get initial position and center map
      navigator.geolocation.getCurrentPosition(
        handlePositionUpdate,
        (error) => console.warn("Geolocation error:", error),
        { enableHighAccuracy: true }
      );

      // Watch for position changes
      watchId = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        (error) => console.warn("Geolocation watch error:", error),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    };

    startWatching();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [setLiveLocation, map]);

  return null;
};

// LocationMarker Component for selecting donation location
const LocationMarker = ({ setLatitude, setLongitude }) => {
  const map = useMapEvents({
    click(e) {
      setLatitude(e.latlng.lat);
      setLongitude(e.latlng.lng);
    },
  });
  return null;
};

function UserPost() {
  const [posts, setPosts] = useState([]);
  const [foodName, setFoodName] = useState("");
  const [foodType, setFoodType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [donorContact, setDonorContact] = useState("");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState(null);
  const [editId, setEditId] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([13.07801, 80.268846]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedDonations, setCompletedDonations] = useState([]);

  const deletePost = async (postId, imageUrl) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.uid) {
        setError("Please log in to delete your donation");
        return;
      }

      if (!window.confirm("Are you sure you want to delete this donation?")) {
        return;
      }

      setLoading(true);

      // Delete the post document
      const postRef = doc(db, "food items", postId);
      await deleteDoc(postRef);

      // Delete image if exists
      if (imageUrl) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (imageError) {
          console.warn("Error deleting image:", imageError);
          // Continue with post deletion even if image deletion fails
        }
      }

      // Update user's posts array
      const userRef = doc(db, "userpass", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const updatedPosts = (userData.posts || []).filter(
          (id) => id !== postId
        );
        await updateDoc(userRef, {
          posts: updatedPosts,
        });
      }

      // Update local state
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
      alert("Food donation deleted successfully!");
    } catch (error) {
      console.error("Error deleting post:", error);
      setError(`Failed to delete donation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get user's initial location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLiveLocation([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        setLatitude(latitude);
        setLongitude(longitude);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setError(
          "Could not get your location. Please enable location services."
        );
      }
    );

    // Fetch posts
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.uid) {
      setError("Please log in to view your donations");
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(db, "userpass", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (!userData.posts || !userData.posts.length) {
          setPosts([]);
          setCompletedDonations([]); // Also clear completed donations
          setLoading(false);
          return;
        }

        const postRefs = userData.posts.map((postId) =>
          doc(db, "food items", postId)
        );
        const postSnapshots = await Promise.all(postRefs.map(getDoc));

        // Separate active and completed donations
        const activePosts = [];
        const completedPosts = [];

        postSnapshots.forEach((snap) => {
          if (snap.exists()) {
            const post = {
              ...snap.data(),
              id: snap.id,
            };

            // Sort into active or completed based on status
            if (post.status === "completed") {
              completedPosts.push(post);
            } else {
              activePosts.push(post);
            }
          }
        });

        // Sort by most recent first
        activePosts.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        completedPosts.sort(
          (a, b) =>
            new Date(b.receivedAt || b.createdAt) -
            new Date(a.receivedAt || a.createdAt)
        );

        setPosts(activePosts);
        setCompletedDonations(completedPosts);
      }
    } catch (e) {
      console.error("Error fetching posts:", e);
      setError("Failed to fetch your donations. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleImageUpload = async (file) => {
    if (!file) return null;
    try {
      const imageRef = ref(storage, `images/${Date.now()}-${file.name}`);
      await uploadBytes(imageRef, file);
      return await getDownloadURL(imageRef);
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload image");
    }
  };

  const validateForm = () => {
    const requiredFields = [
      { value: foodName, name: "Food Name" },
      { value: foodType, name: "Food Type" },
      { value: quantity, name: "Quantity" },
      { value: pickupLocation, name: "Pickup Location" },
      { value: expiryDate, name: "Expiry Date" },
      { value: latitude, name: "Location pin on map" },
    ];

    const missingFields = requiredFields
      .filter((field) => !field.value)
      .map((field) => field.name);

    if (missingFields.length > 0) {
      throw new Error(
        `Please fill all required fields:\n- ${missingFields.join("\n- ")}`
      );
    }
    return true;
  };

  const addPost = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.uid) {
      setError("Please log in to donate food");
      return;
    }

    try {
      validateForm();
      setLoading(true);

      const imageUrl = image ? await handleImageUpload(image) : null;

      const postData = {
        foodName,
        foodType,
        quantity,
        pickupLocation,
        expiryDate,
        imageUrl,
        userId: user.uid,
        latitude,
        longitude,
        donorContact,
        notes,
        createdAt: new Date().toISOString(),
        status: "available", // Add status for future features
      };

      const postRef = await addDoc(collection(db, "food items"), postData);

      // Update user's posts array
      const userRef = doc(db, "userpass", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        await updateDoc(userRef, {
          posts: [...(userData.posts || []), postRef.id],
        });
      }

      setPosts((prev) => [...prev, { ...postData, id: postRef.id }]);
      resetForm();
      alert("Food donation posted successfully!");
    } catch (e) {
      console.error("Error adding post:", e);
      setError(e.message || "Failed to post donation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updatePost = async () => {
    try {
      validateForm();
      setLoading(true);

      const imageUrl = image ? await handleImageUpload(image) : null;
      const postRef = doc(db, "food items", editId);

      const updateData = {
        foodName,
        foodType,
        quantity,
        pickupLocation,
        expiryDate,
        donorContact,
        notes,
        latitude,
        longitude,
        updatedAt: new Date().toISOString(),
      };

      if (imageUrl) {
        updateData.imageUrl = imageUrl;
      }

      await updateDoc(postRef, updateData);

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === editId ? { ...post, ...updateData } : post
        )
      );

      resetForm();
      alert("Food donation updated successfully!");
    } catch (e) {
      console.error("Error updating post:", e);
      setError(e.message || "Failed to update donation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFoodName("");
    setFoodType("");
    setQuantity("");
    setPickupLocation("");
    setExpiryDate("");
    setDonorContact("");
    setNotes("");
    setImage(null);
    // Don't reset location - keep the last selected location
  };

  const startEditing = (post) => {
    setEditId(post.id);
    setFoodName(post.foodName);
    setFoodType(post.foodType);
    setQuantity(post.quantity);
    setPickupLocation(post.pickupLocation);
    setExpiryDate(post.expiryDate);
    setDonorContact(post.donorContact || "");
    setNotes(post.notes || "");
    setLatitude(post.latitude);
    setLongitude(post.longitude);
    if (post.latitude && post.longitude) {
      setMapCenter([post.latitude, post.longitude]);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-3xl mx-auto bg-white p-6 shadow-md rounded-lg">
          <div className="text-red-500 text-center">
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 shadow-md rounded-lg">
        <h1 className="text-2xl font-bold text-center mb-4">
          {editId ? "Edit Food Donation" : "Donate Food"}
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter food name"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />

          <select
            value={foodType}
            onChange={(e) => setFoodType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select Food Type</option>
            <option value="Veg">Veg</option>
            <option value="Non-Veg">Non-Veg</option>
          </select>

          <input
            type="text"
            placeholder="Quantity (e.g., 5 plates)"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />

          <input
            type="text"
            placeholder="Enter pickup location description"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />

          <input
            type="datetime-local"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Food Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <input
            type="text"
            placeholder="Donor Contact (Optional)"
            value={donorContact}
            onChange={(e) => setDonorContact(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />

          <textarea
            placeholder="Additional notes (e.g., contains nuts, gluten-free)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md h-24"
          />

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Select Donation Location</h3>
            <p className="text-sm text-gray-600">
              Blue marker shows your current location (auto-centered). Click on
              the map to set donation pickup location (red marker).
            </p>
            {mapCenter ? (
              <div className="h-64 w-full rounded-md overflow-hidden border border-gray-300">
                <MapContainer
                  center={mapCenter}
                  zoom={10}
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <LiveLocation setLiveLocation={setLiveLocation} />
                  <LocationMarker
                    setLatitude={setLatitude}
                    setLongitude={setLongitude}
                  />
                  {liveLocation && (
                    <Marker position={liveLocation} icon={icons.liveLocation}>
                      <Popup>Your current location</Popup>
                    </Marker>
                  )}
                  {latitude && longitude && (
                    <Marker
                      position={[latitude, longitude]}
                      icon={icons.selectedLocation}
                    >
                      <Popup>Donation pickup location</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            ) : (
              <p className="text-gray-500">Loading map...</p>
            )}
          </div>

          <button
            onClick={editId ? updatePost : addPost}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white transition duration-200 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {loading
              ? "Processing..."
              : editId
              ? "Save Changes"
              : "Donate Food"}
          </button>

          {editId && (
            <button
              onClick={resetForm}
              disabled={loading}
              className="w-full py-2 px-4 rounded-md text-white bg-gray-500 hover:bg-gray-600 transition duration-200"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-center mb-4">
            Your Food Donations
          </h2>

          {loading ? (
            <div className="text-center text-gray-500">
              Loading donations...
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 border rounded-md shadow-md bg-gray-50 space-y-2 transition-transform hover:scale-[1.02]"
                  >
                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt={post.foodName}
                        className="w-full h-40 object-cover rounded-md"
                        onError={(e) => {
                          e.target.src = "/placeholder-food-image.png"; // Add a placeholder image
                          e.target.onerror = null;
                        }}
                      />
                    )}
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold">{post.foodName}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-medium ${
                          post.foodType === "Veg"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {post.foodType}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        <span className="font-medium">Quantity:</span>{" "}
                        {post.quantity}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Location:</span>{" "}
                        {post.pickupLocation}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Expires:</span>{" "}
                        {new Date(post.expiryDate).toLocaleString()}
                      </p>
                      {post.donorContact && (
                        <p className="text-gray-600">
                          <span className="font-medium">Contact:</span>{" "}
                          {post.donorContact}
                        </p>
                      )}
                      {post.notes && (
                        <p className="text-gray-500 italic border-l-2 border-gray-300 pl-2">
                          {post.notes}
                        </p>
                      )}
                    </div>

                    {post.acceptedBy && (
                      <div className="mt-2">
                        <p className="text-blue-600 font-medium">
                          This donation has been accepted
                        </p>
                        <ChatButton
                          donationId={post.id}
                          receiverId={post.acceptedBy}
                        />
                      </div>
                    )}

                    <div className="pt-2 flex space-x-2">
                      <button
                        onClick={() => startEditing(post)}
                        disabled={loading}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md transition duration-200 disabled:bg-gray-400"
                      >
                        {loading && post.id === editId ? "Saving..." : "Edit"}
                      </button>
                      <button
                        onClick={() => deletePost(post.id, post.imageUrl)}
                        disabled={loading}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md transition duration-200 disabled:bg-gray-400"
                      >
                        {loading ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                posts.length === 0 && completedDonations.length === 0 ? (
                  <p className="text-center text-gray-500 col-span-2">
                    No food donations yet. Start sharing food with your community!
                  </p>
                ) : posts.length === 0 ? (
                  <p className="text-center text-gray-500 col-span-2">
                    No active donations at the moment. Your completed donations are shown below.
                  </p>
                ) : null
                
              )}
            </div>
          )}
        </div>

        {completedDonations.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-center mb-4">
              Completed Donations
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {completedDonations.map((post) => (
                <div
                  key={post.id}
                  className="p-4 border rounded-md shadow-md bg-gray-50 space-y-2 transition-transform hover:scale-[1.02]"
                >
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt={post.foodName}
                      className="w-full h-40 object-cover rounded-md"
                      onError={(e) => {
                        e.target.src = "/placeholder-food-image.png";
                        e.target.onerror = null;
                      }}
                    />
                  )}
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold">{post.foodName}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-medium ${
                        post.foodType === "Veg"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {post.foodType}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">Quantity:</span>{" "}
                      {post.quantity}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Location:</span>{" "}
                      {post.pickupLocation}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Received on:</span>{" "}
                      {new Date(post.receivedAt).toLocaleString()}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Receiver:</span>{" "}
                      {post.receiverContact || "Anonymous"}
                    </p>
                    {post.notes && (
                      <p className="text-gray-500 italic border-l-2 border-gray-300 pl-2">
                        {post.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex justify-center">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Successfully Donated
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserPost;
