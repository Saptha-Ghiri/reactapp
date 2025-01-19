import { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import "./App.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
function App() {
  const [posts, setPosts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      const collectionRef = collection(db, "posts");

      try {
        const snapshot = await getDocs(collectionRef);
        let results = [];
        snapshot.docs.forEach((doc) => {
          results.push({ ...doc.data(), id: doc.id });
        });
        setPosts(results);
      } catch (e) {
        console.error(e);
      }
    };

    fetchPosts();
  }, []);

  const addPost = async () => {
    const collectionRef = collection(db, "posts");

    try {
      await addDoc(collectionRef, {
        name: newName,
        age: newAge,
      });
      alert("Post added successfully!");

      setPosts((prevPosts) => [
        ...prevPosts,
        { name: newName, age: newAge, id: Date.now().toString() },
      ]);

      setNewName("");
      setNewAge("");
    } catch (e) {
      console.error("Error adding post: ", e);
    }
  };
  useEffect(() => {
    const fetchLocations = async () => {
      const collectionRef = collection(db, "locations");

      try {
        const snapshot = await getDocs(collectionRef);
        let locations = [];
        snapshot.docs.forEach((doc) => {
          locations.push({ ...doc.data(), id: doc.id });
        });
        setLocations(locations);
      } catch (e) {
        console.error(e);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
    });
  });

  return (
    <div>
      <h1>Posts</h1>

      <div>
        <input
          type="text"
          placeholder="Enter name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Enter age"
          value={newAge}
          onChange={(e) => setNewAge(e.target.value)}
        />
        <button onClick={addPost}>Add Post</button>
      </div>

      <ul>
        {posts.length > 0 ? (
          posts.map((post) => (
            <li key={post.id}>
              <h3>{post.name}</h3>
              <p>{post.age}</p>
            </li>
          ))
        ) : (
          <p>Loading posts...</p>
        )}
      </ul>
      <div style={{ height: "500px", width: "100%" }}>
        <MapContainer center={[13.0827, 80.2707]} zoom={13}>
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            attribution="Map data ©2025 Google"
            maxZoom={20}
          />

          {locations.map((location) => (
            <Marker position={[location.latitude, location.longitude]}>
              <Popup>
                <h1>{location.name}</h1>
              </Popup>
            </Marker>
          ))}

          <Marker position={[latitude, longitude]}>
            <Popup>
              <h1>CurrentPosition</h1>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}

export default App;
