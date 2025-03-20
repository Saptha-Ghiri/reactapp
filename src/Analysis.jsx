import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  getDoc,
  doc,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const FoodFlowAnalysis = () => {
  // State variables
  const [stations, setStations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("week"); // week, month, all
  const [selectedStation, setSelectedStation] = useState(null);
  const [sensorData, setSensorData] = useState({});
  const [sensorHistory, setSensorHistory] = useState({
    temperature: [],
    humidity: [],
    ultrasonic: [],
    gas: [],
  });

  // Analytics data
  const [analytics, setAnalytics] = useState({
    totalDonations: 0,
    totalCollections: 0,
    totalUsers: 0,
    totalStations: 0,
    activeStations: 0,
    averageTimeToCollection: 0,
    availableFoodItems: 0,
    topStations: [],
    topDonors: [],
    topCollectors: [],
    dietaryBreakdown: { veg: 0, nonVeg: 0, unknown: 0 },
    activityByDay: {},
    stationUtilization: [],
  });

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchStations(),
          fetchActivities(),
          fetchUsers(),
          fetchSensorData(),
        ]);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError(`Failed to load admin data: ${err.message}`);
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Process analytics when data changes
  useEffect(() => {
    if (stations.length > 0 && activities.length > 0) {
      processAnalytics();
    }
  }, [stations, activities, users, dateRange, selectedStation]);

  // Fetch all food stations
  const fetchStations = async () => {
    const stationsRef = collection(db, "food stations");
    const stationsSnap = await getDocs(stationsRef);
    const stationsData = stationsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setStations(stationsData);
    if (stationsData.length > 0 && !selectedStation) {
      setSelectedStation(stationsData[0].id);
    }
    return stationsData;
  };

  // Fetch activity logs with date filtering
  const fetchActivities = async () => {
    const activityRef = collection(db, "activity-logs");

    let startDate = null;
    if (dateRange === "week") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateRange === "month") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    let activityQuery;
    if (startDate) {
      activityQuery = query(
        activityRef,
        where("timestamp", ">=", Timestamp.fromDate(startDate)),
        orderBy("timestamp", "desc")
      );
    } else {
      activityQuery = query(activityRef, orderBy("timestamp", "desc"));
    }

    const activitySnap = await getDocs(activityQuery);
    const activitiesData = activitySnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    }));

    setActivities(activitiesData);
    return activitiesData;
  };

  // Fetch user data
  const fetchUsers = async () => {
    // Extract unique users from activities
    const usersMap = new Map();

    for (const activity of activities) {
      if (activity.userId && !usersMap.has(activity.userId)) {
        usersMap.set(activity.userId, {
          id: activity.userId,
          donations: 0,
          collections: 0,
          lastActive: activity.timestamp,
        });
      }

      if (activity.userId) {
        const userData = usersMap.get(activity.userId);
        if (activity.type === "donation") {
          userData.donations += 1;
        } else if (activity.type === "collection") {
          userData.collections += 1;
        }

        if (activity.timestamp > userData.lastActive) {
          userData.lastActive = activity.timestamp;
        }

        usersMap.set(activity.userId, userData);
      }
    }

    const usersData = Array.from(usersMap.values());
    setUsers(usersData);
    return usersData;
  };

  // Fetch sensor data
  const fetchSensorData = async () => {
    try {
      // In a real application, this would fetch from a "sensors" collection
      // For this example, we'll use mock data

      // Current sensor data
      const mockCurrentSensorData = {
        temperature: {
          value: 22.5,
          unit: "°C",
          status: "normal", // normal, warning, alert
        },
        humidity: {
          value: 45.2,
          unit: "%",
          status: "normal",
        },
        ultrasonic: {
          value: 28.3,
          unit: "cm",
          status: "normal",
        },
        gas: {
          value: 420,
          unit: "ppm",
          status: "normal",
        },
      };

      // Historical sensor data (last 24 hours)
      const mockHistoricalData = {
        temperature: generateMockHistoricalData(15, 25),
        humidity: generateMockHistoricalData(35, 60),
        ultrasonic: generateMockHistoricalData(20, 50),
        gas: generateMockHistoricalData(380, 500),
      };

      setSensorData(mockCurrentSensorData);
      setSensorHistory(mockHistoricalData);

      return mockCurrentSensorData;
    } catch (err) {
      console.error("Error fetching sensor data:", err);
      return {};
    }
  };

  // Generate mock historical data for sensors
  const generateMockHistoricalData = (min, max) => {
    const now = new Date();
    const data = [];

    for (let i = 24; i >= 0; i--) {
      const time = new Date(now);
      time.setHours(time.getHours() - i);

      data.push({
        time: time,
        value: Number((Math.random() * (max - min) + min).toFixed(1)),
      });
    }

    return data;
  };

  // Process analytics data
  const processAnalytics = () => {
    // Filter activities based on selected station if any
    const filteredActivities = selectedStation
      ? activities.filter((a) => a.stationId === selectedStation)
      : activities;

    // Count donations and collections
    const donations = filteredActivities.filter((a) => a.type === "donation");
    const collections = filteredActivities.filter(
      (a) => a.type === "collection"
    );

    // Get active stations (stations with at least one activity)
    const activeStationIds = new Set(
      filteredActivities.map((a) => a.stationId)
    );

    // Count available food items
    let availableFoodItems = 0;
    stations.forEach((station) => {
      if (station.racks) {
        station.racks.forEach((rack) => {
          if (rack.isFilled) {
            availableFoodItems++;
          }
        });
      }
    });

    // Calculate average time to collection
    let totalCollectionTime = 0;
    let collectionTimeCount = 0;

    collections.forEach((collection) => {
      // Find matching donation
      const matchingDonation = donations.find(
        (d) =>
          d.stationId === collection.stationId && d.rackId === collection.rackId
      );

      if (matchingDonation) {
        const donationTime = matchingDonation.timestamp.getTime();
        const collectionTime = collection.timestamp.getTime();
        const timeDifference = collectionTime - donationTime;

        totalCollectionTime += timeDifference;
        collectionTimeCount++;
      }
    });

    const averageTimeToCollection =
      collectionTimeCount > 0
        ? totalCollectionTime / collectionTimeCount / (1000 * 60 * 60) // convert to hours
        : 0;

    // Get top stations
    const stationActivity = new Map();
    filteredActivities.forEach((activity) => {
      const stationId = activity.stationId;
      const count = stationActivity.get(stationId) || 0;
      stationActivity.set(stationId, count + 1);
    });

    const topStations = Array.from(stationActivity.entries())
      .map(([id, count]) => {
        const station = stations.find((s) => s.id === id);
        return {
          id,
          name: station?.name || `Station ${id}`,
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get top donors and collectors
    const userDonations = new Map();
    const userCollections = new Map();

    donations.forEach((donation) => {
      const userId = donation.userId;
      const count = userDonations.get(userId) || 0;
      userDonations.set(userId, count + 1);
    });

    collections.forEach((collection) => {
      const userId = collection.userId;
      const count = userCollections.get(userId) || 0;
      userCollections.set(userId, count + 1);
    });

    const topDonors = Array.from(userDonations.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topCollectors = Array.from(userCollections.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Count dietary breakdown
    const dietaryBreakdown = { veg: 0, nonVeg: 0, unknown: 0 };

    donations.forEach((donation) => {
      const diet = donation.foodDetails?.diet;
      if (diet === "veg") {
        dietaryBreakdown.veg++;
      } else if (diet === "nonveg") {
        dietaryBreakdown.nonVeg++;
      } else {
        dietaryBreakdown.unknown++;
      }
    });

    // Group activities by day
    const activityByDay = {};

    filteredActivities.forEach((activity) => {
      const date = activity.timestamp.toISOString().split("T")[0];

      if (!activityByDay[date]) {
        activityByDay[date] = { donations: 0, collections: 0 };
      }

      if (activity.type === "donation") {
        activityByDay[date].donations++;
      } else if (activity.type === "collection") {
        activityByDay[date].collections++;
      }
    });

    // Calculate station utilization
    const stationUtilization = stations.map((station) => {
      const totalRacks = station.racks?.length || 0;
      const filledRacks =
        station.racks?.filter((rack) => rack.isFilled)?.length || 0;

      return {
        id: station.id,
        name: station.name || `Station ${station.id}`,
        utilization: totalRacks > 0 ? (filledRacks / totalRacks) * 100 : 0,
      };
    });

    setAnalytics({
      totalDonations: donations.length,
      totalCollections: collections.length,
      totalUsers: users.length,
      totalStations: stations.length,
      activeStations: activeStationIds.size,
      averageTimeToCollection,
      availableFoodItems,
      topStations,
      topDonors,
      topCollectors,
      dietaryBreakdown,
      activityByDay,
      stationUtilization,
    });
  };

  // Format time duration
  const formatDuration = (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    } else if (hours < 24) {
      return `${Math.round(hours)} hours`;
    } else {
      return `${Math.round(hours / 24)} days`;
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  // Chart data for activity trends
  const getActivityTrendChartData = () => {
    const dates = Object.keys(analytics.activityByDay).sort();
    const labels = dates.map((date) => {
      const d = new Date(date);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });

    const donationData = dates.map(
      (date) => analytics.activityByDay[date].donations
    );
    const collectionData = dates.map(
      (date) => analytics.activityByDay[date].collections
    );

    return {
      labels,
      datasets: [
        {
          label: "Donations",
          data: donationData,
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
        {
          label: "Collections",
          data: collectionData,
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart data for dietary breakdown
  const getDietaryChartData = () => {
    return {
      labels: ["Vegetarian", "Non-Vegetarian", "Unspecified"],
      datasets: [
        {
          data: [
            analytics.dietaryBreakdown.veg,
            analytics.dietaryBreakdown.nonVeg,
            analytics.dietaryBreakdown.unknown,
          ],
          backgroundColor: [
            "rgba(75, 192, 192, 0.6)",
            "rgba(255, 99, 132, 0.6)",
            "rgba(200, 200, 200, 0.6)",
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(200, 200, 200, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart data for station utilization
  const getStationUtilizationChartData = () => {
    return {
      labels: analytics.stationUtilization.map((station) => station.name),
      datasets: [
        {
          label: "Utilization (%)",
          data: analytics.stationUtilization.map(
            (station) => station.utilization
          ),
          backgroundColor: "rgba(153, 102, 255, 0.5)",
          borderColor: "rgba(153, 102, 255, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Activity ",
      },
    },
  };

  // Get sensor history chart data
  const getSensorHistoryChartData = (sensorType) => {
    const data = sensorHistory[sensorType] || [];

    return {
      labels: data.map((item) => {
        const date = new Date(item.time);
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }),
      datasets: [
        {
          label: sensorType.charAt(0).toUpperCase() + sensorType.slice(1),
          data: data.map((item) => item.value),
          fill: false,
          backgroundColor: getSensorColor(sensorType),
          borderColor: getSensorColor(sensorType),
          tension: 0.1,
        },
      ],
    };
  };

  // Get color for sensor chart
  const getSensorColor = (sensorType) => {
    switch (sensorType) {
      case "temperature":
        return "rgba(255, 99, 132, 1)";
      case "humidity":
        return "rgba(54, 162, 235, 1)";
      case "ultrasonic":
        return "rgba(255, 206, 86, 1)";
      case "gas":
        return "rgba(75, 192, 192, 1)";
      default:
        return "rgba(153, 102, 255, 1)";
    }
  };

  // Get status class for sensor value
  const getSensorStatusClass = (status) => {
    switch (status) {
      case "normal":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "alert":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Render the selected station's cabinet
  const renderStationCabinet = () => {
    const station = stations.find((s) => s.id === selectedStation);

    if (!station) {
      return (
        <div className="text-center p-4">
          <p>Please select a station to view its cabinet.</p>
        </div>
      );
    }

    return (
      <div className="mt-4 sm:mt-8 p-3 sm:p-6 border rounded-lg shadow-inner bg-gray-50">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-center">
          Food Station Cabinet - {station.name || `Station ${station.id}`}
        </h2>
        <div className="flex justify-center">
          {/* Visual Rack with shelves */}
          <div className="relative w-full max-w-xs sm:max-w-md md:max-w-lg">
            {/* Cabinet Background */}
            <div
              className="sm:h-[500px] h-80 w-full bg-contain bg-no-repeat bg-center mx-auto"
              style={{
                backgroundImage: "url('/food box.png')",
                maxWidth: "500px",
              }}
            ></div>

            {/* Food Items Overlay */}
            <div className="absolute inset-0 flex flex-col justify-between sm:mx-10 sm:my-5 mx-5 my-3 items-center p-2 sm:p-3">
              {/* Rack 1 (Top) */}
              <div className="h-1/2 w-full px-2 justify-between items-center m-2">
                {station.racks && station.racks[0]?.isFilled ? (
                  <div className="w-full h-full text-center flex bg-black bg-opacity-40 rounded justify-between items-center border border-white">
                    {/* Left side - Image */}
                    <div className=" h-full flex justify-center items-center p-1">
                      <img
                        src={
                          station.racks[0]?.imageUrl || "/placeholder-food.png"
                        }
                        alt={station.racks[0]?.Diet || "Food"}
                        className="max-h-full max-w-full object-contain rounded shadow-md"
                        onError={(e) => {
                          e.target.src = "/placeholder-food.png";
                        }}
                      />
                    </div>

                    {/* Right side - Details */}
                    <div className="w-2/3 p-1 sm:p-2 text-white">
                      <p className="font-bold text-xs sm:text-sm">
                        {station.racks[0]?.name}
                      </p>

                      <p className="text-xs sm:text-sm">
                        Date: {station.racks[0]?.date}
                      </p>
                      <p className="text-xs sm:text-sm">
                        Food Type: {station.racks[0]?.Diet}
                      </p>
                      {station.racks[0]?.items?.length > 0 && (
                        <p className="text-xs mt-1 truncate">
                          {station.racks[0]?.items.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-40 text-white rounded">
                    <div className="text-center">
                      <p className="font-bold text-xs sm:text-sm">
                        {(station.racks && station.racks[0]?.name) ||
                          "Unknown Rack"}
                      </p>
                      <p className="text-red-300 font-semibold text-xs sm:text-sm">
                        Empty
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Rack 2 (Middle) */}
              <div className="h-1/2 w-full px-2">
                {station.racks && station.racks[1]?.isFilled ? (
                  <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-40 rounded">
                    {/* Left side - Image */}
                    <div className="w-1/3 h-full flex justify-center items-center p-1">
                      <img
                        src={
                          station.racks[1]?.imageUrl || "/placeholder-food.png"
                        }
                        alt={station.racks[1]?.Diet || "Food"}
                        className="max-h-full max-w-full object-contain rounded shadow-md"
                        onError={(e) => {
                          e.target.src = "/placeholder-food.png";
                        }}
                      />
                    </div>

                    {/* Right side - Details */}
                    <div className="w-2/3 p-1 sm:p-2 text-white">
                      <p className="font-bold text-xs sm:text-sm">
                        {station.racks[1]?.name}
                      </p>
                      <p className="text-green-300 font-semibold text-xs sm:text-sm">
                        Filled
                      </p>
                      <p className="text-xs sm:text-sm">
                        Food Type: {station.racks[1]?.Diet}
                      </p>
                      {station.racks[1]?.items?.length > 0 && (
                        <p className="text-xs mt-1 truncate">
                          {station.racks[1]?.items.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-40 text-white rounded">
                    <div className="text-center">
                      <p className="font-bold text-xs sm:text-sm">
                        {(station.racks && station.racks[1]?.name) ||
                          "Unknown Rack"}
                      </p>
                      <p className="text-red-300 font-semibold text-xs sm:text-sm">
                        Empty
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Admin Dashboard</h1>

      {/* Filters and Controls */}
      <div className="mb-6 flex flex-wrap gap-4 justify-between items-center">
        {/* Date Range Selector */}
        <div className="flex items-center">
          <label htmlFor="dateRange" className="mr-2 font-medium">
            Time Period:
          </label>
          <select
            id="dateRange"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border rounded-md px-2 py-1"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Station Selector */}
        <div className="flex items-center">
          <label htmlFor="station" className="mr-2 font-medium">
            Station:
          </label>
          <select
            id="station"
            value={selectedStation || ""}
            onChange={(e) => setSelectedStation(e.target.value || null)}
            className="border rounded-md px-2 py-1"
          >
            <option value="">All Stations</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name || `Station ${station.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => {
            setLoading(true);
            Promise.all([
              fetchStations(),
              fetchActivities(),
              fetchUsers(),
              fetchSensorData(),
            ]).then(() => setLoading(false));
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-1 px-4 rounded"
        >
          Refresh Data
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex flex-wrap -mb-px">
          <button
            className={`mr-2 py-2 px-4 font-medium ${
              activeTab === "overview"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`mr-2 py-2 px-4 font-medium ${
              activeTab === "stations"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("stations")}
          >
            Stations
          </button>
          <button
            className={`mr-2 py-2 px-4 font-medium ${
              activeTab === "users"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
          <button
            className={`mr-2 py-2 px-4 font-medium ${
              activeTab === "food"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("food")}
          >
            Food Items
          </button>
          <button
            className={`mr-2 py-2 px-4 font-medium ${
              activeTab === "sensors"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("sensors")}
          >
            Sensors
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Donations */}
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Donations
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.totalDonations}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Collections */}
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Collections
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.totalCollections}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Available Food Items */}
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Available Food Items
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.availableFoodItems}
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <svg
                    className="w-6 h-6 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Average Collection Time */}
            {/* <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Avg. Time to Collection
                  </p>
                  <p className="text-2xl font-bold">
                    {formatDuration(analytics.averageTimeToCollection)}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <svg
                    className="w-6 h-6 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>*/}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Activity Trends */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Activity </h2>
              <div className="h-64">
                <Bar
                  data={getActivityTrendChartData()}
                  options={chartOptions}
                />
              </div>
            </div>

            {/* Dietary Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Dietary Breakdown</h2>
              <div className="h-64">
                <Pie
                  data={getDietaryChartData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Station Utilization */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">
                Station Utilization
              </h2>
              <div className="h-64">
                <Bar
                  data={getStationUtilizationChartData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: "y",
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Top Stations */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Top Stations</h2>
              <div className="overflow-y-auto max-h-64">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Station
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Activity Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.topStations.map((station) => (
                      <tr key={station.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {station.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {station.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Stations Tab */}
      {activeTab === "stations" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Food Stations</h2>

          {/* Station Details */}
          <div className="mb-8">
            <p className="mb-2">
              <span className="font-medium">Total Stations:</span>{" "}
              {analytics.totalStations}
            </p>
            <p className="mb-2">
              <span className="font-medium">Active Stations:</span>{" "}
              {analytics.activeStations}
            </p>
          </div>

          {/* Station Cabinet Visualization */}
          {renderStationCabinet()}

          {/* Station List */}
          <div className="mt-8">
            <h3 className="text-md font-semibold mb-2">All Stations</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Location
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Utilization
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stations.map((station) => {
                    const stationAnalytics = analytics.stationUtilization.find(
                      (s) => s.id === station.id
                    ) || { utilization: 0 };
                    return (
                      <tr
                        key={station.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedStation(station.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {station.name || `Station ${station.id}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {station.location || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              station.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {station.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{
                                width: `${stationAnalytics.utilization}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs">
                            {stationAnalytics.utilization.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">User Analytics</h2>

          <div className="mb-6">
            <p className="mb-2">
              <span className="font-medium">Total Users:</span>{" "}
              {analytics.totalUsers}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Donors */}
            <div>
              <h3 className="text-md font-semibold mb-2">Top Donors</h3>
              <div className="overflow-y-auto max-h-80">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        User ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Donations
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.topDonors.map((donor) => (
                      <tr key={donor.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {donor.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {donor.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Collectors */}
            <div>
              <h3 className="text-md font-semibold mb-2">Top Collectors</h3>
              <div className="overflow-y-auto max-h-80">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        User ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Collections
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.topCollectors.map((collector) => (
                      <tr key={collector.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {collector.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {collector.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* User Activity Log */}
          <div className="mt-8">
            <h3 className="text-md font-semibold mb-2">Recent Activity</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Activity
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Station
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.slice(0, 10).map((activity) => {
                    const station = stations.find(
                      (s) => s.id === activity.stationId
                    );
                    return (
                      <tr key={activity.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {activity.timestamp.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {activity.userId
                            ? activity.userId.substring(0, 8) + "..."
                            : "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              activity.type === "donation"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {activity.type === "donation"
                              ? "Donation"
                              : "Collection"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {station
                            ? station.name || `Station ${station.id}`
                            : "Unknown"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Food Items Tab */}
      {activeTab === "food" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Food Items Analytics</h2>

          {/* Food Items Overview */}
          <div className="mb-6">
            <p className="mb-2">
              <span className="font-medium">Total Available Food Items:</span>{" "}
              {analytics.availableFoodItems}
            </p>
            {/* <p className="mb-4">
              <span className="font-medium">Average Time to Collection:</span>{" "}
              {formatDuration(analytics.averageTimeToCollection)}
            </p> */}

            {/* Dietary Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-semibold mb-2">
                  Dietary Breakdown
                </h3>
                <div className="h-64">
                  <Pie
                    data={getDietaryChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-md font-semibold mb-2">Food Details</h3>
                <div className="overflow-y-auto max-h-64">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Type
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Count
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Vegetarian
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {analytics.dietaryBreakdown.veg}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {analytics.totalDonations > 0
                            ? (
                                (analytics.dietaryBreakdown.veg /
                                  analytics.totalDonations) *
                                100
                              ).toFixed(1) + "%"
                            : "0%"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Non-Vegetarian
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {analytics.dietaryBreakdown.nonVeg}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {analytics.totalDonations > 0
                            ? (
                                (analytics.dietaryBreakdown.nonVeg /
                                  analytics.totalDonations) *
                                100
                              ).toFixed(1) + "%"
                            : "0%"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Unspecified
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {analytics.dietaryBreakdown.unknown}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {analytics.totalDonations > 0
                            ? (
                                (analytics.dietaryBreakdown.unknown /
                                  analytics.totalDonations) *
                                100
                              ).toFixed(1) + "%"
                            : "0%"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "sensors" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Sensor Monitoring</h2>

          {/* Current Reading Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Temperature */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-semibold">Temperature</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getSensorStatusClass(
                    sensorData.temperature?.status
                  )}`}
                >
                  {sensorData.temperature?.status || "unknown"}
                </span>
              </div>
              <p className="text-3xl font-bold">
                {sensorData.temperature?.value || "--"}
                <span className="text-lg ml-1">
                  {sensorData.temperature?.unit}
                </span>
              </p>
            </div>

            {/* Humidity */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-semibold">Humidity</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getSensorStatusClass(
                    sensorData.humidity?.status
                  )}`}
                >
                  {sensorData.humidity?.status || "unknown"}
                </span>
              </div>
              <p className="text-3xl font-bold">
                {sensorData.humidity?.value || "--"}
                <span className="text-lg ml-1">
                  {sensorData.humidity?.unit}
                </span>
              </p>
            </div>

            {/* Ultrasonic */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-semibold">Distance</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getSensorStatusClass(
                    sensorData.ultrasonic?.status
                  )}`}
                >
                  {sensorData.ultrasonic?.status || "unknown"}
                </span>
              </div>
              <p className="text-3xl font-bold">
                {sensorData.ultrasonic?.value || "--"}
                <span className="text-lg ml-1">
                  {sensorData.ultrasonic?.unit}
                </span>
              </p>
            </div>

            {/* Gas */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-semibold">Gas Level</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getSensorStatusClass(
                    sensorData.gas?.status
                  )}`}
                >
                  {sensorData.gas?.status || "unknown"}
                </span>
              </div>
              <p className="text-3xl font-bold">
                {sensorData.gas?.value || "--"}
                <span className="text-lg ml-1">{sensorData.gas?.unit}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodFlowAnalysis;
