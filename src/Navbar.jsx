import React, { useState, useEffect } from "react";
import {
  Soup,
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
  Menu,
  X,
  ChefHat,
  UserRound,
  Rows3,
} from "lucide-react";

const Navbar = () => {
  const [isDonorOpen, setIsDonorOpen] = useState(false);
  const [isReceiverOpen, setIsReceiverOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Close mobile menu when navigating
  const handleNavigation = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    window.location.href = "/login";
  };

  // Close other dropdowns when opening a new one
  const toggleDonorMenu = () => {
    setIsDonorOpen(!isDonorOpen);
    setIsReceiverOpen(false);
    setIsGameOpen(false);
  };

  const toggleReceiverMenu = () => {
    setIsReceiverOpen(!isReceiverOpen);
    setIsDonorOpen(false);
    setIsGameOpen(false);
  };

  const toggleGameMenu = () => {
    setIsGameOpen(!isGameOpen);
    setIsDonorOpen(false);
    setIsReceiverOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 shadow-lg">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="text-xl font-bold text-white flex items-center">
            <Soup className="mr-2" />
            FeedingFuture
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
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

                  {/* Food Station Button */}
                  <a
                  href="/food-station"
                  className="flex items-center text-white hover:text-pink-200 transition-colors"
                >
                  <Rows3 className="mr-1" />
                  <span>Food Station</span>
                </a>

                {/* Donor Dropdown */}
                <div className="relative">
                  <button
                    onClick={toggleDonorMenu}
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
                        User Donations
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
                    onClick={toggleReceiverMenu}
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

                {/* Recipe Button */}
                <a
                  href="/recipe"
                  className="flex items-center text-white hover:text-pink-200 transition-colors"
                >
                  <ChefHat className="mr-1" />
                  <span>Cookery</span>
                </a>
                
                

                {/* Game Dropdown */}
                <div className="relative">
                  <button
                    onClick={toggleGameMenu}
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

                {/* Profile Button */}
                <a
                  href="/profile"
                  className="flex items-center text-white hover:text-pink-200 transition-colors"
                >
                  <UserRound className="mr-1" />
                  <span>Profile</span>
                </a>

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

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 bg-white rounded-lg shadow-lg p-4">
            {isLoggedIn ? (
              <div className="space-y-4">
                {/* All Button */}
                <a
                  href="/allposts"
                  className="flex items-center text-gray-700 hover:text-pink-500 transition-colors py-2"
                  onClick={handleNavigation}
                >
                  <Globe className="mr-2" />
                  <span>All</span>
                </a>

                {/* Map Button */}
                <a
                  href="/map"
                  className="flex items-center text-gray-700 hover:text-pink-500 transition-colors py-2"
                  onClick={handleNavigation}
                >
                  <MapPin className="mr-2" />
                  <span>Map</span>
                </a>

                {/* Food Station Button */}
                <a
                  href="/food-station"
                  className="flex items-center text-gray-700 hover:text-pink-500 transition-colors py-2"
                  onClick={handleNavigation}
                >
                  <Rows3 className="mr-2" />
                  <span>Food Station</span>
                </a>

                {/* Donor Section */}
                <div>
                  <button
                    onClick={toggleDonorMenu}
                    className="flex items-center w-full text-gray-700 hover:text-pink-500 transition-colors py-2 justify-between"
                  >
                    <div className="flex items-center">
                      <HandHeart className="mr-2" />
                      <span>Donor</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transform ${
                        isDonorOpen ? "rotate-180" : ""
                      } transition-transform`}
                    />
                  </button>

                  {isDonorOpen && (
                    <div className="pl-6 mt-2 space-y-2 border-l-2 border-pink-200">
                      <a
                        href="/posts"
                        className="flex items-center text-gray-700 hover:text-pink-500 transition-colors py-2"
                        onClick={handleNavigation}
                      >
                        <User2 className="mr-2 h-4 w-4" />
                        User Donations
                      </a>
                      <a
                        href="/notifications"
                        className="flex items-center text-gray-700 hover:text-pink-500 transition-colors py-2"
                        onClick={handleNavigation}
                      >
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                      </a>
                    </div>
                  )}
                </div>

                {/* Receiver Section */}
                <div>
                  <button
                    onClick={toggleReceiverMenu}
                    className="flex items-center w-full text-gray-700 hover:text-pink-500 transition-colors py-2 justify-between"
                  >
                    <div className="flex items-center">
                      <Gift className="mr-2" />
                      <span>Receiver</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transform ${
                        isReceiverOpen ? "rotate-180" : ""
                      } transition-transform`}
                    />
                  </button>

                  {isReceiverOpen && (
                    <div className="pl-6 mt-2 border-l-2 border-pink-200">
                      <a
                        href="/receive"
                        className="flex items-center text-gray-700 hover:text-pink-500 transition-colors py-2"
                        onClick={handleNavigation}
                      >
                        <Gift className="mr-2 h-4 w-4" />
                        Receiver Donations
                      </a>
                    </div>
                  )}
                </div>

                {/* Map Button */}
                <a
                  href="/recipe"
                  className="flex items-center text-gray-700 hover:text-pink-500 transition-colors py-2"
                  onClick={handleNavigation}
                >
                  <ChefHat className="mr-2" />
                  <span>Cookery</span>
                </a>

                {/* Game Section */}
                <div>
                  <button
                    onClick={toggleGameMenu}
                    className="flex items-center w-full text-gray-700 hover:text-pink-500 transition-colors py-2 justify-between"
                  >
                    <div className="flex items-center">
                      <GamepadIcon className="mr-2" />
                      <span>Game</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transform ${
                        isGameOpen ? "rotate-180" : ""
                      } transition-transform`}
                    />
                  </button>

                  {isGameOpen && (
                    <div className="pl-6 mt-2 space-y-2 border-l-2 border-pink-200">
                      <a
                        href="/game"
                        className="block text-gray-700 hover:text-pink-500 transition-colors py-2"
                        onClick={handleNavigation}
                      >
                        Kitchen Management
                      </a>
                      <a
                        href="/res"
                        className="block text-gray-700 hover:text-pink-500 transition-colors py-2"
                        onClick={handleNavigation}
                      >
                        Restaurant
                      </a>
                      <a
                        href="/rewards"
                        className="block text-gray-700 hover:text-pink-500 transition-colors py-2"
                        onClick={handleNavigation}
                      >
                        Rewards
                      </a>
                    </div>
                  )}
                </div>
                {/* Profile Button */}
                <a
                  href="/profile"
                  className="flex items-center text-gray-700 hover:text-pink-500 transition-colors py-2"
                  onClick={handleNavigation}
                >
                  <UserRound className="mr-2" />
                  <span>Profile</span>
                </a>
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-white bg-pink-600 px-4 py-2 rounded-full hover:bg-pink-700 justify-center"
                >
                  <LogOut className="mr-2" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Login Button */}
                <a
                  href="/login"
                  className="flex items-center w-full text-white bg-pink-600 px-4 py-2 rounded-full hover:bg-pink-700 justify-center"
                  onClick={handleNavigation}
                >
                  <LogIn className="mr-2" />
                  <span>Login</span>
                </a>

                {/* Register Button */}
                <a
                  href="/register"
                  className="flex items-center w-full text-pink-500 border-2 border-pink-500 px-4 py-2 rounded-full hover:bg-pink-500 hover:text-white justify-center transition-colors"
                  onClick={handleNavigation}
                >
                  <UserPlus className="mr-2" />
                  <span>Register</span>
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
