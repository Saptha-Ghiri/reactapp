import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
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

const UserAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    topDonors: [],
    topReceivers: [],
  });
  const [userActivity, setUserActivity] = useState([]);
  const [userEngagement, setUserEngagement] = useState([]);
  const [userRetention, setUserRetention] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch users
      const userSnapshot = await getDocs(collection(db, "userpass"));
      const users = userSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch donations
      const donationsSnapshot = await getDocs(collection(db, "food items"));
      const donations = donationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Process user data
      processUserData(users, donations);
    } catch (err) {
      console.error("Error fetching user analytics:", err);
      setError("Failed to load user analytics data");
    } finally {
      setLoading(false);
    }
  };

  const processUserData = (users, donations) => {
    // Calculate user metrics
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);

    // Count new users in last 30 days
    const newUsers = users.filter((user) => {
      const createdAt = user.createdAt ? new Date(user.createdAt) : null;
      return createdAt && createdAt > lastMonth;
    }).length;

    // Count active users (made a donation or received one in last 30 days)
    const activeDonorIds = new Set(
      donations
        .filter((donation) => {
          const createdAt = donation.createdAt
            ? new Date(donation.createdAt)
            : null;
          return createdAt && createdAt > lastMonth;
        })
        .map((donation) => donation.userId)
    );

    const activeReceiverIds = new Set(
      donations
        .filter((donation) => {
          const receivedAt = donation.receivedAt
            ? new Date(donation.receivedAt)
            : null;
          return receivedAt && receivedAt > lastMonth;
        })
        .map((donation) => donation.receivedBy)
        .filter((id) => id) // Filter out null/undefined
    );

    const activeUserCount = new Set([...activeDonorIds, ...activeReceiverIds])
      .size;

    // Find top donors
    const donorCounts = {};
    donations.forEach((donation) => {
      if (donation.userId) {
        donorCounts[donation.userId] = (donorCounts[donation.userId] || 0) + 1;
      }
    });

    const topDonors = Object.entries(donorCounts)
      .map(([userId, count]) => {
        const user = users.find((u) => u.id === userId);
        return {
          id: userId,
          name:
            user?.displayName ||
            user?.email ||
            `User ${userId.substring(0, 6)}`,
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Find top receivers
    const receiverCounts = {};
    donations
      .filter((donation) => donation.status === "completed")
      .forEach((donation) => {
        if (donation.receivedBy) {
          receiverCounts[donation.receivedBy] =
            (receiverCounts[donation.receivedBy] || 0) + 1;
        }
      });

    const topReceivers = Object.entries(receiverCounts)
      .map(([userId, count]) => {
        const user = users.find((u) => u.id === userId);
        return {
          id: userId,
          name:
            user?.displayName ||
            user?.email ||
            `User ${userId.substring(0, 6)}`,
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Set user stats
    setUserStats({
      totalUsers: users.length,
      activeUsers: activeUserCount,
      newUsers,
      topDonors,
      topReceivers,
    });

    // Create user activity data for last 6 months
    const activityData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthName = monthDate.toLocaleString("default", { month: "short" });
      const monthStart = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        1
      );
      const monthEnd = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0
      );

      // Count donations in this month
      const monthDonations = donations.filter((donation) => {
        const createdAt = donation.createdAt
          ? new Date(donation.createdAt)
          : null;
        return createdAt && createdAt >= monthStart && createdAt <= monthEnd;
      }).length;

      // Count collections in this month
      const monthCollections = donations.filter((donation) => {
        const receivedAt = donation.receivedAt
          ? new Date(donation.receivedAt)
          : null;
        return receivedAt && receivedAt >= monthStart && receivedAt <= monthEnd;
      }).length;

      // Count new users in this month
      const monthNewUsers = users.filter((user) => {
        const createdAt = user.createdAt ? new Date(user.createdAt) : null;
        return createdAt && createdAt >= monthStart && createdAt <= monthEnd;
      }).length;

      activityData.push({
        month: monthName,
        donations: monthDonations,
        collections: monthCollections,
        newUsers: monthNewUsers,
      });
    }

    setUserActivity(activityData);

    // User engagement data (frequency of donations)
    const donationFrequency = [
      { name: "1 donation", value: 0 },
      { name: "2-5 donations", value: 0 },
      { name: "6-10 donations", value: 0 },
      { name: "11+ donations", value: 0 },
    ];

    Object.values(donorCounts).forEach((count) => {
      if (count === 1) {
        donationFrequency[0].value++;
      } else if (count >= 2 && count <= 5) {
        donationFrequency[1].value++;
      } else if (count >= 6 && count <= 10) {
        donationFrequency[2].value++;
      } else {
        donationFrequency[3].value++;
      }
    });

    setUserEngagement(donationFrequency);

    // User retention data (approximated)
    // For a more accurate implementation, we'd need more historical data
    const retentionData = [
      {
        name: "One-time Users",
        value: Object.values(donorCounts).filter((count) => count === 1).length,
      },
      {
        name: "Returning Users",
        value: Object.values(donorCounts).filter((count) => count > 1).length,
      },
    ];

    setUserRetention(retentionData);

    // User growth over time
    // For simplicity, we'll mock this data - in a real app, you'd need user registration dates
    const growthData = activityData.map((month) => ({
      month: month.month,
      users: month.newUsers,
    }));

    setUserGrowth(growthData);
  };

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

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
        <h1 className="text-3xl font-bold mb-6 text-center">User Analytics</h1>

        {/* User Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Total Users</h2>
            <p className="text-3xl font-bold text-blue-600">
              {userStats.totalUsers}
            </p>
            <p className="text-sm text-gray-500">
              <span className="text-green-500">+{userStats.newUsers}</span> new
              in last 30 days
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Active Users</h2>
            <p className="text-3xl font-bold text-purple-600">
              {userStats.activeUsers}
            </p>
            <p className="text-sm text-gray-500">Last 30 days activity</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Engagement Rate</h2>
            <p className="text-3xl font-bold text-green-600">
              {userStats.totalUsers
                ? `${Math.round(
                    (userStats.activeUsers / userStats.totalUsers) * 100
                  )}%`
                : "0%"}
            </p>
            <p className="text-sm text-gray-500">Active vs Total users</p>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">User Growth & Activity</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={userActivity}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  name="New Users"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="donations"
                  name="Donations"
                  stroke="#82ca9d"
                />
                <Line
                  type="monotone"
                  dataKey="collections"
                  name="Collections"
                  stroke="#ffc658"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Engagement & Retention */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* User Engagement */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Donor Engagement</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userEngagement}
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
                    {userEngagement.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Retention */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">User Retention</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={userRetention}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Users" fill="#8884d8">
                    {userRetention.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? "#FFC107" : "#4CAF50"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Users */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Top Donors */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Top Donors</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Donations
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.topDonors.map((donor, index) => (
                    <tr key={donor.id}>
                      <td className="py-2 px-4 border-b border-gray-200">
                        {donor.name}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200">
                        {donor.count}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          #{index + 1}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Receivers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Top Receivers</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Received
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.topReceivers.map((receiver, index) => (
                    <tr key={receiver.id}>
                      <td className="py-2 px-4 border-b border-gray-200">
                        {receiver.name}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200">
                        {receiver.count}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          #{index + 1}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;
