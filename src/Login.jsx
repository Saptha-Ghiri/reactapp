import React, { useState } from "react";
import { db, collection, query, where, getDocs, doc, getDoc } from "../firebase/config";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const q = query(collection(db, "userpass"), where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        let isValidUser = false;
        let userData;
        
        for (let docSnap of querySnapshot.docs) {
          userData = docSnap.data();
          if (userData.password === password) {
            isValidUser = true;
            localStorage.setItem("user", JSON.stringify({ uid: docSnap.id, username: userData.username, posts: userData.posts }));
            break;
          }
        }

        if (isValidUser) {
          alert("Login successful!");
          navigate("/allposts"); // Redirect after login
        } else {
          alert("Incorrect password!");
        }
      } else {
        alert("User not found!");
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          required
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
