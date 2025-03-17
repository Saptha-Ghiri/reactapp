import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  startAfter,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/config";

const AdminDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFoodType, setFilterFoodType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const PAGE_SIZE = 15;

  useEffect(() => {
    loadDonations();
  }, [filterStatus, filterFoodType]);

  const loadDonations = async (searchStart = null) => {
    try {
      setLoading(true);

      // Build query
      let donationsQuery = collection(db, "food items");
      let constraints = [];

      // Apply filters
      if (filterStatus !== "all") {
        constraints.push(where("status", "==", filterStatus));
      }

      if (filterFoodType !== "all") {
        constraints.push(where("foodType", "==", filterFoodType));
      }

      // Add sorting and pagination
      constraints.push(orderBy("createdAt", "desc"));

      if (searchStart) {
        constraints.push(startAfter(searchStart));
      }

      constraints.push(limit(PAGE_SIZE));

      // Execute query
      const querySnapshot = await getDocs(
        query(donationsQuery, ...constraints)
      );

      // Process results
      const donationsList = [];
      querySnapshot.forEach((doc) => {
        donationsList.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Update last document reference for pagination
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(lastVisible);

      // Check if there are more results
      setHasMore(querySnapshot.docs.length === PAGE_SIZE);

      // Update state
      if (searchStart) {
        setDonations((prev) => [...prev, ...donationsList]);
      } else {
        setDonations(donationsList);
      }
    } catch (err) {
      console.error("Error loading donations:", err);
      setError("Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  const loadMoreDonations = () => {
    if (lastDoc) {
      loadDonations(lastDoc);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If search is empty, just load with filters
      loadDonations();
      return;
    }

    try {
      setLoading(true);

      // Search by food name (case insensitive if possible with your Firestore setup)
      const nameQuerySnapshot = await getDocs(
        query(
          collection(db, "food items"),
          where("foodName", ">=", searchQuery),
          where("foodName", "<=", searchQuery + "\uf8ff"),
          limit(PAGE_SIZE)
        )
      );

      // Process results
      const donationsList = [];
      nameQuerySnapshot.forEach((doc) => {
        // Apply client-side filtering for other filters
        const data = doc.data();
        if (
          (filterStatus === "all" || data.status === filterStatus) &&
          (filterFoodType === "all" || data.foodType === filterFoodType)
        ) {
          donationsList.push({
            id: doc.id,
            ...data,
          });
        }
      });

      // Sort by date manually since we're doing client-side filtering
      donationsList.sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });

      setDonations(donationsList);
      setHasMore(false); // Disable load more for search results
    } catch (err) {
      console.error("Error searching donations:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const viewDonationDetails = async (donationId) => {
    try {
      const donationRef = doc(db, "food items", donationId);
      const donationSnap = await getDoc(donationRef);

      if (donationSnap.exists()) {
        setSelectedDonation({
          id: donationSnap.id,
          ...donationSnap.data(),
        });
        setIsModalOpen(true);
      } else {
        setError("Donation not found");
      }
    } catch (err) {
      console.error("Error fetching donation details:", err);
      setError("Failed to load donation details");
    }
  };

  const handleEditDonation = () => {
    setFormData({ ...selectedDonation });
    setEditMode(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveDonation = async () => {
    try {
      setLoading(true);

      // Update donation in Firestore
      const donationRef = doc(db, "food items", selectedDonation.id);
      await updateDoc(donationRef, {
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: "admin", // Add admin ID here in a real app
      });

      // Update local state
      setDonations((prev) =>
        prev.map((donation) =>
          donation.id === selectedDonation.id
            ? { ...donation, ...formData }
            : donation
        )
      );

      setSelectedDonation({ ...selectedDonation, ...formData });
      setEditMode(false);
    } catch (err) {
      console.error("Error updating donation:", err);
      setError("Failed to update donation");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDonation = async () => {
    if (!window.confirm("Are you sure you want to delete this donation?")) {
      return;
    }

    try {
      setLoading(true);

      // Delete donation from Firestore
      await deleteDoc(doc(db, "food items", selectedDonation.id));

      // Update local state
      setDonations((prev) =>
        prev.filter((donation) => donation.id !== selectedDonation.id)
      );
      setIsModalOpen(false);
      setSelectedDonation(null);
    } catch (err) {
      console.error("Error deleting donation:", err);
      setError("Failed to delete donation");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "available":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Donation Management
        </h1>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by food name..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="accepted">Accepted</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Food Type
              </label>
              <select
                value={filterFoodType}
                onChange={(e) => setFilterFoodType(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              >
                <option value="all">All Types</option>
                <option value="Veg">Vegetarian</option>
                <option value="Non-Veg">Non-Vegetarian</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 w-full"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="underline text-red-700 mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Donations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading && !donations.length ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Food Name
                      </th>
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
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Created
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Location
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {donations.map((donation) => (
                      <tr key={donation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {donation.imageUrl && (
                              <div className="flex-shrink-0 h-10 w-10 mr-3">
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={donation.imageUrl}
                                  alt={donation.foodName}
                                  onError={(e) => {
                                    e.target.src =
                                      "/placeholder-food-image.png";
                                  }}
                                />
                              </div>
                            )}
                            <div className="text-sm font-medium text-gray-900">
                              {donation.foodName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              donation.foodType === "Veg"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {donation.foodType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                              donation.status
                            )}`}
                          >
                            {donation.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(donation.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {donation.pickupLocation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => viewDonationDetails(donation.id)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {donations.length === 0 && !loading && (
                <div className="text-center py-10">
                  <p className="text-gray-500">
                    No donations found matching your criteria.
                  </p>
                </div>
              )}

              {hasMore && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={loadMoreDonations}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Donation Detail Modal */}
      {isModalOpen && selectedDonation && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => !editMode && setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full m-4">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">
                  {editMode ? "Edit Donation" : "Donation Details"}
                </h2>
                <button
                  onClick={() => {
                    if (editMode) {
                      if (window.confirm("Discard changes?")) {
                        setEditMode(false);
                      }
                    } else {
                      setIsModalOpen(false);
                    }
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Image */}
                <div>
                  {selectedDonation.imageUrl ? (
                    <img
                      src={selectedDonation.imageUrl}
                      alt={selectedDonation.foodName}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg">
                      <span className="text-gray-500">No image available</span>
                    </div>
                  )}

                  {/* Donation ID and Timestamps */}
                  <div className="mt-4 text-sm text-gray-500">
                    <p>
                      <span className="font-medium">Donation ID:</span>{" "}
                      {selectedDonation.id}
                    </p>
                    <p>
                      <span className="font-medium">Created:</span>{" "}
                      {formatDate(selectedDonation.createdAt)}
                    </p>
                    {selectedDonation.updatedAt && (
                      <p>
                        <span className="font-medium">Last Updated:</span>{" "}
                        {formatDate(selectedDonation.updatedAt)}
                      </p>
                    )}
                    {selectedDonation.receivedAt && (
                      <p>
                        <span className="font-medium">Received:</span>{" "}
                        {formatDate(selectedDonation.receivedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column - Details */}
                <div>
                  {editMode ? (
                    /* Edit Form */
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Food Name
                        </label>
                        <input
                          type="text"
                          name="foodName"
                          value={formData.foodName || ""}
                          onChange={handleFormChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Food Type
                        </label>
                        <select
                          name="foodType"
                          value={formData.foodType || ""}
                          onChange={handleFormChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        >
                          <option value="Veg">Vegetarian</option>
                          <option value="Non-Veg">Non-Vegetarian</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          name="status"
                          value={formData.status || ""}
                          onChange={handleFormChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        >
                          <option value="available">Available</option>
                          <option value="accepted">Accepted</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="text"
                          name="quantity"
                          value={formData.quantity || ""}
                          onChange={handleFormChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pickup Location
                        </label>
                        <input
                          type="text"
                          name="pickupLocation"
                          value={formData.pickupLocation || ""}
                          onChange={handleFormChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes || ""}
                          onChange={handleFormChange}
                          rows="3"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        ></textarea>
                      </div>
                    </div>
                  ) : (
                    /* View Details */
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold">
                          {selectedDonation.foodName}
                        </h3>
                        <div className="flex items-center mt-1">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              selectedDonation.foodType === "Veg"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {selectedDonation.foodType}
                          </span>
                          <span
                            className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                              selectedDonation.status
                            )}`}
                          >
                            {selectedDonation.status}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <dl className="divide-y divide-gray-200">
                          <div className="py-2 grid grid-cols-3">
                            <dt className="text-sm font-medium text-gray-500">
                              Quantity
                            </dt>
                            <dd className="text-sm text-gray-900 col-span-2">
                              {selectedDonation.quantity}
                            </dd>
                          </div>

                          <div className="py-2 grid grid-cols-3">
                            <dt className="text-sm font-medium text-gray-500">
                              Pickup Location
                            </dt>
                            <dd className="text-sm text-gray-900 col-span-2">
                              {selectedDonation.pickupLocation}
                            </dd>
                          </div>

                          <div className="py-2 grid grid-cols-3">
                            <dt className="text-sm font-medium text-gray-500">
                              Expiry Date
                            </dt>
                            <dd className="text-sm text-gray-900 col-span-2">
                              {formatDate(selectedDonation.expiryDate)}
                            </dd>
                          </div>

                          <div className="py-2 grid grid-cols-3">
                            <dt className="text-sm font-medium text-gray-500">
                              Donor ID
                            </dt>
                            <dd className="text-sm text-gray-900 col-span-2">
                              {selectedDonation.userId}
                            </dd>
                          </div>

                          {selectedDonation.receivedBy && (
                            <div className="py-2 grid grid-cols-3">
                              <dt className="text-sm font-medium text-gray-500">
                                Receiver ID
                              </dt>
                              <dd className="text-sm text-gray-900 col-span-2">
                                {selectedDonation.receivedBy}
                              </dd>
                            </div>
                          )}

                          {selectedDonation.notes && (
                            <div className="py-2 grid grid-cols-3">
                              <dt className="text-sm font-medium text-gray-500">
                                Notes
                              </dt>
                              <dd className="text-sm text-gray-900 col-span-2">
                                {selectedDonation.notes}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                {editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDonation}
                      disabled={loading}
                      className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEditDonation}
                      className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDeleteDonation}
                      disabled={loading}
                      className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      {loading ? "Deleting..." : "Delete"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDonations;
