import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

export const AllPosts = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const collectionRef = collection(db, "food items");

      try {
        const snapshot = await getDocs(collectionRef);
        let results = [];
        snapshot.docs.forEach((doc) => {
          results.push({ ...doc.data(), id: doc.id });
        });
        setPosts(results);
      } catch (e) {
        console.error("Error fetching posts:", e);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white p-6 shadow-md rounded-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Available Food Donations</h1>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div key={post.id} className="p-4 border rounded-md shadow-md bg-gray-50">
                <img src={post.imageUrl} alt={post.foodName} className="w-full h-40 object-cover rounded-md" />
                <h3 className="text-lg font-semibold mt-2">{post.foodName}</h3>
                <p className={`mt-1 ${post.foodType === "Veg" ? "text-green-600" : "text-red-600"} font-bold`}>
                  {post.foodType}
                </p>
                <p className="text-gray-600 mt-1">Quantity: {post.quantity}</p>
                <p className="text-gray-600 mt-1">Pickup Location: {post.pickupLocation}</p>
                <p className="text-gray-600 mt-1">Best Before: {new Date(post.expiryDate).toLocaleString()}</p>
                {post.notes && <p className="text-gray-500 mt-1 italic">"{post.notes}"</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No food items available.</p>
        )}
      </div>
    </div>
  );
};

export default AllPosts;
