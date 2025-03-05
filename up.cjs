// Import Firebase dependencies
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, writeBatch, doc } = require('firebase/firestore');
const fs = require('fs');
const csv = require('csv-parser');

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCYPxyGG-kCwxuMA7nBcWps9uvYTnjC7mQ",
    authDomain: "predict-sih.firebaseapp.com",
    databaseURL: "https://predict-sih-default-rtdb.firebaseio.com",
    projectId: "predict-sih",
    storageBucket: "predict-sih.appspot.com",
    messagingSenderId: "873669825752",
    appId: "1:873669825752:web:a50e17a51039ddb1e8f3ad",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to parse CSV data
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(`Parsed ${results.length} recipes from CSV`);
        resolve(results);
      })
      .on('error', (error) => reject(error));
  });
}

// Function to clean and format recipe data
function formatRecipe(recipe, index) {
  // Process ingredients and instructions into clean formats
  const ingredients = recipe.ingredients ? recipe.ingredients.trim().split(/\s+/).join(' ') : '';
  
  return {
    id: index + 1, // Generate unique ID (or use existing ID if available)
    title: recipe.name || '',
    image_url: recipe.image_url || '',
    description: recipe.description || '',
    cuisine: recipe.cuisine || '',
    course: recipe.course || '',
    diet: recipe.diet || '',
    prep_time: recipe.prep_time || '',
    ingredients: ingredients,
    instructions: recipe.instructions || '',
    // Add searchableKeywords field for better search functionality
    searchableKeywords: createSearchableKeywords(recipe),
    // Add timestamp
    createdAt: new Date()
  };
}

// Create searchable keywords from recipe data
function createSearchableKeywords(recipe) {
  const searchableFields = [
    recipe.name,
    recipe.description,
    recipe.cuisine,
    recipe.course,
    recipe.diet,
    recipe.ingredients
  ];
  
  // Combine all fields, lowercase, split into words, and remove duplicates
  const allWords = searchableFields
    .filter(field => field) // Remove empty fields
    .join(' ')
    .toLowerCase()
    .split(/[\s,.-]+/) // Split on spaces, commas, periods, hyphens
    .filter(word => word.length > 2) // Only include words with 3+ chars
    .filter((word, index, self) => self.indexOf(word) === index); // Remove duplicates
    
  return allWords;
}

// Upload recipes to Firestore
async function uploadRecipes(recipes) {
  console.log(`Starting upload of ${recipes.length} recipes to Firestore...`);
  
  // Use batched writes for better performance
  const batchSize = 500; // Firestore allows up to 500 operations per batch
  
  for (let i = 0; i < recipes.length; i += batchSize) {
    const batch = writeBatch(db);
    const batchRecipes = recipes.slice(i, i + batchSize);
    
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1}: ${batchRecipes.length} recipes`);
    
    batchRecipes.forEach((recipe) => {
      const recipeRef = doc(collection(db, 'recipes'));
      batch.set(recipeRef, recipe);
    });
    
    await batch.commit();
    console.log(`Batch ${Math.floor(i/batchSize) + 1} committed successfully`);
  }
  
  console.log('All recipes uploaded successfully!');
}

// Main function to run the script
async function main() {
  try {
    // Path to your CSV file
    const csvPath = './recipe.xlsx';
    
    // Parse CSV data
    const rawRecipes = await parseCSV(csvPath);
    
    // Format recipes
    const formattedRecipes = rawRecipes.map((recipe, index) => formatRecipe(recipe, index));
    
    // Upload to Firestore
    await uploadRecipes(formattedRecipes);
    
    console.log('Process completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
main();