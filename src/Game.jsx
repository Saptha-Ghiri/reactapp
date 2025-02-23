import React, { useState, useEffect } from "react";
import { Star, Timer, Trophy, RefreshCw, Brain, Award } from "lucide-react";

const Game = () => {
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [basketItems, setBasketItems] = useState([]);
  const [fridgeItems, setFridgeItems] = useState([]);
  const [kitchenItems, setKitchenItems] = useState([]);
  const [gameComplete, setGameComplete] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");
  const [level, setLevel] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [gameStats, setGameStats] = useState({
    correctItems: [],
    incorrectAttempts: [],
    timeRemaining: 0,
    totalAttempts: 0,
  });

  const foodItems = {
    indian_basic: [
      {
        id: 1,
        name: "Garam Masala",
        correct: "kitchen",
        tip: "Store in airtight container away from light",
        emoji: "🌶️",
        color: "#8B4513",
      },
      {
        id: 2,
        name: "Ghee",
        correct: "kitchen",
        tip: "Stable at room temperature in airtight container",
        emoji: "🧈",
        color: "#FFD700",
      },
      {
        id: 3,
        name: "Fresh Paneer",
        correct: "fridge",
        tip: "Keep refrigerated, use within a week",
        emoji: "🧀",
        color: "#FFFFFF",
      },
      {
        id: 4,
        name: "Turmeric Powder",
        correct: "kitchen",
        tip: "Store in dark, cool place",
        emoji: "🧂",
        color: "#FFA500",
      },
      {
        id: 5,
        name: "Green Chilies",
        correct: "fridge",
        tip: "Keep refrigerated in paper bag",
        emoji: "🌶️",
        color: "#008000",
      },
    ],
    indian_intermediate: [
      {
        id: 6,
        name: "Idli Batter",
        correct: "fridge",
        tip: "Must be refrigerated to prevent over-fermentation",
        emoji: "🥟",
        color: "#FFFFFF",
      },
      {
        id: 7,
        name: "Curry Leaves",
        correct: "fridge",
        tip: "Wrap in paper towel and refrigerate",
        emoji: "🌿",
        color: "#228B22",
      },
      {
        id: 8,
        name: "Tamarind Paste",
        correct: "fridge",
        tip: "Refrigerate after opening",
        emoji: "🥫",
        color: "#8B4513",
      },
      {
        id: 9,
        name: "Coconut Chutney",
        correct: "fridge",
        tip: "Keep refrigerated, use within 3-4 days",
        emoji: "🥥",
        color: "#FFFFFF",
      },
      {
        id: 10,
        name: "Methi Leaves",
        correct: "fridge",
        tip: "Store in paper towel and refrigerate",
        emoji: "🌱",
        color: "#228B22",
      },
    ],
    indian_advanced: [
      {
        id: 11,
        name: "Dosa Batter",
        correct: "fridge",
        tip: "Refrigerate to control fermentation",
        emoji: "🥞",
        color: "#FFE4B5",
      },
      {
        id: 12,
        name: "Fresh Coriander",
        correct: "fridge",
        tip: "Store in water like flowers, cover with plastic",
        emoji: "🌿",
        color: "#90EE90",
      },
      {
        id: 13,
        name: "Gunpowder",
        correct: "kitchen",
        tip: "Store in airtight container, away from moisture",
        emoji: "🧂",
        color: "#CD853F",
      },
      {
        id: 14,
        name: "Pickle",
        correct: "kitchen",
        tip: "Store in dry place, use clean spoon",
        emoji: "🥒",
        color: "#FFB6C1",
      },
      {
        id: 15,
        name: "Dried Red Chilies",
        correct: "kitchen",
        tip: "Store in airtight container in dark place",
        emoji: "🌶️",
        color: "#DC143C",
      },
    ],
    indian_expert: [
      {
        id: 16,
        name: "Khoya",
        correct: "fridge",
        tip: "Must be refrigerated to prevent spoilage",
        emoji: "🥛",
        color: "#FFFAF0",
      },
      {
        id: 17,
        name: "Fresh Curry Paste",
        correct: "fridge",
        tip: "Refrigerate to maintain freshness",
        emoji: "🥄",
        color: "#32CD32",
      },
      {
        id: 18,
        name: "Kokum",
        correct: "kitchen",
        tip: "Store in airtight container in cool place",
        emoji: "🫐",
        color: "#800080",
      },
      {
        id: 19,
        name: "Kanji",
        correct: "fridge",
        tip: "Refrigerate after fermentation",
        emoji: "🥤",
        color: "#FF4500",
      },
      {
        id: 20,
        name: "Fresh Ginger Paste",
        correct: "fridge",
        tip: "Refrigerate to maintain potency",
        emoji: "🧄",
        color: "#DEB887",
      },
    ],
    indian_specialty: [
      {
        id: 21,
        name: "Kewra Water",
        correct: "kitchen",
        tip: "Store in cool, dark place",
        emoji: "💧",
        color: "#E6E6FA",
      },
      {
        id: 22,
        name: "Fresh Malai",
        correct: "fridge",
        tip: "Must be refrigerated",
        emoji: "🥛",
        color: "#FFFFF0",
      },
      {
        id: 23,
        name: "Bamboo Shoots",
        correct: "fridge",
        tip: "Refrigerate after opening",
        emoji: "🎋",
        color: "#F5DEB3",
      },
      {
        id: 24,
        name: "Curry Leaves Powder",
        correct: "kitchen",
        tip: "Store in airtight container",
        emoji: "🌿",
        color: "#556B2F",
      },
      {
        id: 25,
        name: "Fresh Lotus Stems",
        correct: "fridge",
        tip: "Wrap in wet cloth and refrigerate",
        emoji: "🌸",
        color: "#DDA0DD",
      },
    ],
  };

  const difficultySettings = {
    easy: { time: 60, items: 5, levels: ["indian_basic"] },
    medium: {
      time: 50,
      items: 8,
      levels: ["indian_basic", "indian_intermediate"],
    },
    hard: {
      time: 40,
      items: 12,
      levels: ["indian_basic", "indian_intermediate", "indian_advanced"],
    },
    expert: {
      time: 30,
      items: 15,
      levels: [
        "indian_basic",
        "indian_intermediate",
        "indian_advanced",
        "indian_expert",
        "indian_specialty",
      ],
    },
  };

  useEffect(() => {
    let interval;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      handleGameOver();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const handleGameOver = () => {
    setGameComplete(true);
    setIsTimerRunning(false);
    if (score > bestStreak) {
      setBestStreak(score);
    }

    setGameStats({
      correctItems: [...fridgeItems, ...kitchenItems],
      incorrectAttempts: attempts - score,
      timeRemaining: timer,
      totalAttempts: attempts,
    });

    setShowResults(true);
  };

  const selectDifficulty = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setLevel(1);
  };

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setAttempts(0);
    setGameComplete(false);

    let availableItems = [];
    difficultySettings[difficulty].levels.forEach((level) => {
      availableItems = [...availableItems, ...foodItems[level]];
    });

    const shuffledItems = [...availableItems]
      .sort(() => Math.random() - 0.5)
      .slice(0, difficultySettings[difficulty].items);

    setBasketItems(shuffledItems);
    setFridgeItems([]);
    setKitchenItems([]);
    setMessage("");
    setTimer(difficultySettings[difficulty].time);
    setIsTimerRunning(true);
    setStreak(0);
    setShowHint(false);
    setShowResults(false);
  };

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData("text/plain", JSON.stringify(item));
    e.target.classList.add("dragging");
    setShowHint(false);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove("dragging");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };

  const handleDrop = (e, location) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const item = JSON.parse(e.dataTransfer.getData("text/plain"));

    setAttempts((prev) => prev + 1);

    if (item.correct === location) {
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      if (streak + 1 > bestStreak) {
        setBestStreak(streak + 1);
      }
      setMessage(`✨ Correct! ${item.tip}`);
      setBasketItems((prev) => prev.filter((i) => i.id !== item.id));
      if (location === "fridge") {
        setFridgeItems((prev) => [...prev, item]);
      } else {
        setKitchenItems((prev) => [...prev, item]);
      }
    } else {
      setStreak(0);
      setMessage(`❌ Incorrect. ${item.tip}`);
      const element = document.getElementById(`item-${item.id}`);
      if (element) {
        element.classList.add("return-to-basket");
        setTimeout(() => {
          element.classList.remove("return-to-basket");
        }, 500);
      }
    }

    if (basketItems.length === 1) {
      handleGameOver();
    }
  };

  const ResultsPage = () => (
    <div className="results-container bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-6">
        🎉 Storage Master Results 🎉
      </h2>

      <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card bg-blue-50 p-4 rounded-lg text-center">
          <h3 className="text-lg font-semibold">Score</h3>
          <p className="text-3xl font-bold text-blue-600">
            {score}/{basketItems.length + score}
          </p>
        </div>
        <div className="stat-card bg-green-50 p-4 rounded-lg text-center">
          <h3 className="text-lg font-semibold">Accuracy</h3>
          <p className="text-3xl font-bold text-green-600">
            {Math.round((score / attempts) * 100 || 0)}%
          </p>
        </div>
        <div className="stat-card bg-purple-50 p-4 rounded-lg text-center">
          <h3 className="text-lg font-semibold">Time Left</h3>
          <p className="text-3xl font-bold text-purple-600">
            {gameStats.timeRemaining}s
          </p>
        </div>
        <div className="stat-card bg-yellow-50 p-4 rounded-lg text-center">
          <h3 className="text-lg font-semibold">Best Streak</h3>
          <p className="text-3xl font-bold text-yellow-600">{bestStreak}</p>
        </div>
      </div>

      <div className="results-details mb-8">
        <h3 className="text-2xl font-bold mb-4">Correctly Stored Items</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gameStats.correctItems.map((item) => (
            <div
              key={item.id}
              className="item-card p-3 rounded-lg text-center"
              style={{
                backgroundColor: item.color,
                boxShadow: `0 2px 4px ${item.color}40`,
              }}
            >
              <span className="text-2xl">{item.emoji}</span>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm opacity-75">{item.correct}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="achievements mb-8">
        <h3 className="text-2xl font-bold mb-4">Achievements Earned</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {score === basketItems.length + score && (
            <div className="achievement bg-yellow-50 p-4 rounded-lg flex items-center gap-2">
              <Award className="text-yellow-500" />
              <span>Perfect Score!</span>
            </div>
          )}
          {gameStats.timeRemaining >
            difficultySettings[difficulty].time / 2 && (
            <div className="achievement bg-blue-50 p-4 rounded-lg flex items-center gap-2">
              <Timer className="text-blue-500" />
              <span>Speed Champion</span>
            </div>
          )}
          {bestStreak > 5 && (
            <div className="achievement bg-purple-50 p-4 rounded-lg flex items-center gap-2">
              <Star className="text-purple-500" />
              <span>Storage Expert</span>
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={() => {
            setShowResults(false);
            startGame();
          }}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full text-xl font-bold transform transition hover:scale-105"
        >
          Play Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="game-container bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-xl shadow-xl">
      <div className="game-header text-center mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          🏆 Indian Kitchen Storage Master 🏆
        </h1>
      </div>

      {!gameStarted ? (
        <div className="start-screen text-center p-8 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">
            Choose Your Challenge Level
          </h2>
          <div className="difficulty-selection grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(difficultySettings).map(([diff, settings]) => (
              <button
                key={diff}
                onClick={() => selectDifficulty(diff)}
                className={`p-4 rounded-xl transition-all ${
                  difficulty === diff
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <h3 className="text-lg font-bold capitalize">{diff}</h3>
                <p className="text-sm">{settings.time}s</p>
                <p className="text-sm">{settings.items} items</p>
              </button>
            ))}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Timer className="text-blue-500" />
              <span>
                {difficultySettings[difficulty].time} Second Challenge
              </span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Brain className="text-purple-500" />
              <span>{difficultySettings[difficulty].items} Items to Store</span>
            </div>
          </div>
          <button
            onClick={startGame}
            className="mt-6 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-xl font-bold transform transition hover:scale-105 hover:shadow-lg"
          >
            Start {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}{" "}
            Mode
          </button>
        </div>
      ) : showResults ? (
        <ResultsPage />
      ) : (
        <div className="game-content">
          <div className="stats-board grid grid-cols-4 gap-4 mb-6">
            <div className="stat-card bg-white p-4 rounded-xl shadow-md">
              <div className="flex items-center gap-2">
                <Trophy className="text-yellow-500" />
                <span>
                  Score: {score}/{attempts}
                </span>
              </div>
            </div>
            <div className="stat-card bg-white p-4 rounded-xl shadow-md">
              <div className="flex items-center gap-2">
                <Star className="text-purple-500" />
                <span>Streak: {streak}</span>
              </div>
            </div>
            <div className="stat-card bg-white p-4 rounded-xl shadow-md">
              <div className="flex items-center gap-2">
                <RefreshCw className="text-green-500" />
                <span>Best: {bestStreak}</span>
              </div>
            </div>
            <div className="stat-card bg-white p-4 rounded-xl shadow-md">
              <div className="flex items-center gap-2">
                <Timer className="text-red-500" />
                <span>Time: {timer}s</span>
              </div>
            </div>
          </div>

          <div 
            className="relative min-h-[600px] rounded-xl overflow-hidden bg-contain bg-center bg-no-repeat px-36"
            style={{
              backgroundImage: 'url("/kitchen.png")'
            }}
          >
            <div className="flex">
            <div className="flex flex-col" style={{width:"70%"}}>
            {/* Kitchen Counter - Top Section */}
            <div 
              className="bg-transparent "
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "kitchen")}
            >
              <h3 className="text-2xl font-bold mb-4 text-gray-800">🪴 Kitchen Counter</h3>
              <div className="flex flex-wrap gap-4 mt-32">
                {kitchenItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex-1 min-w-[150px] p-4 rounded-xl text-center transition-all transform hover:scale-105"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 4px 6px ${item.color}40`,
                    }}
                  >
                    <span className="text-3xl">{item.emoji}</span>
                    <p className="font-semibold mt-2">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Storage Area */}
              {/* Basket */}
              <div className="flex-[2] bg-transparent">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">🧺 Food Items</h3>
                <div className="flex flex-wrap gap-4">
                  {basketItems.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragEnd={handleDragEnd}
                      className="w-[calc(33.33%-1rem)] p-4 rounded-xl text-center cursor-move transition-all transform hover:scale-105 bg-white bg-opacity-90"
                      style={{
                        backgroundColor: item.color,
                        boxShadow: `0 4px 6px ${item.color}40`,
                      }}
                    >
                      <span className="text-4xl">{item.emoji}</span>
                      <p className="font-semibold mt-2">{item.name}</p>
                    </div>
                  ))}
                </div>
              </div>
              </div>

              {/* Refrigerator */}
              <div
                className="flex-1 p-6 rounded-xl "
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "fridge")}
              >
                <h3 className="text-2xl font-bold mb-4 text-gray-800">❄️ Refrigerator</h3>
                <div className="flex flex-wrap gap-4">
                  {fridgeItems.map((item) => (
                    <div
                      key={item.id}
                      className="w-[calc(50%-0.5rem)] p-3 rounded-xl text-center bg-white bg-opacity-90"
                      style={{
                        backgroundColor: item.color,
                        boxShadow: `0 4px 6px ${item.color}40`,
                      }}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <p className="font-semibold text-sm mt-1">{item.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>

          {message && (
            <div
              className={`mt-4 p-4 rounded-lg text-center text-lg font-semibold ${
                message.startsWith("✨")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Game;