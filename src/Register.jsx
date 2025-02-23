import React, { useState } from "react";
import { db, collection, addDoc } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Create a new user with an empty posts array
      const userRef = await addDoc(collection(db, "userpass"), {
        username: username,
        password: password,
        posts: [], // Empty array for storing post IDs
      });

      alert("Registration successful!");
      navigate("/login"); // Redirect to login page
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleRegister} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4">Register</h2>
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
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
