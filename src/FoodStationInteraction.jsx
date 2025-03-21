import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDatabase, ref as rtdbRef, set, onValue } from "firebase/database";
import { db, storage } from "../firebase/config";
import VirtualKeyboard from "./VirtualKeyboard";

const FoodStationInteraction = () => {
  // State variables
  const [step, setStep] = useState("initial"); // initial, scanning, action-selection, put-food, take-food, confirmation
  const [user, setUser] = useState(null);
  const [foodData, setFoodData] = useState({
    name: "",
    diet: "veg", // Default to veg
    imageUrl: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [selectedRack, setSelectedRack] = useState(null);
  const [station, setStation] = useState(null);
  const [motorStatus, setMotorStatus] = useState("closed");
  const [message, setMessage] = useState("");
  const [sensorData, setSensorData] = useState(null);
  const [foodDetected, setFoodDetected] = useState(false);
  const [checkingForFood, setCheckingForFood] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Constants for ultrasonic thresholds
  const FOOD_PRESENT_THRESHOLD = 15; // If less than this value (cm), food is present
  const FOOD_ABSENT_THRESHOLD = 20; // If greater than this value (cm), food is absent

  // Refs
  const scannerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  //   const { stationId } = useParams();
  const navigate = useNavigate();
  const rtdb = getDatabase();
  const stationId = "Re45sMqVw9VNUCYsULMf"; // Hardcoded for now
  const DISTANCE_THRESHOLD = 10; // Define threshold for food removal detection

  // Fetch station data on mount
  useEffect(() => {
    const fetchStationData = async () => {
      try {
        console.log("Station ID:", stationId); // Debug to see if stationId exists

        if (!stationId) {
          setMessage("No station ID provided");
          return;
        }

        const stationRef = doc(db, "food stations", stationId);
        const stationSnap = await getDoc(stationRef);

        if (stationSnap.exists()) {
          setStation({
            id: stationSnap.id,
            ...stationSnap.data(),
            racks: stationSnap.data().racks || [
              { id: 1, name: "Rack 1", isFilled: false, items: [] },
              { id: 2, name: "Rack 2", isFilled: false, items: [] },
            ],
          });
        } else {
          setMessage("Food station not found");
        }
      } catch (err) {
        console.error("Error fetching station:", err);
        setMessage(`Error: ${err.message}`);
      }
    };

    fetchStationData();

    // Listen to motor status and sensor data from RTDB
    // Updated to read from the specific path you provided
    const sensorDataRef = rtdbRef(rtdb, "adddelete");
    const unsubscribe = onValue(sensorDataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorData({
          gas: data.gas,
          humidity: data.humd,
          temperature: data.temp,
          ultrasonic: data.ultrasonic,
        });

        if (data.motorStatus) {
          setMotorStatus(data.motorStatus);
        }

        // Update station rack data with sensor readings if station exists
        setStation((prevStation) => {
          if (!prevStation) return null;

          const updatedRacks = [...prevStation.racks];
          // Update rack 1 with sensor data
          if (updatedRacks[0]) {
            updatedRacks[0] = {
              ...updatedRacks[0],
              temperature: data.temp,
              gasLevel: data.gas,
              humidity: data.humd,
              distance: data.ultrasonic,
            };
          }

          return {
            ...prevStation,
            racks: updatedRacks,
          };
        });

        // Check for food presence using ultrasonic sensor when we're checking for it
        if (checkingForFood && step === "confirmation") {
          // For put food confirmation
          const ultrasonicValue = data.ultrasonic;

          if (ultrasonicValue < FOOD_PRESENT_THRESHOLD) {
            setFoodDetected(true);
            setCheckingForFood(false);
            setMessage("Food detected in the rack! Please confirm.");
          } else if (ultrasonicValue > FOOD_ABSENT_THRESHOLD) {
            setFoodDetected(false);
            setCheckingForFood(false);
            setMessage(
              "No food detected in the rack. Please place your food and try again."
            );
          }
        } else if (checkingForFood && step === "take-confirmation") {
          // For take food confirmation
          const ultrasonicValue = data.ultrasonic;

          if (ultrasonicValue > FOOD_ABSENT_THRESHOLD) {
            setFoodDetected(false); // No food detected (it was taken)
            setCheckingForFood(false);
            setMessage("Food has been taken. Please confirm.");
          } else if (ultrasonicValue < FOOD_PRESENT_THRESHOLD) {
            setFoodDetected(true); // Food still detected (it wasn't taken)
            setCheckingForFood(false);
            setMessage(
              "Food still detected in the rack. Did you take the food?"
            );
          }
        }

        // Auto-detect food taken (for rack 1 only) - keep the original logic
        if (step === "take-food" && data.ultrasonic > DISTANCE_THRESHOLD) {
          const filledRacks = station?.racks.filter(
            (rack) => rack.isFilled && rack.id === 1
          );
          if (filledRacks && filledRacks.length > 0) {
            setSelectedRack(filledRacks[0]);
            confirmTakeFood();
          }
        }
      }
    });

    return () => {
      // Clean up resources
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((err) => console.warn("Error clearing scanner:", err));
      }
      unsubscribe();
    };
  }, [stationId, step, checkingForFood]);

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      return true;
    } catch (err) {
      console.error("Camera permission denied:", err);
      setMessage("Please allow camera access to scan QR codes");
      return false;
    }
  };

  const startScanner = () => {
    setStep("scanning");

    // Give React a moment to update the DOM
    setTimeout(() => {
      const readerElement = document.getElementById("reader");
      if (!readerElement) {
        console.error("Scanner container element not found!");
        setMessage("Scanner error: Container element not found");
        return;
      }

      try {
        // Clear any existing scanner instance
        if (scannerRef.current) {
          scannerRef.current
            .clear()
            .catch((err) => console.warn("Error clearing scanner:", err));
        }

        scannerRef.current = new Html5QrcodeScanner("reader", {
          fps: 10,
          qrbox: 250,
          rememberLastUsedCamera: true,
        });

        scannerRef.current.render(handleQrCodeSuccess, handleQrCodeError);
        console.log("Scanner initialized successfully");
      } catch (error) {
        console.error("Error initializing scanner:", error);
        setMessage(`Scanner initialization error: ${error.message}`);
      }
    }, 100); // Small delay to ensure DOM is updated
  };
  // Handle QR scan success
  const handleQrCodeSuccess = async (decodedText) => {
    try {
      // Look up user in Firestore
      const userRef = doc(db, "userpass", decodedText);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Stop scanner
        if (scannerRef.current) {
          scannerRef.current
            .clear()
            .catch((err) => console.warn("Error clearing scanner:", err));
        }

        // Set user and move to action selection
        setUser({
          id: userSnap.id,
          ...userSnap.data(),
        });
        setStep("action-selection");

        // Update user's last scan time
        await updateDoc(userRef, {
          lastScanned: serverTimestamp(),
          scanCount: (userSnap.data().scanCount || 0) + 1,
        });
      } else {
        setMessage("User not found. Please register your QR code.");
      }
    } catch (err) {
      console.error("Error processing QR code:", err);
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleQrCodeError = (error) => {
    // Only log actual errors, not "code not found" which is normal when no QR is in view
    if (!error.includes("NotFoundException")) {
      console.warn(`QR code scan error: ${error}`);
      setMessage(`Scanner error: ${error}`);
    }
  };

  // Start camera for food photo
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      setMessage(`Camera error: ${err.message}`);
    }
  };

  // Take food photo
  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(
      async (blob) => {
        try {
          // Upload to Firebase Storage
          const storageRef = ref(storage, `food-images/${Date.now()}.jpg`);
          const uploadResult = await uploadBytes(storageRef, blob);
          const downloadUrl = await getDownloadURL(uploadResult.ref);

          // Update state with image URL
          setFoodData((prev) => ({
            ...prev,
            imageUrl: downloadUrl,
          }));

          // Stop camera stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
          }

          setMessage("Photo taken successfully!");
        } catch (err) {
          console.error("Error uploading image:", err);
          setMessage(`Upload error: ${err.message}`);
        }
      },
      "image/jpeg",
      0.8
    );
  };

  // Handle put food action
  const handlePutFood = () => {
    setStep("put-food");
    // Reset food detected state and retry count
    setFoodDetected(false);
    setRetryCount(0);

    // Find empty rack
    if (!station || !station.racks) {
      setMessage("Station data not available!");
      return;
    }

    const emptyRacks = station.racks.filter((rack) => !rack.isFilled);
    if (emptyRacks.length === 0) {
      setMessage("No empty racks available!");
      return;
    }
    // Prioritize rack 1 for putting food if it's empty
    const rack1 = emptyRacks.find((rack) => rack.id === 1);
    setSelectedRack(rack1 || emptyRacks[0]);
    startCamera();
  };

  const handleTakeFood = () => {
    setStep("take-food");
    // Reset food detected state and retry count
    setFoodDetected(true); // Assume food is present initially since rack is filled
    setRetryCount(0);

    // Find filled racks
    if (!station || !station.racks) {
      setMessage("Station data not available!");
      return;
    }

    const filledRacks = station.racks.filter((rack) => rack && rack.isFilled);
    if (filledRacks.length === 0) {
      setMessage("No food available to take!");
      return;
    }

    // Explicitly set selectedRack to avoid null reference issues
    if (filledRacks.length > 0) {
      setSelectedRack(filledRacks[0]);
    }

    // Open door for all food options
    openDoor();
  };

  // Submit food data
  const submitFoodData = async () => {
    try {
      if (!foodData.name || !foodData.imageUrl) {
        setMessage("Please provide food name and take a photo");
        return;
      }

      // Open door for user to place food
      openDoor();

      setStep("confirmation");
      setMessage("Please place the food in the rack and confirm when done.");
    } catch (err) {
      console.error("Error submitting food data:", err);
      setMessage(`Error: ${err.message}`);
    }
  };

  // Automatically check if food was placed in rack
  const checkFoodPresence = () => {
    setCheckingForFood(true);

    if (step === "confirmation") {
      setMessage("Verifying food placement...");
    } else if (step === "take-confirmation") {
      setMessage("Verifying food removal...");
    }

    // Use current ultrasonic sensor value from sensorData
    const ultrasonicValue = sensorData?.ultrasonic || 0;

    if (step === "confirmation") {
      // For Put Food
      if (ultrasonicValue < FOOD_PRESENT_THRESHOLD) {
        setFoodDetected(true);
        setMessage("Food detected in the rack.");
      } else {
        setFoodDetected(false);
        setMessage("No food detected in the rack. Please place your food.");
      }
    } else if (step === "take-confirmation") {
      // For Take Food
      if (ultrasonicValue > FOOD_ABSENT_THRESHOLD) {
        setFoodDetected(false); // No food detected (it was taken)
        setMessage("Food has been removed from the rack.");
      } else {
        setFoodDetected(true); // Food still detected (it wasn't taken)
        setMessage("Food still detected in the rack. Please take the food.");
      }
    }

    setCheckingForFood(false);
  };

  const confirmAction = async () => {
    // First automatically check if food was detected in the appropriate way
    checkFoodPresence();

    // Use current ultrasonic sensor value to determine if action should proceed
    const ultrasonicValue = sensorData?.ultrasonic || 0;

    if (step === "confirmation") {
      // For Put Food confirmation
      if (ultrasonicValue > FOOD_ABSENT_THRESHOLD) {
        // No food detected
        if (retryCount < 2) {
          // Allow more retries
          setRetryCount(retryCount + 1);
          setMessage(
            "No food detected in the rack. Please place your food and then confirm again."
          );
          return;
        } else {
          // Too many retries, suggest cancellation
          setMessage(
            "No food detected after multiple attempts. Please cancel and try again later."
          );
          return;
        }
      }
    } else if (step === "take-confirmation") {
      // For Take Food confirmation
      if (ultrasonicValue < FOOD_PRESENT_THRESHOLD) {
        // Food still present (not taken)
        if (retryCount < 2) {
          // Allow more retries
          setRetryCount(retryCount + 1);
          setMessage(
            "Food still detected in the rack. Please take the food and then confirm again."
          );
          return;
        } else {
          // Too many retries, suggest cancellation
          setMessage(
            "Food still detected after multiple attempts. Please cancel and try again later."
          );
          return;
        }
      }
    }

    try {
      // Update station data in Firestore
      const stationRef = doc(db, "food stations", stationId);

      // Create a copy of racks to modify
      const updatedRacks = [...station.racks];

      if (step === "confirmation") {
        // Put food confirmation
        // Make sure selectedRack exists
        if (!selectedRack) {
          setMessage("Error: No rack selected. Please try again.");
          // Go back to previous step or initial step
          setStep("put-food");
          return;
        }

        const rackIndex = updatedRacks.findIndex(
          (r) => r && r.id === selectedRack.id
        );
        if (rackIndex === -1) {
          setMessage("Error: Selected rack not found");
          setStep("put-food");
          return;
        }
        // Update the rack with food data
        updatedRacks[rackIndex] = {
          ...updatedRacks[rackIndex],
          isFilled: true,
          name: foodData.name,
          Diet: foodData.diet,
          date: foodData.date,
          imageUrl: foodData.imageUrl,
          donatedBy: user.id,
          donatedAt: new Date().toISOString(),
          // Preserve sensor data
          temperature:
            sensorData?.temperature || updatedRacks[rackIndex].temperature,
          gasLevel: sensorData?.gas || updatedRacks[rackIndex].gasLevel,
          humidity: sensorData?.humidity || updatedRacks[rackIndex].humidity,
          distance: sensorData?.ultrasonic || updatedRacks[rackIndex].distance,
        };

        // Add activity log for the donation
        await addDoc(collection(db, "activity-logs"), {
          type: "donation",
          userId: user.id,
          stationId: stationId,
          rackId: selectedRack.id,
          foodDetails: {
            name: foodData.name,
            diet: foodData.diet,
            imageUrl: foodData.imageUrl,
          },
          timestamp: serverTimestamp(),
        });

        // Continue with the rest of the function...
      } else if (step === "take-confirmation") {
        // Take food confirmation
        // Handle case where selectedRack is null
        if (!selectedRack) {
          // Find the first filled rack
          const filledRacks = updatedRacks.filter(
            (rack) => rack && rack.isFilled
          );
          if (filledRacks.length === 0) {
            setMessage("Error: No filled racks found");
            setStep("action-selection");
            return;
          }

          // Use the first filled rack
          const takeRack = filledRacks[0];
          const takeRackIndex = updatedRacks.findIndex(
            (r) => r && r.id === takeRack.id
          );

          if (takeRackIndex === -1) {
            setMessage("Error: Unable to find rack data");
            return;
          }

          // Store food details before clearing
          const takenFood = { ...updatedRacks[takeRackIndex] };

          // Create activity log with null checks
          await addDoc(collection(db, "activity-logs"), {
            type: "collection",
            userId: user.id,
            stationId: stationId,
            rackId: takeRack.id,
            foodDetails: {
              name: takenFood.name || "Unknown Food",
              diet: takenFood.Diet || "unknown",
              imageUrl: takenFood.imageUrl || null,
              donatedBy: takenFood.donatedBy || null, // Ensure never undefined
            },
            timestamp: serverTimestamp(),
          });

          // If there's a donor, notify them
          if (takenFood.donatedBy) {
            await addDoc(collection(db, "notifications"), {
              userId: takenFood.donatedBy,
              message: `Your food "${
                takenFood.name || "Food item"
              }" has been collected from ${
                station?.name || "the food station"
              }`,
              read: false,
              timestamp: serverTimestamp(),
            });
          }

          // Clear rack data but preserve sensor readings
          updatedRacks[takeRackIndex] = {
            ...updatedRacks[takeRackIndex],
            isFilled: false,
            name: `Rack ${takeRackIndex + 1}`,
            Diet: null,
            date: null,
            imageUrl: null,
            donatedBy: null,
            donatedAt: null,
            // Preserve sensor data
            temperature:
              sensorData?.temperature ||
              updatedRacks[takeRackIndex].temperature,
            gasLevel: sensorData?.gas || updatedRacks[takeRackIndex].gasLevel,
            humidity:
              sensorData?.humidity || updatedRacks[takeRackIndex].humidity,
            distance:
              sensorData?.ultrasonic || updatedRacks[takeRackIndex].distance,
          };
        } else {
          // Normal flow when selectedRack exists
          const takeRackIndex = updatedRacks.findIndex(
            (r) => r && r.id === selectedRack.id
          );
          if (takeRackIndex === -1) {
            setMessage("Error: Selected rack not found");
            return;
          }

          // Store food details before clearing
          const takenFood = { ...updatedRacks[takeRackIndex] };

          // Create activity log with null checks
          await addDoc(collection(db, "activity-logs"), {
            type: "collection",
            userId: user.id,
            stationId: stationId,
            rackId: selectedRack.id,
            foodDetails: {
              name: takenFood.name || "Unknown Food",
              diet: takenFood.Diet || "unknown",
              imageUrl: takenFood.imageUrl || null,
              donatedBy: takenFood.donatedBy || null, // Ensure never undefined
            },
            timestamp: serverTimestamp(),
          });

          // If there's a donor, notify them
          if (takenFood.donatedBy) {
            await addDoc(collection(db, "notifications"), {
              userId: takenFood.donatedBy,
              message: `Your food "${
                takenFood.name || "Food item"
              }" has been collected from ${
                station?.name || "the food station"
              }`,
              read: false,
              timestamp: serverTimestamp(),
            });
          }

          // Clear rack data but preserve sensor readings
          updatedRacks[takeRackIndex] = {
            ...updatedRacks[takeRackIndex],
            isFilled: false,
            name: `Rack ${takeRackIndex + 1}`,
            Diet: null,
            date: null,
            imageUrl: null,
            donatedBy: null,
            donatedAt: null,
            // Preserve sensor data
            temperature:
              sensorData?.temperature ||
              updatedRacks[takeRackIndex].temperature,
            gasLevel: sensorData?.gas || updatedRacks[takeRackIndex].gasLevel,
            humidity:
              sensorData?.humidity || updatedRacks[takeRackIndex].humidity,
            distance:
              sensorData?.ultrasonic || updatedRacks[takeRackIndex].distance,
          };
        }
      }

      const sanitizedRacks = updatedRacks
        .map((rack) => {
          if (!rack) return null; // If rack is completely undefined, replace with null

          // Create a new object with all properties explicitly defined
          return {
            id: rack.id || 0,
            name: rack.name || `Rack ${rack.id || 0}`,
            isFilled: rack.isFilled === true, // Convert to boolean
            Diet: rack.Diet || null,
            date: rack.date || null,
            imageUrl: rack.imageUrl || null,
            donatedBy: rack.donatedBy || null,
            donatedAt: rack.donatedAt || null,
            temperature: rack.temperature || 0,
            gasLevel: rack.gasLevel || 0,
            humidity: rack.humidity || 0,
            distance: rack.distance || 0,
            items: Array.isArray(rack.items) ? rack.items : [],
          };
        })
        .filter((rack) => rack !== null); // Remove any null entries

      // Update station document with sanitized data
      await updateDoc(stationRef, {
        racks: sanitizedRacks,
      });

      // Close door
      closeDoor();

      // Navigate back to station detail
      setMessage("Thank you! Returning to station details...");
      setTimeout(() => {
        navigate(`/food-station-user`);
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error("Error updating station:", err);
      setMessage(`Error: ${err.message}`);
    }
  };

  // Function to check ultrasonic sensor data continually during active steps
  useEffect(() => {
    // Only run this effect during confirmation steps
    if (step !== "confirmation" && step !== "take-confirmation") {
      return;
    }

    // Set up interval to check sensor data every 2 seconds
    const interval = setInterval(() => {
      if (sensorData) {
        const ultrasonicValue = sensorData.ultrasonic;

        if (step === "confirmation") {
          // For put food
          if (ultrasonicValue < FOOD_PRESENT_THRESHOLD) {
            setFoodDetected(true);
            if (message.includes("No food detected")) {
              setMessage("Food detected in the rack! You may confirm now.");
            }
          } else if (ultrasonicValue > FOOD_ABSENT_THRESHOLD) {
            setFoodDetected(false);
            if (!message.includes("No food detected")) {
              setMessage(
                "No food detected in the rack. Please place your food."
              );
            }
          }
        } else if (step === "take-confirmation") {
          // For take food
          if (ultrasonicValue > FOOD_ABSENT_THRESHOLD) {
            setFoodDetected(false);
            if (message.includes("still detected")) {
              setMessage(
                "Food has been taken from the rack. You may confirm now."
              );
            }
          } else if (ultrasonicValue < FOOD_PRESENT_THRESHOLD) {
            setFoodDetected(true);
            if (!message.includes("still detected")) {
              setMessage(
                "Food still detected in the rack. Please take the food."
              );
            }
          }
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [step, sensorData, message]);

  // Add this to your state variables at the top of your component
  const [waitingForFoodRemoval, setWaitingForFoodRemoval] = useState(false);
  const [removalCheckInterval, setRemovalCheckInterval] = useState(null);

  // Modified handleCancelOperation function
  const handleCancelOperation = () => {
    // If in confirmation step, check if food is present in the rack
    if (
      step === "confirmation" &&
      sensorData?.ultrasonic < FOOD_PRESENT_THRESHOLD
    ) {
      // Food is detected but user wants to cancel - force removal
      setMessage(
        "Food detected in the rack. Please remove the food before cancelling."
      );
      setWaitingForFoodRemoval(true);

      // Start an interval to check for food removal
      const intervalId = setInterval(() => {
        console.log("Checking for food removal...", sensorData?.ultrasonic);
        if (sensorData?.ultrasonic > FOOD_ABSENT_THRESHOLD) {
          // Food has been removed, clear the interval and proceed with cancellation
          clearInterval(intervalId);
          setWaitingForFoodRemoval(false);
          setRemovalCheckInterval(null);

          // Now proceed with the cancellation
          completeCancellation();
          setMessage("Food removed. Operation cancelled.");
        }
      }, 1000); // Check every second

      // Store the interval ID so we can clear it if needed
      setRemovalCheckInterval(intervalId);

      // Return early - don't proceed with cancellation yet
      return;
    }

    // If not in confirmation step or no food detected, proceed with normal cancellation
    completeCancellation();
  };

  // Helper function to complete the cancellation process
  const completeCancellation = () => {
    // Clear any existing interval
    if (removalCheckInterval) {
      clearInterval(removalCheckInterval);
      setRemovalCheckInterval(null);
      setWaitingForFoodRemoval(false);
    }

    // Stop the camera if it's active
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close the door
    closeDoor();

    // Return to action selection
    setStep("action-selection");
    setMessage("Operation cancelled. What would you like to do?");

    // Reset states
    setFoodDetected(false);
    setRetryCount(0);
    setCheckingForFood(false);

    // Clear food data
    setFoodData({
      name: "",
      diet: "veg",
      imageUrl: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  // Add a cleanup effect to clear the interval if component unmounts
  useEffect(() => {
    return () => {
      if (removalCheckInterval) {
        clearInterval(removalCheckInterval);
      }
    };
  }, [removalCheckInterval]);
  // Open food station door
  const openDoor = async () => {
    try {
      // Update Realtime Database to open motor
      const motorRef = rtdbRef(rtdb, "adddelete"); // Correct path without the URL

      // Create a safe data object without undefined values
      const safeData = {
        gas: sensorData?.gas ?? 0, // Use nullish coalescing to provide default values
        humd: sensorData?.humidity ?? 0,
        temp: sensorData?.temperature ?? 0,
        ultrasonic: sensorData?.ultrasonic ?? 0,
        motorStatus: "open",
      };

      await set(motorRef, safeData);
      setMotorStatus("open");
    } catch (err) {
      console.error("Error opening door:", err);
      setMessage(`Door error: ${err.message}`);
    }
  };

  // Close food station door
  const closeDoor = async () => {
    try {
      // Update Realtime Database to close motor
      const motorRef = rtdbRef(rtdb, "adddelete"); // Correct path without the URL

      // Create a safe data object without undefined values
      const safeData = {
        gas: sensorData?.gas ?? 0, // Use nullish coalescing to provide default values
        humd: sensorData?.humidity ?? 0,
        temp: sensorData?.temperature ?? 0,
        ultrasonic: sensorData?.ultrasonic ?? 0,
        motorStatus: "closed",
      };

      await set(motorRef, safeData);
      setMotorStatus("closed");
    } catch (err) {
      console.error("Error closing door:", err);
      setMessage(`Door error: ${err.message}`);
    }
  };

  // Take food confirmation
  const confirmTakeFood = () => {
    // Check if selectedRack exists before proceeding
    if (!selectedRack) {
      // Find a filled rack to use
      const filledRacks = station?.racks?.filter((rack) => rack.isFilled) || [];
      if (filledRacks.length === 0) {
        setMessage("Error: No filled racks found");
        return;
      }
      setSelectedRack(filledRacks[0]);
    }

    setStep("take-confirmation");
    setMessage("Have you taken the food? Press confirm when done.");

    // Start checking if food was taken
    checkFoodPresence();
  };

  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeField, setActiveField] = useState("");

  const handleInputFocus = (fieldName) => {
    setShowKeyboard(true);
    setActiveField(fieldName);
  };

  const handleKeyboardInput = (input) => {
    setFoodData((prev) => ({
      ...prev,
      [activeField]: input,
    }));
  };

  const handleKeyboardEnter = () => {
    setShowKeyboard(false);
  };

  // Render based on current step
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h1 className="text-7xl font-bold mb-4 text-center p-5">Food Station</h1>
      {message && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
          {message}
        </div>
      )}
      {step === "initial" && (
        <div className="text-center">
          <button
            onClick={startScanner}
            className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-2xl text-6xl"
          >
            Scan QR Code
          </button>
        </div>
      )}
      {step === "scanning" && (
        <div className="mx-auto max-w-md">
          <h2 className="text-xl font-semibold mb-2">Scan Your QR Code</h2>
          <div id="reader" className="w-full"></div>
        </div>
      )}
      {step === "action-selection" && user && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Welcome, {user.name || user.id}
          </h2>
          <p className="mb-4">What would you like to do?</p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handlePutFood}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded"
            >
              Put Food
            </button>
            <button
              onClick={handleTakeFood}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded"
            >
              Take Food
            </button>
            <button
              onClick={() => {
                // Navigate to the route
                navigate(`/food-station-user`);

                // Force a page reload
                window.location.reload();
              }}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-6 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {step === "put-food" && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Add Food Details</h2>

          <div className="mb-6 flex flex-row">
            {/* Left side - Camera */}
            <div className="w-1/2 pr-4">
              <div className="relative h-full">
                {!foodData.imageUrl ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    className="w-full h-96 object-cover bg-gray-200 mb-2 rounded"
                  ></video>
                ) : (
                  <img
                    src={foodData.imageUrl}
                    alt="Food"
                    className="w-full h-96 object-cover bg-gray-200 mb-2 rounded"
                  />
                )}

                {/* Canvas for capturing photo */}
                <canvas ref={canvasRef} className="hidden"></canvas>

                {/* Photo button - only show if no image captured yet */}
                {!foodData.imageUrl && (
                  <button
                    onClick={takePhoto}
                    className="absolute bottom-4 right-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
                  >
                    Take Photo
                  </button>
                )}

                {/* Retake photo button - only show if image already captured */}
                {foodData.imageUrl && (
                  <button
                    onClick={() => {
                      // Restart camera
                      startCamera();
                      // Clear the image URL
                      setFoodData((prev) => ({ ...prev, imageUrl: "" }));
                    }}
                    className="absolute bottom-4 right-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
                  >
                    Retake Photo
                  </button>
                )}
              </div>
            </div>

            {/* Right side - Form */}
            <div className="w-1/2 pl-4">
              {/* Food details form */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Food Name
                </label>
                <input
                  type="text"
                  value={foodData.name}
                  onChange={(e) =>
                    setFoodData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  onFocus={() => handleInputFocus("name")}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter food name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Diet Type
                </label>
                <select
                  value={foodData.diet}
                  onChange={(e) =>
                    setFoodData((prev) => ({ ...prev, diet: e.target.value }))
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={foodData.date}
                  onChange={(e) =>
                    setFoodData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div className="mt-6">
                <button
                  onClick={submitFoodData}
                  disabled={!foodData.name || !foodData.imageUrl}
                  className={`w-full py-2 px-4 rounded font-bold ${
                    !foodData.name || !foodData.imageUrl
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-700 text-white"
                  }`}
                >
                  Submit Food Details
                </button>
                <button
                  onClick={handleCancelOperation}
                  className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Virtual Keyboard */}
      {showKeyboard && (
        <VirtualKeyboard
          onInput={handleKeyboardInput}
          initialValue={foodData[activeField]}
          onEnter={handleKeyboardEnter}
          onClose={() => setShowKeyboard(false)}
        />
      )}
      =
      {step === "confirmation" && (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Place Food in Rack</h2>

          <div className="mb-6">
            <p className="mb-4">
              The door is now open. Please place your food item in rack{" "}
              {selectedRack?.id || ""}.{" "}
            </p>

            <div className="flex justify-center items-center h-32">
              {motorStatus === "open" ? (
                sensorData && sensorData.ultrasonic < FOOD_PRESENT_THRESHOLD ? (
                  <div className="bg-green-100 text-green-700 p-4 rounded">
                    Door is open. Food detected in the rack! You may confirm
                    now.
                  </div>
                ) : (
                  <div className="bg-yellow-100 text-yellow-700 p-4 rounded">
                    Door is open. Please place your food in the rack and click
                    Confirm.
                  </div>
                )
              ) : (
                <div className="bg-red-100 text-red-700 p-4 rounded">
                  Door is closed. Please wait...
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
              <button
                onClick={confirmAction}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                disabled={
                  motorStatus !== "open" || checkingForFood || retryCount >= 3
                }
              >
                Confirm
              </button>

              <button
                onClick={handleCancelOperation}
                className={`bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ${
                  waitingForFoodRemoval ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={checkingForFood || waitingForFoodRemoval}
              >
                {waitingForFoodRemoval ? "Remove Food First" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
      {step === "take-food" && (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Take Any Food Item</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {station.racks
              .filter((rack) => rack.isFilled)
              .map((rack) => (
                <div key={rack.id} className="border rounded p-4">
                  <div className="flex flex-col items-center mb-4">
                    {rack.imageUrl && (
                      <img
                        src={rack.imageUrl}
                        alt={rack.name}
                        className="w-64 h-64 object-cover rounded mb-4"
                      />
                    )}
                    <h3 className="text-lg font-semibold">{rack.name}</h3>
                    <p className="text-gray-600">
                      {rack.Diet === "veg" ? "Vegetarian" : "Non-Vegetarian"}
                    </p>
                    <p className="text-gray-600">Best before: {rack.date}</p>
                  </div>
                </div>
              ))}
          </div>

          <div className="flex justify-center items-center h-32">
            {motorStatus === "open" ? (
              <div className="bg-green-100 text-green-700 p-4 rounded">
                Door is open. Please take any food item you'd like.
              </div>
            ) : (
              <div className="bg-red-100 text-red-700 p-4 rounded">
                Door is closed. Please wait...
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={confirmTakeFood}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
              disabled={motorStatus !== "open"}
            >
              I've Taken My Food
            </button>

            <button
              onClick={handleCancelOperation}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {step === "take-confirmation" && (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">
            Confirm Food Collection
          </h2>

          <div className="mb-6">
            <p className="mb-4">
              Have you taken the food from rack{" "}
              {selectedRack?.id || "the selected rack"}?
            </p>

            <div className="flex justify-center items-center h-32">
              {sensorData && sensorData.ultrasonic < FOOD_PRESENT_THRESHOLD ? (
                <div className="bg-red-100 text-red-700 p-4 rounded">
                  Food still detected in the rack. Please take the food before
                  confirming.
                </div>
              ) : sensorData &&
                sensorData.ultrasonic > FOOD_ABSENT_THRESHOLD ? (
                <div className="bg-green-100 text-green-700 p-4 rounded">
                  Food has been taken from the rack. You may confirm now.
                </div>
              ) : (
                <div className="bg-yellow-100 text-yellow-700 p-4 rounded">
                  Checking if food has been taken...
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
              <button
                onClick={confirmAction}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                disabled={checkingForFood || retryCount >= 3}
              >
                Confirm
              </button>

              <button
                onClick={handleCancelOperation}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                disabled={checkingForFood}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sensor data display - Updated to show all available sensor data */}
      {/* {station && (
        <div className="mt-8 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Sensor Data</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {station.racks.map((rack) => (
              <div key={rack.id} className="border rounded p-4">
                <h3 className="font-semibold mb-2">{rack.name}</h3>
                <p className="text-gray-700">
                  Status: {rack.isFilled ? "Filled" : "Empty"}
                </p>
                {rack.id === 1 && sensorData && (
                  <>
                    <p className="text-gray-700">
                      Temperature: {sensorData.temperature}°C
                    </p>
                    <p className="text-gray-700">Gas Level: {sensorData.gas}</p>
                    <p className="text-gray-700">
                      Humidity: {sensorData.humidity}%
                    </p>
                    <p className="text-gray-700">
                      Ultrasonic Distance: {sensorData.ultrasonic} cm
                    </p>
                  </>
                )}
                {rack.id !== 1 && (
                  <p className="text-gray-500 italic">
                    Sensors not available for this rack
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )} */}
      {/* Food Station Cabinet */}
      <div className="mt-4 sm:mt-8 p-3 sm:p-6 border rounded-lg shadow-inner bg-gray-50">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-center">
          Food Station Cabinet
        </h2>
        {station ? (
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
                            station.racks[0]?.imageUrl ||
                            "/placeholder-food.png"
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
                            station.racks[1]?.imageUrl ||
                            "/placeholder-food.png"
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
        ) : (
          <div className="text-center p-4">
            <p>Loading station data...</p>
          </div>
        )}
      </div>
      {/* Footer with navigation */}
      {/* <div className="mt-8 flex justify-center">
        <button
          onClick={() => navigate(`/food-station/${stationId}`)}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Station Details
        </button>
      </div> */}
    </div>
  );
};

export default FoodStationInteraction;
