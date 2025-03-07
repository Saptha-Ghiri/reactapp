// QRScanner.jsx
import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  doc,
  collection,
  getDocs,
  updateDoc,
  increment,
} from "firebase/firestore"; // Import from your existing firebase config file
import { db, storage } from "../firebase/config";
import { getDatabase, ref, set, onValue } from "firebase/database"; // Add RTDB imports
import { initializeApp } from "firebase/app";

const QRScanner = () => {
  const [lastScanned, setLastScanned] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [motorStatus, setMotorStatus] = useState("closed");
  const [scanHistory, setScanHistory] = useState([]);
  const scannerRef = useRef(null);
  const readerRef = useRef(null);
  const lastProcessedRef = useRef("");
  const processingRef = useRef(false);

  // Get reference to realtime database
  const rtdb = getDatabase();

  // Cooldown to prevent multiple scans of the same QR code
  const scanCooldownMs = 3000;
  const lastScanTimeRef = useRef(0);

  useEffect(() => {
    // Initialize scanner when component mounts
    if (readerRef.current) {
      scannerRef.current = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: true,
      });

      scannerRef.current.render(onScanSuccess, onScanError);
    }

    // Listen to motor status changes from the realtime database
    const motorStatusRef = ref(rtdb);
    const unsubscribe = onValue(motorStatusRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.motorStatus) {
        setMotorStatus(data.motorStatus);
      }
    });
    return () => {
      // Clean up scanner when component unmounts
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error) => {
          console.warn("Failed to clear scanner", error);
        });
      }

      // Unsubscribe from realtime database
      unsubscribe();
    };
  }, []);

  const onScanSuccess = (decodedText) => {
    const currentTime = Date.now();

    // Prevent processing the same QR code too quickly
    if (
      decodedText === lastProcessedRef.current &&
      currentTime - lastScanTimeRef.current < scanCooldownMs
    ) {
      console.log("Duplicate scan ignored:", decodedText);
      return;
    }

    // Prevent multiple simultaneous processing
    if (processingRef.current) {
      console.log("Processing already in progress. Ignoring scan.");
      return;
    }

    processingRef.current = true;
    lastProcessedRef.current = decodedText;
    lastScanTimeRef.current = currentTime;

    console.log("QR code scanned:", decodedText);
    setLastScanned(decodedText);

    // Use functional state update to ensure correct toggling
    setMotorStatus((prevStatus) => {
      const newMotorStatus = prevStatus === "open" ? "closed" : "open";

      console.log(`Toggling motor status: ${prevStatus} → ${newMotorStatus}`);

      // Update Firestore and Realtime Database
      updateBothDatabases(decodedText, newMotorStatus);

      return newMotorStatus;
    });

    // **Delay processing reset to avoid rapid double triggers**
    setTimeout(() => {
      processingRef.current = false;
    }, 1000);
  };

  const onScanError = (error) => {
    // Only log actual errors, not "code not found" which is normal when no QR is in view
    if (!error.includes("NotFoundException")) {
      console.warn(`QR code scan error: ${error}`);
    }
  };

  const updateBothDatabases = async (documentId, newStatus) => {
    try {
      setUpdateStatus(`Updating databases for ID: ${documentId}...`);
      const timestamp = new Date();

      // Update Firestore document with scan details
      const docRef = doc(db, "userpass", documentId);
      await updateDoc(docRef, {
        lastScanned: timestamp,
        lastStatus: newStatus,
        scanCount: increment(1), // You'll need to import increment from firebase/firestore
      });

      // Update Realtime Database for motor control
      const motorRef = ref(rtdb);
      await set(motorRef, {
        motorStatus: newStatus,
      });

      // Add to scan history
      setScanHistory((prev) => [
        {
          id: documentId,
          time: timestamp.toLocaleTimeString(),
          status: "success",
          motorStatus: newStatus,
        },
        ...prev.slice(0, 9),
      ]);

      setMotorStatus(newStatus);
      setUpdateStatus(`Success! Motor is now ${newStatus}`);
      console.log(`Databases updated. Motor status: ${newStatus}`);
    } catch (error) {
      console.error("Error updating databases:", error);
      setUpdateStatus(`Error: ${error.message}`);

      // Add to scan history even on error
      setScanHistory((prev) => [
        {
          id: documentId,
          time: new Date().toLocaleTimeString(),
          status: "error",
          error: error.message,
        },
        ...prev.slice(0, 9),
      ]);
    } finally {
      // Reset processing flag after a short delay to prevent double-processing
      setTimeout(() => {
        processingRef.current = false;
      }, 1000);
    }
  };

  return (
    <div className="qr-scanner-container">
      <h2>QR Code Scanner</h2>
      <p>Scan QR codes to control motor status</p>

      <div
        className="motor-status"
        style={{
          padding: "10px",
          backgroundColor: motorStatus === "open" ? "#d1e7dd" : "#f8d7da",
          borderRadius: "5px",
          margin: "10px 0",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        Motor is currently: {motorStatus}
      </div>

      <div
        id="reader"
        ref={readerRef}
        style={{ width: "100%", maxWidth: "500px" }}
      ></div>

      <div className="status-container" style={{ marginTop: "20px" }}>
        <h3>Status:</h3>
        <p
          className={
            updateStatus.includes("Error") ? "error-message" : "success-message"
          }
        >
          {updateStatus || "Ready to scan"}
        </p>
        {lastScanned && (
          <p>
            <strong>Last scanned:</strong> {lastScanned}
          </p>
        )}
      </div>

      {scanHistory.length > 0 && (
        <div className="history-container" style={{ marginTop: "20px" }}>
          <h3>Recent Scans:</h3>
          <ul style={{ padding: "0", listStyle: "none" }}>
            {scanHistory.map((scan, index) => (
              <li
                key={index}
                style={{
                  margin: "5px 0",
                  padding: "8px",
                  backgroundColor:
                    scan.status === "success" ? "#e6ffed" : "#ffebe9",
                  borderRadius: "4px",
                }}
              >
                <strong>{scan.time}</strong>: {scan.id} -
                {scan.status === "success"
                  ? ` Set motor to ${scan.motorStatus}`
                  : ` Error: ${scan.error}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
