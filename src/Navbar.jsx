import React, { useState, useEffect } from "react";
import {
  Heart,
  HandHeart,
  GamepadIcon,
  Bell,
  MapPin,
  User2,
  LogOut,
  ChevronDown,
  Gift,
  Globe,
  LogIn,
  UserPlus,
} from "lucide-react";

const Navbar = () => {
  const [isDonorOpen, setIsDonorOpen] = useState(false);
  const [isReceiverOpen, setIsReceiverOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Function to check auth status
  const checkAuthStatus = () => {
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!user);
  };

  // Initialize auth status
  useEffect(() => {
    // Check initial auth status
    checkAuthStatus();

    // Create an interval to check auth status frequently
    const interval = setInterval(checkAuthStatus, 1000);

    // Clean up interval
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    window.location.href = "/login";
  };

  return (
    <nav className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 shadow-lg">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="text-xl font-bold text-white flex items-center">
            <Heart className="mr-2" />
            GiveHope
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {isLoggedIn ? (
              <>
                {/* All Button */}
                <a
                  href="/allposts"
                  className="flex items-center text-white hover:text-pink-200 transition-colors"
                >
                  <Globe className="mr-1" />
                  <span>All</span>
                </a>

                {/* Map Button */}
                <a
                  href="/map"
                  className="flex items-center text-white hover:text-pink-200 transition-colors"
                >
                  <MapPin className="mr-1" />
                  <span>Map</span>
                </a>

                {/* Donor Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDonorOpen(!isDonorOpen)}
                    className="flex items-center text-white hover:text-pink-200 transition-colors"
                  >
                    <HandHeart className="mr-1" />
                    <span>Donor</span>
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>

                  {isDonorOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-10">
                      <a
                        href="/posts"
                        className="block px-4 py-2 text-gray-700 hover:bg-pink-50 flex items-center"
                      >
                        <User2 className="mr-2 h-4 w-4" />
                        User Posts
                      </a>
                      <a
                        href="/notifications"
                        className="block px-4 py-2 text-gray-700 hover:bg-pink-50 flex items-center"
                      >
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                      </a>
                    </div>
                  )}
                </div>

                {/* Receiver Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsReceiverOpen(!isReceiverOpen)}
                    className="flex items-center text-white hover:text-pink-200 transition-colors"
                  >
                    <Gift className="mr-1" />
                    <span>Receiver</span>
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>

                  {isReceiverOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-10">
                      <a
                        href="/receive"
                        className="block px-4 py-2 text-gray-700 hover:bg-pink-50 flex items-center"
                      >
                        <Gift className="mr-2 h-4 w-4" />
                        Receiver Donations
                      </a>
                    </div>
                  )}
                </div>

                {/* Game Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsGameOpen(!isGameOpen)}
                    className="flex items-center text-white hover:text-pink-200 transition-colors"
                  >
                    <GamepadIcon className="mr-1" />
                    <span>Game</span>
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>

                  {isGameOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-10">
                      <a
                        href="/game"
                        className="block px-4 py-2 text-gray-700 hover:bg-pink-50"
                      >
                        Kitchen Management
                      </a>
                      <a
                        href="/res"
                        className="block px-4 py-2 text-gray-700 hover:bg-pink-50"
                      >
                        Restaurant
                      </a>
                      <a
                        href="/rewards"
                        className="block px-4 py-2 text-gray-700 hover:bg-pink-50"
                      >
                        Rewards
                      </a>
                    </div>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center text-white hover:text-pink-200 transition-colors bg-pink-600 px-4 py-2 rounded-full hover:bg-pink-700"
                >
                  <LogOut className="mr-1" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                {/* Login Button */}
                <a
                  href="/login"
                  className="flex items-center text-white hover:text-pink-200 transition-colors bg-pink-600 px-4 py-2 rounded-full hover:bg-pink-700"
                >
                  <LogIn className="mr-1" />
                  <span>Login</span>
                </a>

                {/* Register Button */}
                <a
                  href="/register"
                  className="flex items-center text-white hover:text-pink-200 transition-colors border-2 border-white px-4 py-2 rounded-full hover:bg-white hover:text-pink-500"
                >
                  <UserPlus className="mr-1" />
                  <span>Register</span>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
