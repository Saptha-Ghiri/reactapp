import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalDonations: 0,
    completedDonations: 0,
    activeDonations: 0,
    rejectedDonations: 0,
    totalUsers: 0,
    uniqueDonors: 0,
    uniqueReceivers: 0,
    vegItems: 0,
    nonVegItems: 0
  });
  const [timeStats, setTimeStats] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);
  const [foodTypeData, setFoodTypeData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [mapCenter, setMapCenter] = useState([13.07801, 80.268846]); // Default center

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all food items
      const foodItemsSnapshot = await getDocs(collection(db, "food items"));
      const foodItems = foodItemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Process data for stats and visualizations
      processData(foodItems);
      
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError("Failed to load admin dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const processData = (foodItems) => {
    // Basic stats
    const completed = foodItems.filter(item => item.status === "completed");
    const active = foodItems.filter(item => item.status === "available" || item.status === "accepted");
    const rejected = foodItems.filter(item => item.status === "rejected");
    const vegItems = foodItems.filter(item => item.foodType === "Veg");
    const nonVegItems = foodItems.filter(item => item.foodType === "Non-Veg");
    
    // Unique donors and receivers
    const uniqueDonors = new Set(foodItems.map(item => item.userId)).size;
    const uniqueReceivers = new Set(
      foodItems
        .filter(item => item.receivedBy)
        .map(item => item.receivedBy)
    ).size;
    
    // Update stats
    setStats({
      totalDonations: foodItems.length,
      completedDonations: completed.length,
      activeDonations: active.length,
      rejectedDonations: rejected.length,
      totalUsers: uniqueDonors + uniqueReceivers,
      uniqueDonors,
      uniqueReceivers,
      vegItems: vegItems.length,
      nonVegItems: nonVegItems.length
    });
    
    // Food type distribution
    setFoodTypeData([
      { name: "Vegetarian", value: vegItems.length },
      { name: "Non-Vegetarian", value: nonVegItems.length }
    ]);
    
    // Status distribution
    setStatusData([
      { name: "Available", value: foodItems.filter(item => item.status === "available").length },
      { name: "Accepted", value: foodItems.filter(item => item.status === "accepted").length },
      { name: "Completed", value: completed.length },
      { name: "Rejected", value: rejected.length }
    ]);
    
    // Recent donations (last 10)
    const sortedByDate = [...foodItems].sort((a, b) => 
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
    setRecentDonations(sortedByDate.slice(0, 10));
    
    // Prepare location data for map
    const locations = foodItems.map(item => ({
      id: item.id,
      lat: item.latitude,
      lng: item.longitude,
      name: item.foodName,
      status: item.status,
      foodType: item.foodType
    })).filter(item => item.lat && item.lng);
    
    setLocationData(locations);
    
    // Find center of map (average of all points)
    if (locations.length > 0) {
      const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
      const avgLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;
      setMapCenter([avgLat, avgLng]);
    }
    
    // Prepare time-based stats (past 14 days)
    prepareTimeStats(foodItems);
  };

  const prepareTimeStats = (foodItems) => {
    // Get dates for past 14 days
    const dates = [];
    const dailyStats = [];
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }
    
    // For each day, count donations and collections
    dates.forEach((date, index) => {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Count donations created on this day
      const donationsCount = foodItems.filter(item => {
        const createdDate = new Date(item.createdAt);
        return createdDate >= date && createdDate < nextDate;
      }).length;
      
      // Count collections completed on this day
      const collectionsCount = foodItems.filter(item => {
        const receivedDate = new Date(item.receivedAt);
        return receivedDate >= date && receivedDate < nextDate;
      }).length;
      
      const formattedDate = date.toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
      
      dailyStats.push({
        date: formattedDate,
        donations: donationsCount,
        collections: collectionsCount
      });
    });
    
    setDailyStats(dailyStats);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#2196F3';  // Blue
      case 'accepted': return '#FFC107';   // Yellow/amber
      case 'completed': return '#4CAF50';  // Green
      case 'rejected': return '#F44336';   // Red
      default: return '#9E9E9E';           // Grey
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Admin Dashboard</h1>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Total Donations</h2>
            <div className="flex justify-around">
              <div>
                <p className="text-3xl font-bold text-blue-600">{stats.totalDonations}</p>
                <p className="text-sm text-gray-500">All donations</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{stats.completedDonations}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Food Types</h2>
            <div className="flex justify-around">
              <div>
                <p className="text-3xl font-bold text-green-600">{stats.vegItems}</p>
                <p className="text-sm text-gray-500">Vegetarian</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{stats.nonVegItems}</p>
                <p className="text-sm text-gray-500">Non-Vegetarian</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-bold mb-2">User Activity</h2>
            <div className="flex justify-around">
              <div>
                <p className="text-3xl font-bold text-purple-600">{stats.uniqueDonors}</p>
                <p className="text-sm text-gray-500">Donors</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">{stats.uniqueReceivers}</p>
                <p className="text-sm text-gray-500">Receivers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Activity Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Daily Activity (Last 14 Days)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyStats}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="donations" 
                  name="Food Donations" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3} 
                />
                <Area 
                  type="monotone" 
                  dataKey="collections" 
                  name="Food Collections" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.3} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dual Chart Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Food Type Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Food Type Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={foodTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {foodTypeData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? '#4CAF50' : '#F44336'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donation Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Donation Status</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Count" fill="#8884d8">
                    {statusData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.name === "Available" ? "#2196F3" : 
                          entry.name === "Accepted" ? "#FFC107" : 
                          entry.name === "Completed" ? "#4CAF50" : 
                          "#F44336"
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Donation Locations Map */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Donation Locations</h2>
          <div className="h-96">
            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {locationData.map((location) => (
                <CircleMarker
                  key={location.id}
                  center={[location.lat, location.lng]}
                  radius={8}
                  pathOptions={{
                    color: getStatusColor(location.status),
                    fillColor: getStatusColor(location.status),
                    fillOpacity: 0.7
                  }}
                >
                  <Popup>
                    <div>
                      <h3 className="font-bold">{location.name}</h3>
                      <p>Status: {location.status}</p>
                      <p>Type: {location.foodType}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          <div className="mt-4 flex justify-center">
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                <span>Accepted</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                <span>Rejected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Donations Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Donations</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Food Name
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Food Type
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentDonations.map((donation) => (
                  <tr key={donation.id}>
                    <td className="py-2 px-4 border-b border-gray-200">
                      {donation.foodName}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          donation.foodType === "Veg"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {donation.foodType}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          donation.status === "available"
                            ? "bg-blue-100 text-blue-800"
                            : donation.status === "accepted"
                            ? "bg-yellow-100 text-yellow-800"
                            : donation.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {donation.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      {donation.pickupLocation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;