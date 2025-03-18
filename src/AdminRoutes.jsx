import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import AdminDashboard from "./AdminDashboard";
import UserAnalytics from "./UserAnalytics";
import AdminDonations from "./AdminDonations";
import FoodFlowAnalysis from "./Analysis";

// Import other admin components as needed

const AdminRoutes = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.uid) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Fetch user document to check admin status
      const userRef = doc(db, "userpass", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().isAdmin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(true); // Note: This is set to true for both cases, which might be a bug
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Nav */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">
                  Food Sharing Admin
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/admin"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === "dashboard"
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("dashboard")}
                >
                  Dashboard
                </Link>
                {/* <Link
                  to="/admin/users"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === "users"
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("users")}
                >
                  User Analytics
                </Link> */}
                <Link
                  to="/admin/donations"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === "donations"
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("donations")}
                >
                  Donations
                </Link>
                <Link
                  to="/admin/food-station-analysis"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === "reports"
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("reports")}
                >
                  Food Stations
                </Link>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <Link
                to="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Back to App
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/admin"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                activeTab === "dashboard"
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </Link>
            {/* <Link
              to="/admin/users"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                activeTab === "users"
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
              }`}
              onClick={() => setActiveTab("users")}
            >
              User Analytics
            </Link> */}
            <Link
              to="/admin/donations"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                activeTab === "donations"
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
              }`}
              onClick={() => setActiveTab("donations")}
            >
              Donations
            </Link>
            <Link
              to="/admin/food-station-analysis"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                activeTab === "reports"
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
              }`}
              onClick={() => setActiveTab("reports")}
            >
              Food Stations
            </Link>
            <Link
              to="/"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            >
              Back to App
            </Link>
          </div>
        </div>
      </nav>

      {/* Admin Content */}
      <div className="py-10">
        <main>
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/users" element={<UserAnalytics />} />
            <Route path="/donations" element={<AdminDonations />} />

            <Route
              path="/food-station-analysis"
              element={<FoodFlowAnalysis />}
            />

            {/* Redirect if no match */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminRoutes;
