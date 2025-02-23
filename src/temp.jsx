import React, { useState, useEffect } from "react";

const Res = () => {
  // ... [previous state variables remain the same]
  const [difficultyLevel, setDifficultyLevel] = useState("beginner");
  const [timeMultiplier, setTimeMultiplier] = useState(1);

  const recipes = {
    "Hyderabadi Biryani": {
      // ... [previous recipe remains the same]
    },
    "Masala Dosa": {
      // ... [previous recipe remains the same]
    },
    "Idli Sambar": {
      // ... [previous recipe remains the same]
    },
    "Pongal": {
      // ... [previous recipe remains the same]
    },
    "Chettinad Chicken Curry": {
      servingsPerPerson: {
        chicken: { amount: 200, unit: "g", icon: "🍗", tip: "Cut into medium pieces" },
        onions: { amount: 100, unit: "g", icon: "🧅", tip: "Finely sliced" },
        tomatoes: { amount: 100, unit: "g", icon: "🍅", tip: "Chopped" },
        coconut: { amount: 50, unit: "g", icon: "🥥", tip: "Freshly grated" },
        chettinad_masala: { amount: 15, unit: "g", icon: "🌶️", tip: "Roast and grind spices" },
        curry_leaves: { amount: 5, unit: "g", icon: "🌿", tip: "Use fresh leaves" },
        oil: { amount: 30, unit: "ml", icon: "🫗", tip: "Use sesame oil" }
      },
      cookingTime: 40,
      description: "Spicy chicken curry with aromatic spices",
      cookingSteps: [
        "Marinate chicken with spices",
        "Saute onions until golden",
        "Add tomatoes and cook till soft",
        "Add marinated chicken",
        "Simmer with coconut paste",
        "Garnish with curry leaves"
      ],
      spiceLevel: "🌶️🌶️🌶️🌶️",
      difficulty: "Advanced"
    },
    "Mysore Pak": {
      servingsPerPerson: {
        besan: { amount: 100, unit: "g", icon: "🟡", tip: "Sift well" },
        ghee: { amount: 150, unit: "ml", icon: "🫕", tip: "Use pure ghee" },
        sugar: { amount: 100, unit: "g", icon: "🧂", tip: "Powdered sugar works best" },
        cardamom: { amount: 2, unit: "g", icon: "🌱", tip: "Freshly powdered" }
      },
      cookingTime: 25,
      description: "Traditional ghee-based sweet",
      cookingSteps: [
        "Heat ghee till medium hot",
        "Roast besan till aromatic",
        "Make sugar syrup",
        "Mix and cook till right consistency",
        "Set in greased tray"
      ],
      spiceLevel: "No spice",
      difficulty: "Expert"
    },
    "Rasam": {
      servingsPerPerson: {
        toor_dal: { amount: 30, unit: "g", icon: "🟡", tip: "Cook until soft" },
        tomatoes: { amount: 50, unit: "g", icon: "🍅", tip: "Ripe tomatoes" },
        rasam_powder: { amount: 10, unit: "g", icon: "🌶️", tip: "Homemade preferred" },
        tamarind: { amount: 5, unit: "g", icon: "🟤", tip: "Soak in warm water" },
        garlic: { amount: 5, unit: "g", icon: "🧄", tip: "Crush with skin" },
        curry_leaves: { amount: 2, unit: "g", icon: "🌿", tip: "Fresh leaves only" }
      },
      cookingTime: 20,
      description: "Tangy and spicy soup",
      cookingSteps: [
        "Extract tamarind juice",
        "Cook tomatoes till soft",
        "Add rasam powder",
        "Simmer with spices",
        "Temper with curry leaves"
      ],
      spiceLevel: "🌶️🌶️",
      difficulty: "Intermediate"
    }
  };

  const difficultySettings = {
    beginner: {
      timeMultiplier: 1,
      maxGuests: 2,
      roundCount: 3,
      allowedMistakes: 2,
      tips: true
    },
    intermediate: {
      timeMultiplier: 0.8,
      maxGuests: 4,
      roundCount: 4,
      allowedMistakes: 1,
      tips: true
    },
    expert: {
      timeMultiplier: 0.6,
      maxGuests: 6,
      roundCount: 5,
      allowedMistakes: 0,
      tips: false
    }
  };

  const startGame = (mode, difficulty) => {
    setGameMode(mode);
    setDifficultyLevel(difficulty);
    setTimeMultiplier(difficultySettings[difficulty].timeMultiplier);
    setGameStarted(true);
    setScore(0);
    setCurrentRound(1);
    resetCooking();
    const newOrder = generateOrder(difficulty);
    setCurrentOrder(newOrder);
  };

  const generateOrder = (difficulty) => {
    const recipeNames = Object.keys(recipes).filter(recipeName => {
      const recipe = recipes[recipeName];
      switch(difficulty) {
        case 'beginner':
          return recipe.difficulty === 'Beginner';
        case 'intermediate':
          return recipe.difficulty === 'Beginner' || recipe.difficulty === 'Intermediate';
        case 'expert':
          return true;
        default:
          return true;
      }
    });
    
    const randomRecipe = recipeNames[Math.floor(Math.random() * recipeNames.length)];
    const maxGuests = difficultySettings[difficulty].maxGuests;
    const guests = gameMode === "home" ? 4 : Math.floor(Math.random() * maxGuests) + 1;
    
    return { recipe: randomRecipe, guests };
  };

  useEffect(() => {
    let interval;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      checkCooking();
    }
    return () => clearInterval(interval);
  }, [timer, isTimerRunning]);

  const startGame = (mode) => {
    setGameMode(mode);
    setGameStarted(true);
    setScore(0);
    setCurrentRound(1);
    resetCooking();
    const newOrder = generateOrder();
    setCurrentOrder(newOrder);
  };

  const resetCooking = () => {
    setSelectedIngredients({});
    setBowlContents([]);
    setCookingStage("prep");
    setTimer(0);
    setIsTimerRunning(false);
  };

  const generateOrder = () => {
    const recipeNames = Object.keys(recipes);
    const randomRecipe =
      recipeNames[Math.floor(Math.random() * recipeNames.length)];
    const guests = gameMode === "home" ? 4 : Math.floor(Math.random() * 3) + 1;
    return { recipe: randomRecipe, guests };
  };

  const handleDragStart = (e, ingredient, amount) => {
    setDraggedIngredient({ name: ingredient, amount });
    e.dataTransfer.setData("text/plain", ingredient);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedIngredient && cookingStage === "prep") {
      setBowlContents((prev) => [...prev, draggedIngredient]);
      setSelectedIngredients((prev) => ({
        ...prev,
        [draggedIngredient.name]:
          (prev[draggedIngredient.name] || 0) + draggedIngredient.amount,
      }));
    }
  };

  const startCooking = () => {
    setCookingStage("cooking");
    setTimer(recipes[currentOrder.recipe].cookingTime);
    setIsTimerRunning(true);
  };

  const checkCooking = () => {
    const recipe = recipes[currentOrder.recipe];
    const requiredGuests = currentOrder.guests;
    let correct = true;
    let wastage = 0;

    Object.entries(recipe.servingsPerPerson).forEach(
      ([ingredient, details]) => {
        const requiredAmount = details.amount * requiredGuests;
        const selectedAmount = selectedIngredients[ingredient] || 0;
        wastage += Math.abs(selectedAmount - requiredAmount);
        if (selectedAmount !== requiredAmount) correct = false;
      }
    );

    setCookingStage("serving");
    if (correct) {
      setScore(score + 1);
      setMessage(`Perfect! Your ${currentOrder.recipe} is ready! No waste! 🎉`);
    } else {
      setMessage(
        `Food wasted: ${wastage}${
          wastage > 100 ? "g" : "ml"
        }. Keep practicing! 📝`
      );
    }

    setTimeout(() => {
      if (currentRound < 5) {
        setCurrentRound((curr) => curr + 1);
        resetCooking();
        setCurrentOrder(generateOrder());
      } else {
        setGameStarted(false);
        setMessage(`Game Over! Final Score: ${score}/5 🏆`);
      }
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">
          👩‍🍳 South Indian Kitchen Master 👨‍🍳
        </h1>

        {!gameStarted ? (
          <div className="space-y-4">
            {showTutorial ? (
              // ... [tutorial section remains the same]
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => setShowTutorial(true)}
                  className="bg-yellow-100 hover:bg-yellow-200 p-2 rounded"
                >
                  📖 How to Play
                </button>
                
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Select Difficulty:</h3>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setDifficultyLevel("beginner")}
                      className={`p-2 rounded ${
                        difficultyLevel === "beginner"
                          ? "bg-green-500 text-white"
                          : "bg-green-100"
                      }`}
                    >
                      🌱 Beginner
                    </button>
                    <button
                      onClick={() => setDifficultyLevel("intermediate")}
                      className={`p-2 rounded ${
                        difficultyLevel === "intermediate"
                          ? "bg-yellow-500 text-white"
                          : "bg-yellow-100"
                      }`}
                    >
                      🏃 Intermediate
                    </button>
                    <button
                      onClick={() => setDifficultyLevel("expert")}
                      className={`p-2 rounded ${
                        difficultyLevel === "expert"
                          ? "bg-red-500 text-white"
                          : "bg-red-100"
                      }`}
                    >
                      👨‍🍳 Expert
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 justify-center mt-4">
                  <button
                    onClick={() => startGame("home", difficultyLevel)}
                    className="bg-orange-100 hover:bg-orange-200 p-4 rounded-lg"
                  >
                    🏠 Home Kitchen
                    <br />
                    <small>Cook for family of 4</small>
                  </button>
                  <button
                    onClick={() => startGame("restaurant", difficultyLevel)}
                    className="bg-green-100 hover:bg-green-200 p-4 rounded-lg"
                  >
                    🏪 Restaurant
                    <br />
                    <small>Handle varying orders</small>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
            <div className="game-area space-y-4">
            <div className="flex justify-between bg-gray-100 p-2 rounded">
              <span>Round: {currentRound}/5 🎮</span>
              <span>Score: {score} ⭐</span>
              {timer > 0 && <span>Time: {timer}s ⏲️</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="recipe-info bg-yellow-50 p-4 rounded">
                <h3 className="font-bold">📋 Current Order</h3>
                <p>{currentOrder.recipe}</p>
                <p>For {currentOrder.guests} people</p>
                <p>Spice Level: {recipes[currentOrder.recipe].spiceLevel}</p>
                <div className="mt-2">
                  <h4 className="font-bold">Steps:</h4>
                  {recipes[currentOrder.recipe].cookingSteps.map((step, i) => (
                    <p key={i}>➡️ {step}</p>
                  ))}
                </div>
              </div>

              <div
                className="cooking-area bg-orange-50 p-4 rounded"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <h3 className="font-bold">🍳 Cooking Area</h3>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {Object.entries(
                    recipes[currentOrder.recipe].servingsPerPerson
                  ).map(([name, details]) => (
                    <div
                      key={name}
                      draggable={cookingStage === "prep"}
                      onDragStart={(e) =>
                        handleDragStart(e, name, details.amount)
                      }
                      className="bg-white p-2 rounded text-center cursor-move"
                    >
                      <span className="text-2xl">{details.icon}</span>
                      <p className="text-sm">{name.replace("_", " ")}</p>
                      <small>
                        {details.amount}
                        {details.unit}/person
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="preparation-bowl bg-white p-4 rounded border-2 border-dashed">
              <h3 className="font-bold">🥘 Preparation Bowl</h3>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {bowlContents.map((item, i) => (
                  <div key={i} className="bg-gray-100 p-2 rounded text-center">
                    <span>
                      {
                        recipes[currentOrder.recipe].servingsPerPerson[
                          item.name
                        ].icon
                      }
                    </span>
                    <small>
                      {item.amount}
                      {
                        recipes[currentOrder.recipe].servingsPerPerson[
                          item.name
                        ].unit
                      }
                    </small>
                  </div>
                ))}
              </div>
            </div>

            {cookingStage === "prep" && bowlContents.length > 0 && (
              <button
                onClick={startCooking}
                className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
              >
                🔥 Start Cooking!
              </button>
            )}

            {message && (
              <div
                className={`p-4 rounded text-center ${
                  message.includes("Perfect") ? "bg-green-100" : "bg-yellow-100"
                }`}
              >
                {message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Res;