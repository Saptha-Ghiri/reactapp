import React, { useState, useEffect } from "react";
import { collection, query, getDocs, where, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const FoodFlowAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("week");
  const [activePage, setActivePage] = useState("overview");

  // Data states
  const [donationData, setDonationData] = useState([]);
  const [collectionData, setCollectionData] = useState([]);
  const [stationPerformance, setStationPerformance] = useState([]);
  const [dietaryBreakdown, setDietaryBreakdown] = useState([]);
  const [timeBasedActivity, setTimeBasedActivity] = useState([]);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      const activityRef = collection(db, "activity-logs");

      // Calculate the date range based on selection
      const endDate = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      // Fetch donation data
      const donationsQuery = query(
        activityRef,
        where("type", "==", "donation"),
        where("timestamp", ">=", startDate),
        where("timestamp", "<=", endDate),
        orderBy("timestamp", "asc")
      );

      // Fetch collection data
      const collectionsQuery = query(
        activityRef,
        where("type", "==", "collection"),
        where("timestamp", ">=", startDate),
        where("timestamp", "<=", endDate),
        orderBy("timestamp", "asc")
      );

      const [donationSnapshot, collectionSnapshot] = await Promise.all([
        getDocs(donationsQuery),
        getDocs(collectionsQuery),
      ]);

      // Process donation data
      const donations = donationSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      }));

      // Process collection data
      const collections = collectionSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      }));

      // Process station performance
      const stationMap = new Map();

      donations.forEach((donation) => {
        const stationId = donation.stationId;
        if (!stationMap.has(stationId)) {
          stationMap.set(stationId, {
            name: `Station ${stationId}`,
            donations: 0,
            collections: 0,
          });
        }
        stationMap.get(stationId).donations += 1;
      });

      collections.forEach((collection) => {
        const stationId = collection.stationId;
        if (!stationMap.has(stationId)) {
          stationMap.set(stationId, {
            name: `Station ${stationId}`,
            donations: 0,
            collections: 0,
          });
        }
        stationMap.get(stationId).collections += 1;
      });

      const stationArray = Array.from(stationMap.entries()).map(
        ([id, data]) => ({
          id,
          ...data,
          utilizationRate:
            data.donations > 0
              ? ((data.collections / data.donations) * 100).toFixed(1)
              : 0,
        })
      );

      // Process food dietary breakdown
      // Use an object instead of a Map for dietary data
      const dietCounts = {};

      donations.forEach((donation) => {
        const diet = donation.foodDetails?.diet || "unknown";
        dietCounts[diet] = (dietCounts[diet] || 0) + 1;
      });

      // Convert the object to array format needed for chart
      const dietArray = Object.keys(dietCounts).map((diet) => ({
        name:
          diet === "veg"
            ? "Vegetarian"
            : diet === "nonveg"
            ? "Non-Vegetarian"
            : "Unspecified",
        value: dietCounts[diet],
      }));

      // Process time-based activity
      const timeMap = new Map();

      // Create time periods based on selected range
      if (timeRange === "week") {
        const days = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        days.forEach((day) =>
          timeMap.set(day, { name: day, donations: 0, collections: 0 })
        );

        donations.forEach((donation) => {
          const day = days[donation.timestamp.getDay()];
          timeMap.get(day).donations += 1;
        });

        collections.forEach((collection) => {
          const day = days[collection.timestamp.getDay()];
          timeMap.get(day).collections += 1;
        });
      } else {
        // Group by date for longer ranges
        donations.forEach((donation) => {
          const dateKey = donation.timestamp.toISOString().split("T")[0];
          if (!timeMap.has(dateKey)) {
            timeMap.set(dateKey, {
              name: donation.timestamp.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              }),
              date: dateKey,
              donations: 0,
              collections: 0,
            });
          }
          timeMap.get(dateKey).donations += 1;
        });

        collections.forEach((collection) => {
          const dateKey = collection.timestamp.toISOString().split("T")[0];
          if (!timeMap.has(dateKey)) {
            timeMap.set(dateKey, {
              name: collection.timestamp.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              }),
              date: dateKey,
              donations: 0,
              collections: 0,
            });
          }
          timeMap.get(dateKey).collections += 1;
        });
      }

      // Convert to array and sort by date/day
      let timeArray = Array.from(timeMap.values());

      if (timeRange !== "week") {
        timeArray = timeArray.sort((a, b) => a.date.localeCompare(b.date));
      }

      // Update state with processed data
      setDonationData(donations);
      setCollectionData(collections);
      setStationPerformance(stationArray);
      setDietaryBreakdown(dietArray);
      setTimeBasedActivity(timeArray);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError(`Failed to load analytics: ${err.message}`);
      setLoading(false);
    }
  };

  const calculateAvgTimeToCollection = () => {
    let totalTime = 0;
    let count = 0;

    const donationMap = new Map();
    donationData.forEach((donation) => {
      const key = `${donation.stationId}-${donation.rackId}`;
      donationMap.set(key, donation.timestamp);
    });

    collectionData.forEach((collection) => {
      const key = `${collection.stationId}-${collection.rackId}`;
      const donationTime = donationMap.get(key);

      if (donationTime) {
        const timeDiff = collection.timestamp - donationTime;
        if (timeDiff > 0) {
          totalTime += timeDiff;
          count += 1;
        }
      }
    });

    if (count === 0) return "N/A";

    const avgTimeMs = totalTime / count;
    const avgHours = Math.floor(avgTimeMs / (1000 * 60 * 60));
    const avgMinutes = Math.floor((avgTimeMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${avgHours}h ${avgMinutes}m`;
  };

  const getCollectionRate = () => {
    if (donationData.length === 0) return "0%";
    const rate = ((collectionData.length / donationData.length) * 100).toFixed(
      1
    );
    return `${rate}%`;
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Total Donations</h3>
        <p className="text-3xl font-bold text-blue-600">
          {donationData.length}
        </p>
        <p className="text-sm text-gray-500">during selected period</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Total Collections</h3>
        <p className="text-3xl font-bold text-green-600">
          {collectionData.length}
        </p>
        <p className="text-sm text-gray-500">during selected period</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Collection Rate</h3>
        <p className="text-3xl font-bold text-purple-600">
          {getCollectionRate()}
        </p>
        <p className="text-sm text-gray-500">donations collected vs. total</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Avg. Time to Collection
        </h3>
        <p className="text-3xl font-bold text-amber-600">
          {calculateAvgTimeToCollection()}
        </p>
        <p className="text-sm text-gray-500">from donation to pickup</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Most Active Station
        </h3>
        <p className="text-3xl font-bold text-indigo-600">
          {stationPerformance.length > 0
            ? stationPerformance.sort(
                (a, b) =>
                  b.donations + b.collections - (a.donations + a.collections)
              )[0]?.name
            : "N/A"}
        </p>
        <p className="text-sm text-gray-500">highest combined activity</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Most Common Diet</h3>
        <p className="text-3xl font-bold text-rose-600">
          {dietaryBreakdown.length > 0
            ? dietaryBreakdown.sort((a, b) => b.value - a.value)[0]?.name
            : "N/A"}
        </p>
        <p className="text-sm text-gray-500">most frequently donated</p>
      </div>
    </div>
  );

  const renderTimeTrends = () => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-10">
      <h3 className="text-xl font-semibold mb-4">Activity Over Time</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={timeBasedActivity}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="donations"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            name="Donations"
          />
          <Line
            type="monotone"
            dataKey="collections"
            stroke="#82ca9d"
            name="Collections"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const renderStationComparison = () => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-10">
      <h3 className="text-xl font-semibold mb-4">Station Performance</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={stationPerformance}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="donations" fill="#8884d8" name="Donations" />
          <Bar dataKey="collections" fill="#82ca9d" name="Collections" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderDietaryBreakdown = () => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-10">
      <h3 className="text-xl font-semibold mb-4">Food Type Distribution</h3>
      <div className="flex flex-col md:flex-row items-center justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dietaryBreakdown}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {dietaryBreakdown.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} items`, "Count"]} />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-4 md:mt-0 md:ml-8">
          <h4 className="text-lg font-medium mb-2">Breakdown</h4>
          <ul className="space-y-2">
            {dietaryBreakdown.map((item, index) => (
              <li key={index} className="flex items-center">
                <span
                  className="inline-block w-4 h-4 mr-2 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></span>
                <span className="font-medium">{item.name}:</span>
                <span className="ml-2">{item.value} items</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

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
    <div className="w-full max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Food Flow Analytics</h1>

      {/* Time range selector */}
      <div className="mb-6">
        <label
          htmlFor="timeRange"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select Time Range:
        </label>
        <select
          id="timeRange"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="block w-full max-w-xs px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 90 Days</option>
          <option value="year">Last 365 Days</option>
        </select>
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-wrap mb-6 border-b border-gray-200">
        <button
          onClick={() => setActivePage("overview")}
          className={`py-2 px-4 font-medium text-sm ${
            activePage === "overview"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActivePage("time")}
          className={`py-2 px-4 font-medium text-sm ${
            activePage === "time"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Time Trends
        </button>
        <button
          onClick={() => setActivePage("stations")}
          className={`py-2 px-4 font-medium text-sm ${
            activePage === "stations"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Station Comparison
        </button>
        <button
          onClick={() => setActivePage("dietary")}
          className={`py-2 px-4 font-medium text-sm ${
            activePage === "dietary"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Dietary Breakdown
        </button>
      </div>

      {/* Content based on active page */}
      {activePage === "overview" && renderOverview()}
      {activePage === "time" && renderTimeTrends()}
      {activePage === "stations" && renderStationComparison()}
      {activePage === "dietary" && renderDietaryBreakdown()}

      {/* Information note */}
      <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 text-sm text-gray-600">
        <p>
          Note: This dashboard shows food donation and collection analytics for
          the selected time period. Use the tabs above to explore different
          aspects of the data.
        </p>
      </div>
    </div>
  );
};

export default FoodFlowAnalysis;
