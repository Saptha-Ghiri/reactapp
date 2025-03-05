import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db, storage } from "../firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";

const RecipeFinder = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchIngredients, setSearchIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const { id } = useParams();

  // Filter states
  const [filters, setFilters] = useState({
    diet: "",
    cuisine: "",
    course: "",
  });

  // Available filter options (to be populated from data)
  const [filterOptions, setFilterOptions] = useState({
    diet: [],
    cuisine: [],
    course: [],
  });

  // Toggle for filter visibility
  const [showFilters, setShowFilters] = useState(false);

  // Load initial recipes on component mount
  useEffect(() => {
    fetchInitialRecipes();
    fetchFilterOptions();
  }, []);

  // Parse input into individual ingredients
  const parseIngredients = (input) => {
    return input
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0);
  };

  // Add a single ingredient from the input
  const addIngredient = () => {
    if (searchTerm.trim() === "") return;

    const newIngredient = searchTerm.trim().toLowerCase();
    if (!searchIngredients.includes(newIngredient)) {
      const updatedIngredients = [...searchIngredients, newIngredient];
      setSearchIngredients(updatedIngredients);
      setSearchTerm(""); // Clear the input after adding

      // Search with the updated ingredients list
      performSearch(updatedIngredients);
    } else {
      setSearchTerm(""); // Clear the input if ingredient already exists
    }
  };

  // Remove a specific ingredient from the search
  const removeIngredient = (ingredientToRemove) => {
    const updatedIngredients = searchIngredients.filter(
      (ingredient) => ingredient !== ingredientToRemove
    );
    setSearchIngredients(updatedIngredients);

    // Perform search with updated ingredients
    performSearch(updatedIngredients);
  };

  // Perform search with given ingredients
  const performSearch = (ingredients = searchIngredients) => {
    try {
      setLoading(true);

      // For client-side search
      let filtered = recipes;

      // Apply search ingredients if present
      if (ingredients.length > 0) {
        filtered = recipes.filter((recipe) => {
          if (!recipe) return false;

          // Convert recipe ingredients to lowercase for case-insensitive comparison
          const recipeIngredientsText = (
            recipe.ingredients || ""
          ).toLowerCase();

          // Check if all of the searched ingredients are in the recipe
          return ingredients.every((ingredient) =>
            recipeIngredientsText.includes(ingredient)
          );
        });
      }

      // Apply filters
      if (filters.diet) {
        filtered = filtered.filter(
          (recipe) =>
            recipe.diet &&
            recipe.diet.toLowerCase() === filters.diet.toLowerCase()
        );
      }

      if (filters.cuisine) {
        filtered = filtered.filter(
          (recipe) =>
            recipe.cuisine &&
            recipe.cuisine.toLowerCase() === filters.cuisine.toLowerCase()
        );
      }

      if (filters.course) {
        filtered = filtered.filter(
          (recipe) =>
            recipe.course &&
            recipe.course.toLowerCase() === filters.course.toLowerCase()
        );
      }

      setFilteredRecipes(filtered);
      setLoading(false);
    } catch (error) {
      console.error("Error searching recipes:", error);
      setLoading(false);
    }
  };

  // Fetch filter options from Firestore
  const fetchFilterOptions = async () => {
    try {
      const recipesSnapshot = await getDocs(collection(db, "recipes"));

      // Extract unique values for each filter category
      const diets = new Set();
      const cuisines = new Set();
      const courses = new Set();

      recipesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.diet) diets.add(data.diet);
        if (data.cuisine) cuisines.add(data.cuisine);
        if (data.course) courses.add(data.course);
      });

      setFilterOptions({
        diet: Array.from(diets).sort(),
        cuisine: Array.from(cuisines).sort(),
        course: Array.from(courses).sort(),
      });
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // Fetch initial set of recipes from Firestore
  const fetchInitialRecipes = async () => {
    try {
      setLoading(true);

      // Create a query to get recipes, ordered by title, limited to 10
      const recipesQuery = query(collection(db, "recipes"), orderBy("title"));

      // Get the documents
      const querySnapshot = await getDocs(recipesQuery);

      // Check if we have more recipes to load
      if (querySnapshot.docs.length === 0) {
        setHasMore(false);
      } else {
        // Save the last visible document for pagination
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }

      // Extract the data from the documents
      const recipesData = querySnapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });

      setRecipes(recipesData);
      setFilteredRecipes(recipesData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading recipes:", error);
      setLoading(false);
    }
  };

  // Fetch more recipes (pagination)
  const fetchMoreRecipes = async () => {
    if (!lastVisible) return;

    try {
      setLoading(true);

      // Create a query to get more recipes, starting after the last visible document
      const recipesQuery = query(
        collection(db, "recipes"),
        orderBy("title"),
        startAfter(lastVisible),
        limit(10)
      );

      // Get the documents
      const querySnapshot = await getDocs(recipesQuery);

      // Check if we have more recipes to load
      if (querySnapshot.docs.length === 0) {
        setHasMore(false);
      } else {
        // Save the last visible document for pagination
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }

      // Extract the data from the documents
      const recipesData = querySnapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });

      // Add the new recipes to the existing ones
      const updatedRecipes = [...recipes, ...recipesData];
      setRecipes(updatedRecipes);

      // Apply current search and filters to the new combined list
      performSearch(searchIngredients);

      setLoading(false);
    } catch (error) {
      console.error("Error loading more recipes:", error);
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    const updatedFilters = { ...filters, [filterType]: value };
    setFilters(updatedFilters);

    // Re-apply search with updated filters
    performSearch(searchIngredients);
  };

  // Reset all filters and search terms
  const resetFilters = () => {
    setFilters({
      diet: "",
      cuisine: "",
      course: "",
    });

    // If search ingredients exist, just apply those without filters
    if (searchIngredients.length > 0) {
      performSearch(searchIngredients);
    } else {
      // Otherwise show all recipes
      setFilteredRecipes(recipes);
    }
  };

  // Reset all search (ingredients and filters)
  const clearAllSearch = () => {
    setSearchIngredients([]);
    setFilters({
      diet: "",
      cuisine: "",
      course: "",
    });
    setFilteredRecipes(recipes);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      addIngredient();
    }
  };

  if (loading && recipes.length === 0) {
    return <div className="container mx-auto p-4">Loading recipes...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Recipe Finder</h1>
      <p className="mb-4">Find recipes with your leftover ingredients</p>

      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Enter an ingredient and press Enter or Add"
          className="flex-grow p-2 border rounded-l"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2"
          onClick={addIngredient}
        >
          Add
        </button>
        {searchIngredients.length > 0 && (
          <button
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-r"
            onClick={clearAllSearch}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Display active ingredients with remove buttons */}
      {searchIngredients.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Showing recipes with all these ingredients:
          </p>
          <div className="flex flex-wrap gap-2">
            {searchIngredients.map((ingredient, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
              >
                {ingredient}
                <button
                  className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                  onClick={() => removeIngredient(ingredient)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter controls */}
      <div className="mb-6">
        <button
          className="text-blue-600 underline mb-2 flex items-center"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Diet Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diet Type
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={filters.diet}
                  onChange={(e) => handleFilterChange("diet", e.target.value)}
                >
                  <option value="">All Diets</option>
                  {filterOptions.diet.map((diet) => (
                    <option key={diet} value={diet}>
                      {diet}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cuisine Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cuisine
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={filters.cuisine}
                  onChange={(e) =>
                    handleFilterChange("cuisine", e.target.value)
                  }
                >
                  <option value="">All Cuisines</option>
                  {filterOptions.cuisine.map((cuisine) => (
                    <option key={cuisine} value={cuisine}>
                      {cuisine}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={filters.course}
                  onChange={(e) => handleFilterChange("course", e.target.value)}
                >
                  <option value="">All Courses</option>
                  {filterOptions.course.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {id ? (
        <RecipeDetail id={id} />
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4">
            {filteredRecipes.length} Recipes Found
          </h2>
          {filteredRecipes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>

              {hasMore && filteredRecipes.length >= recipes.length && (
                <div className="text-center mt-8">
                  <button
                    className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                    onClick={fetchMoreRecipes}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Load More Recipes"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p>No recipes found with those ingredients. Try another search!</p>
          )}
        </>
      )}
    </div>
  );
};

const RecipeCard = ({ recipe }) => {
  if (!recipe) return null;

  // Determine the title color based on diet type
  const titleColor =
    recipe.diet?.toLowerCase() === "vegetarian"
      ? "text-green-600"
      : "text-red-600";

  return (
    <div className="border rounded p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="h-48 overflow-hidden mb-3">
        <img
          src={recipe.image_url || "/api/placeholder/400/300"}
          alt={recipe.title || "Recipe"}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/api/placeholder/400/300";
          }}
        />
      </div>
      <Link to={`/recipe/${recipe.id}`}>
        <h3 className={`font-bold text-lg ${titleColor} hover:underline`}>
          {recipe.title || "Untitled Recipe"}
        </h3>
      </Link>
      <p className="text-sm text-gray-600 mt-1 mb-2 line-clamp-2">
        {recipe.description || "No description available"}
      </p>
      <div className="text-sm">
        <p>
          <strong>Cuisine:</strong> {recipe.cuisine || "Not specified"}
        </p>
        <p>
          <strong>Course:</strong> {recipe.course || "Not specified"}
        </p>
        <p>
          <strong>Diet:</strong> {recipe.diet || "Not specified"}
        </p>
        <p>
          <strong>Prep Time:</strong> {recipe.prep_time || "Not specified"}
        </p>
      </div>
    </div>
  );
};

const RecipeDetail = ({ id }) => {
  // The RecipeDetail component remains unchanged
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the specific recipe by ID
    const fetchRecipe = async () => {
      try {
        setLoading(true);

        // Get the recipe document
        const recipeDoc = await getDoc(doc(db, "recipes", id));

        if (recipeDoc.exists()) {
          setRecipe({ id: recipeDoc.id, ...recipeDoc.data() });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching recipe:", error);
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  if (loading) {
    return <div className="text-center py-8">Loading recipe details...</div>;
  }

  if (!recipe) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-bold mb-4">Recipe not found</h2>
        <Link to="/" className="text-blue-500 hover:text-blue-700">
          &larr; Return to recipe list
        </Link>
      </div>
    );
  }

  // Process ingredients into an array for better display
  const ingredientsList = recipe.ingredients ? (
    recipe.ingredients.split(",").map((item, index) => (
      <li key={index} className="py-1">
        {item.trim()}
      </li>
    ))
  ) : (
    <li>No ingredients listed</li>
  );

  // Process instructions into steps
  const instructionsList = recipe.instructions ? (
    recipe.instructions
      .split(".")
      .filter((step) => step.trim())
      .map((step, index) => (
        <li key={index} className="py-1 mb-2">
          {step.trim()}.
        </li>
      ))
  ) : (
    <li>No instructions available</li>
  );

  const titleColor =
    recipe.diet?.toLowerCase() === "vegetarian"
      ? "text-green-600"
      : "text-red-600";

  return (
    <div className="recipe-detail">
      <Link
        to="/recipe"
        className="text-blue-500 hover:text-blue-700 mb-6 inline-block"
      >
        &larr; Back to recipes
      </Link>

      <div className="mb-6">
        {/* Apply dynamic color to the title */}
        <h2 className={`text-3xl font-bold mb-4 ${titleColor}`}>
          {recipe.title || "Untitled Recipe"}
        </h2>

        {recipe.image_url && (
          <div className="mb-6 max-w-2xl mx-auto">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full rounded-lg shadow-md"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/api/placeholder/600/400";
              }}
            />
          </div>
        )}

        {recipe.description && (
          <p className="text-gray-700 mb-6 max-w-3xl">{recipe.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className={`text-xl font-semibold mb-3 ${titleColor}`}>
              Details
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <p>
                <strong>Cuisine:</strong> {recipe.cuisine || "Not specified"}
              </p>
              <p>
                <strong>Course:</strong> {recipe.course || "Not specified"}
              </p>
              <p>
                <strong>Diet:</strong> {recipe.diet || "Not specified"}
              </p>
              <p>
                <strong>Prep Time:</strong>{" "}
                {recipe.prep_time || "Not specified"}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className={`text-xl font-semibold mb-3 ${titleColor}`}>
              Ingredients
            </h3>
            <ul className="list-disc pl-5 space-y-1">{ingredientsList}</ul>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className={`text-xl font-semibold mb-3 ${titleColor}`}>
            Instructions
          </h3>
          <ol className="list-decimal pl-5 space-y-2">{instructionsList}</ol>
        </div>
      </div>
    </div>
  );
};

export default RecipeFinder;
