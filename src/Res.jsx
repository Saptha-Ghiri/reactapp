import React, { useState, useEffect } from "react";

const SouthIndianKitchen = () => {
  const [gameMode, setGameMode] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [message, setMessage] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState({});
  const [currentOrder, setCurrentOrder] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [draggedIngredient, setDraggedIngredient] = useState(null);
  const [bowlContents, setBowlContents] = useState([]);
  const [cookingStage, setCookingStage] = useState("prep");
  const [tutorialStep, setTutorialStep] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState("beginner");
  const [timeMultiplier, setTimeMultiplier] = useState(1);
  const [mistakes, setMistakes] = useState(0);

  const recipes = {
    "Masala Dosa": {
      servingsPerPerson: {
        dosa_batter: {
          amount: 120,
          unit: "ml",
          icon: "🥞",
          tip: "Ferment for 8 hours"
        },
        potato_masala: {
          amount: 80,
          unit: "g",
          icon: "🥔",
          tip: "Mash while hot"
        },
        onions: {
          amount: 30,
          unit: "g",
          icon: "🧅",
          tip: "Finely chop"
        },
        coconut_chutney: {
          amount: 40,
          unit: "ml",
          icon: "🥥",
          tip: "Grind with green chilies"
        }
      },
      cookingTime: 15,
      description: "Crispy fermented crepe with spiced potato filling",
      cookingSteps: [
        "Heat griddle to high temperature",
        "Spread batter in circular motion",
        "Add oil around edges",
        "Place potato masala in center",
        "Fold and serve hot with chutneys"
      ],
      spiceLevel: "🌶️🌶️",
      difficulty: "Beginner"
    },
    "Rasam": {
      servingsPerPerson: {
        toor_dal: {
          amount: 30,
          unit: "g",
          icon: "🟡",
          tip: "Cook until soft"
        },
        tomatoes: {
          amount: 50,
          unit: "g",
          icon: "🍅",
          tip: "Ripe tomatoes"
        },
        rasam_powder: {
          amount: 10,
          unit: "g",
          icon: "🌶️",
          tip: "Homemade preferred"
        },
        tamarind: {
          amount: 5,
          unit: "g",
          icon: "🟤",
          tip: "Soak in warm water"
        }
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
      spiceLevel: "🌶️",
      difficulty: "Beginner"
    },
    "Chettinad Chicken": {
      servingsPerPerson: {
        chicken: {
          amount: 200,
          unit: "g",
          icon: "🍗",
          tip: "Cut into medium pieces"
        },
        onions: {
          amount: 100,
          unit: "g",
          icon: "🧅",
          tip: "Finely sliced"
        },
        tomatoes: {
          amount: 100,
          unit: "g",
          icon: "🍅",
          tip: "Chopped"
        },
        chettinad_masala: {
          amount: 15,
          unit: "g",
          icon: "🌶️",
          tip: "Roast and grind spices"
        }
      },
      cookingTime: 40,
      description: "Spicy chicken curry with aromatic spices",
      cookingSteps: [
        "Marinate chicken with spices",
        "Saute onions until golden",
        "Add tomatoes and cook till soft",
        "Add marinated chicken",
        "Simmer until cooked"
      ],
      spiceLevel: "🌶️🌶️🌶️",
      difficulty: "Intermediate"
    }
  };

  const difficultySettings = {
    beginner: {
      timeMultiplier: 1.2,
      maxGuests: 2,
      roundCount: 3,
      allowedMistakes: 3,
      tips: true
    },
    intermediate: {
      timeMultiplier: 1,
      maxGuests: 4,
      roundCount: 4,
      allowedMistakes: 2,
      tips: true
    },
    expert: {
      timeMultiplier: 0.8,
      maxGuests: 6,
      roundCount: 5,
      allowedMistakes: 1,
      tips: false
    }
  };

  const tutorialSteps = [
    {
      title: "Welcome to South Indian Kitchen! 👋",
      content: "Learn to cook authentic South Indian dishes while managing portions and avoiding waste."
    },
    {
      title: "Choose Your Mode 🎮",
      content: "Home Kitchen: Cook for 4 people\nRestaurant: Handle varying orders of 1-3 people"
    },
    {
      title: "Cooking Basics 🧑‍🍳",
      content: "1. Drag ingredients to the cooking bowl\n2. Follow recipe proportions carefully\n3. Start cooking when ready"
    },
    {
      title: "Scoring System ⭐",
      content: "Get points for:\n- Correct portions\n- Minimal waste\n- Following cooking times"
    }
  ];

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

  const generateOrder = () => {
    // Create a filtered list of recipes based on difficulty
    const availableRecipes = Object.entries(recipes).filter(([_, recipe]) => {
      switch (difficultyLevel) {
        case "beginner":
          return recipe.difficulty === "Beginner";
        case "intermediate":
          return ["Beginner", "Intermediate"].includes(recipe.difficulty);
        case "expert":
          return true;
        default:
          return true;
      }
    });

    if (availableRecipes.length === 0) {
      console.warn("No recipes match difficulty level, using all recipes");
      availableRecipes.push(...Object.entries(recipes));
    }

    // Use a more robust random selection method
    const randomIndex = Math.floor(Math.random() * availableRecipes.length);
    const [recipeName] = availableRecipes[randomIndex];

    // Generate random number of guests based on game mode and difficulty
    const maxGuests = gameMode === "home" ? 4 : difficultySettings[difficultyLevel].maxGuests;
    const guests = gameMode === "home" ? 4 : Math.max(1, Math.floor(Math.random() * maxGuests) + 1);

    return {
      recipe: recipeName,
      guests: guests
    };
  };
  
  const startGame = (mode) => {
    setGameMode(mode);
    setGameStarted(true);
    setScore(0);
    setCurrentRound(1);
    setMistakes(0);
    resetCooking();
    const newOrder = generateOrder();
    setCurrentOrder(newOrder);
    setTimeMultiplier(difficultySettings[difficultyLevel].timeMultiplier);
  };

  const resetCooking = () => {
    setSelectedIngredients({});
    setBowlContents([]);
    setCookingStage("prep");
    setTimer(0);
    setIsTimerRunning(false);
    setMessage("");
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
        [draggedIngredient.name]: (prev[draggedIngredient.name] || 0) + draggedIngredient.amount
      }));
    }
  };

  const startCooking = () => {
    if (cookingStage !== "prep") return;
    
    setCookingStage("cooking");
    const recipe = recipes[currentOrder.recipe];
    const adjustedTime = Math.floor(recipe.cookingTime * timeMultiplier);
    setTimer(adjustedTime);
    setIsTimerRunning(true);
  };

  const checkCooking = () => {
    if (!currentOrder) return;

    const recipe = recipes[currentOrder.recipe];
    const requiredGuests = currentOrder.guests;
    let correct = true;
    let wastage = 0;

    Object.entries(recipe.servingsPerPerson).forEach(([ingredient, details]) => {
      const requiredAmount = details.amount * requiredGuests;
      const selectedAmount = selectedIngredients[ingredient] || 0;
      wastage += Math.max(0, selectedAmount - requiredAmount);
      
      if (Math.abs(selectedAmount - requiredAmount) > (requiredAmount * 0.1)) {
        correct = false;
      }
    });

    setCookingStage("serving");
    
    if (correct) {
      setScore((prev) => prev + 1);
      setMessage(`Perfect! Your ${currentOrder.recipe} is ready! ${wastage > 0 ? `Waste: ${wastage}${wastage > 100 ? "g" : "ml"}` : "No waste!"} 🎉`);
    } else {
      setMistakes((prev) => prev + 1);
      setMessage(`Not quite right. Food wasted: ${wastage}${wastage > 100 ? "g" : "ml"}. Keep practicing! 📝`);
      
      if (mistakes + 1 >= difficultySettings[difficultyLevel].allowedMistakes) {
        endGame();
        return;
      }
    }

    // Prepare next round
    setTimeout(() => {
      if (currentRound < difficultySettings[difficultyLevel].roundCount) {
        setCurrentRound((prev) => prev + 1);
        resetCooking();
        setCurrentOrder(generateOrder());
      } else {
        endGame();
      }
    }, 3000);
  };

  const endGame = () => {
    setGameStarted(false);
    setMessage(`Game Over! Final Score: ${score}/${difficultySettings[difficultyLevel].roundCount} 🏆`);
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
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">
                  {tutorialSteps[tutorialStep].title}
                </h2>
                <p className="whitespace-pre-line">
                  {tutorialSteps[tutorialStep].content}
                </p>
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))}
                    className="bg-gray-200 px-4 py-2 rounded"
                    disabled={tutorialStep === 0}
                  >
                    ⬅️ Previous
                  </button>
                  {tutorialStep < tutorialSteps.length - 1 ? (
                    <button
                      onClick={() => setTutorialStep(tutorialStep + 1)}
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      Next ➡️
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowTutorial(false)}
                      className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                      Start Playing! 🎮
                    </button>
                  )}
                </div>
              </Card>
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

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => startGame("home")}
                    className="bg-orange-100 hover:bg-orange-200 p-4 rounded-lg"
                  >
                    🏠 Home Kitchen
                    <br />
                    <small>Cook for family of 4</small>
                  </button>
                  <button
                   onClick={() => startGame("restaurant")}
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
             <span>Round: {currentRound}/{difficultySettings[difficultyLevel].roundCount} 🎮</span>
             <span>Score: {score} ⭐</span>
             <span>Mistakes: {mistakes}/{difficultySettings[difficultyLevel].allowedMistakes} ❌</span>
             {timer > 0 && <span>Time: {timer}s ⏲️</span>}
           </div>

           {currentOrder && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="recipe-info bg-yellow-50 p-4 rounded">
                 <h3 className="font-bold">📋 Current Order</h3>
                 <p>{currentOrder.recipe}</p>
                 <p>For {currentOrder.guests} people</p>
                 <p>Spice Level: {recipes[currentOrder.recipe].spiceLevel}</p>
                 <div className="mt-2">
                   <h4 className="font-bold">Steps:</h4>
                   {recipes[currentOrder.recipe].cookingSteps.map((step, i) => (
                     <p key={i} className="text-sm">➡️ {step}</p>
                   ))}
                 </div>
                 {difficultySettings[difficultyLevel].tips && (
                   <div className="mt-2 text-sm bg-blue-50 p-2 rounded">
                     <p className="font-bold">💡 Tips:</p>
                     {Object.entries(recipes[currentOrder.recipe].servingsPerPerson).map(
                       ([name, details]) => (
                         <p key={name}>• {details.tip}</p>
                       )
                     )}
                   </div>
                 )}
               </div>

               <div
                 className="cooking-area bg-orange-50 p-4 rounded"
                 onDragOver={(e) => e.preventDefault()}
                 onDrop={handleDrop}
               >
                 <h3 className="font-bold">🍳 Cooking Area</h3>
                 <div className="grid grid-cols-3 gap-2 mt-2">
                   {Object.entries(recipes[currentOrder.recipe].servingsPerPerson).map(
                     ([name, details]) => (
                       <div
                         key={name}
                         draggable={cookingStage === "prep"}
                         onDragStart={(e) => handleDragStart(e, name, details.amount)}
                         className="bg-white p-2 rounded text-center cursor-move"
                       >
                         <span className="text-2xl">{details.icon}</span>
                         <p className="text-sm">{name.replace("_", " ")}</p>
                         <small>
                           {details.amount}
                           {details.unit}/person
                         </small>
                       </div>
                     )
                   )}
                 </div>
               </div>
             </div>
           )}

           <div className="preparation-bowl bg-white p-4 rounded border-2 border-dashed">
             <h3 className="font-bold">🥘 Preparation Bowl</h3>
             <div className="grid grid-cols-4 gap-2 mt-2">
               {bowlContents.map((item, i) => (
                 <div key={i} className="bg-gray-100 p-2 rounded text-center">
                   <span>
                     {recipes[currentOrder.recipe].servingsPerPerson[item.name].icon}
                   </span>
                   <small>
                     {item.amount}
                     {recipes[currentOrder.recipe].servingsPerPerson[item.name].unit}
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

export default SouthIndianKitchen;