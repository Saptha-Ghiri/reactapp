import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AllPosts } from "./AllPosts";
import NotFound from "./NotFound";
import UserPost from "./UserPost";
import Login from "./Login";
import Register from "./Register";
import Navbar from "./Navbar";
import FoodMap from "./FoodMap";
import FoodReceiver from "./FoodReceiver"; // Add this import
import DonorNotifications from "./DonorNotifications"; // Add this import
import Game from "./Game";
import Res from "./Res";
import Index from "./Index";
import RecipeFinder from "./RecipeFinder";

// Protected Route Component
const ProtectedRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem("user"); // Check if user is logged in
  return isAuthenticated ? element : <Navigate to="/login" />;
};

const App = () => {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route
          path="/allposts"
          element={<ProtectedRoute element={<AllPosts />} />}
        />
        <Route
          path="/receive"
          element={<ProtectedRoute element={<FoodReceiver />} />}
        />
        <Route
          path="/notifications"
          element={<ProtectedRoute element={<DonorNotifications />} />}
        />

        <Route path="/posts" element={<UserPost />} />
        <Route path="/login" element={<Login />} />
        <Route path="/map" element={<FoodMap />} />
        <Route path="/register" element={<Register />} />
        <Route path="/game" element={<Game />} />
        <Route path="/res" element={<Res />} />
        <Route path="/index" element={<Index />} />
        <Route path="/" element={<Index />} />

        <Route path="/recipe" element={<RecipeFinder />} />
        <Route path="/recipe/:id" element={<RecipeFinder />} />


        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
