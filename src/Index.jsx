import React from "react";
import { Heart, Users, LogIn, UserPlus, Gift, HandHeart } from "lucide-react";
import Navbar from "./Navbar";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Feeding Future</h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect food donors with those in need
          </p>
          <Heart className="mx-auto text-red-500 w-16 h-16 mb-4" />
          <p className="text-lg text-purple-600 mb-8">
            Join as a donor, receiver, or both!
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Combined Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden text-center hover:shadow-lg transition-shadow">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-semibold text-purple-800 mb-2">
                Join Our Community
              </h2>
              <p className="text-gray-600">
                Choose your role when you sign up or log in
              </p>
            </div>

            <div className="p-6">
              {/* Role Options */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <HandHeart className="mx-auto text-blue-600 w-8 h-8 mb-2" />
                  <h3 className="text-blue-800 font-medium">Food Donor</h3>
                  <p className="text-sm text-gray-600">Share surplus food</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <Gift className="mx-auto text-green-600 w-8 h-8 mb-2" />
                  <h3 className="text-green-800 font-medium">Food Receiver</h3>
                  <p className="text-sm text-gray-600">Accept donations</p>
                </div>
              </div>

              {/* Login/Register Buttons */}
              <div className="space-y-4">
                <button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-md flex items-center justify-center transition-colors"
                  onClick={() => (window.location.href = "/login")}
                >
                  <LogIn className="mr-2 h-5 w-5" /> Login to Your Account
                </button>
                <button
                  className="w-full border-2 border-purple-600 text-purple-600 hover:bg-purple-50 py-3 px-4 rounded-md flex items-center justify-center transition-colors"
                  onClick={() => (window.location.href = "/register")}
                >
                  <UserPlus className="mr-2 h-5 w-5" /> Create New Account
                </button>
              </div>

              {/* Additional Info */}
              <p className="mt-6 text-sm text-gray-600">
                During registration, you'll be able to select your preferred
                roles and can update them anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
