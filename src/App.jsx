import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AllPosts } from "./AllPosts";
import NotFound from "./NotFound";
import UserPost from "./UserPost";
import Login from "./Login";
import Register from "./Register";
import Navbar from "./Navbar";
import FoodMap from "./FoodMap";
import FoodReceiver from "./FoodReceiver";
import DonorNotifications from "./DonorNotifications";
import Game from "./Game";
import Res from "./Res";
import Index from "./Index";
import RecipeFinder from "./RecipeFinder";
import QRCodeGenerator from "./QRCodeGenerator";
import QRScanner from "./QRScanner";
import UserFoods from "./UserFoods";
import ProfileCard from "./ProfileCard";
import Loc from "./Loc";
import FoodStation from "./FoodStation";
import Test from "./Test";
import FoodStationDetail from "./FoodStationDetail";
import FoodStationInteraction from "./FoodStationInteraction";
import UserReceivedFoods from "./UserReceivedFoods";
import ChatPage from "./ChatPage";
import ReceiverNotifications from "./ReceiverNotifications";
import DonorHistory from "./DonorHistory";
import ReceiverHistory from "./ReceiverHistory";
// Import Admin Components
import AdminDashboard from "./AdminDashboard";
import UserAnalytics from "./UserAnalytics";
import AdminDonations from "./AdminDonations";
import AdminRoutes from "./AdminRoutes";
import FoodFlowAnalysis from "./Analysis";
import FormWithKeyboard from "./FormWithKeyboard";

// Protected Route Component
const ProtectedRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem("user"); // Check if user is logged in
  return isAuthenticated ? element : <Navigate to="/login" />;
};

// Layout component that conditionally renders the Navbar
const AppLayout = () => {
  const location = useLocation();
  const hideNavbarPaths = ["/food-station-user", "/admin", "/admin/*"];

  // Check if current path should hide navbar
  const shouldHideNavbar = hideNavbarPaths.some(
    (path) =>
      location.pathname === path ||
      (path.endsWith("/*") && location.pathname.startsWith(path.slice(0, -2)))
  );

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
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
          path="/donor-notifications"
          element={<ProtectedRoute element={<DonorNotifications />} />}
        />
        <Route
          path="/receiver-notifications"
          element={<ProtectedRoute element={<ReceiverNotifications />} />}
        />
        <Route path="/posts" element={<UserPost />} />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={<ProtectedRoute element={<AdminRoutes />} />}
        />

        <Route path="/login" element={<Login />} />
        <Route path="/key" element={<FormWithKeyboard />} />

        
        <Route path="/food-station-analysis" element={<FoodFlowAnalysis />} />
        <Route path="/food-flow-analysis" element={<AdminDashboard />} />
        <Route path="/map" element={<FoodMap />} />
        <Route path="/register" element={<Register />} />
        <Route path="/game" element={<Game />} />
        <Route path="/res" element={<Res />} />
        <Route path="/index" element={<Index />} />
        <Route path="/" element={<Index />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/donor-history" element={<DonorHistory />} />
        <Route path="/receiver-history" element={<ReceiverHistory />} />
        <Route path="/recipe" element={<RecipeFinder />} />
        <Route path="/recipe/:id" element={<RecipeFinder />} />
        <Route path="/qrscan" element={<QRScanner />} />
        <Route path="/qrgen" element={<QRCodeGenerator />} />
        <Route path="/userfoods" element={<UserFoods />} />
        <Route path="/userreceived" element={<UserReceivedFoods />} />
        <Route path="/profile" element={<ProfileCard />} />
        <Route path="/food-station" element={<FoodStation />} />
        <Route
          path="/food-station/:stationId"
          element={<FoodStationDetail />}
        />
        <Route path="/food-station-user" element={<FoodStationInteraction />} />
        <Route path="/loc" element={<Loc />} />
        <Route path="/test" element={<Test />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
};

export default App;
