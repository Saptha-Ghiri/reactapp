import React, { useState } from "react";
import { db, collection, addDoc } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { Heart, User, Lock, UserPlus } from "lucide-react";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "userpass"), {
        username: username,
        password: password,
        posts: [],
      });
      alert("Registration successful!");
      navigate("/login");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
      {/* Decorative circles */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>

      <div className="relative bg-white/20 p-1 rounded-2xl backdrop-blur-xl shadow-xl">
        <form
          onSubmit={handleRegister}
          className="bg-white rounded-xl p-8 w-96 shadow-inner"
        >
          <div className="text-center mb-8">
            <Heart className="w-12 h-12 text-pink-500 mx-auto mb-3 animate-pulse" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Join Us
            </h2>
            <p className="text-gray-500 mt-2">
              Create an account to get started
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                required
              />
            </div>

            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg flex items-center justify-center space-x-2 transform hover:scale-[1.02] transition-all"
            >
              <UserPlus size={20} />
              <span>Register</span>
            </button>
          </div>

          <div className="mt-6 text-center space-y-2">
            <a
              href="/login"
              className="text-purple-600 hover:text-purple-700 text-sm"
            >
              Already have an account? Login here
            </a>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <a href="/help" className="hover:text-purple-600">
                Need Help?
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
