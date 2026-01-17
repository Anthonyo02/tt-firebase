import { useEffect, useState, useCallback } from "react";
import { getDocs, collection, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase"; // adapte le chemin

export type ConnectionStatus =
  | "stable"
  | "unstable"
  | "poor"
  | "offline";

const SLOW_THRESHOLD = 2500; // >2.5s
const POOR_THRESHOLD = 3500; // >3.5s
const CHECK_INTERVAL = 15000;

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>("stable");

  const checkConnection = useCallback(async () => {
    // 🔴 Hors ligne navigateur
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }

    try {
      const start = performance.now();

      // 🔹 Mini requête Firestore (1 doc max)
      const q = query(collection(db, "materiels"), limit(1));
      await getDocs(q);

      const duration = performance.now() - start;

      if (duration > POOR_THRESHOLD) {
        setStatus("poor");
      } else if (duration > SLOW_THRESHOLD) {
        setStatus("unstable");
      } else {
        setStatus("stable");
      }
    } catch (error) {
      console.error("Connection check failed:", error);
      setStatus("unstable");
    }
  }, []);

  useEffect(() => {
    checkConnection();

    const interval = setInterval(checkConnection, CHECK_INTERVAL);

    const handleOnline = () => checkConnection();
    const handleOffline = () => setStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkConnection]);

  return {
    status,
    isStable: status === "stable",
    isUnstable: status === "unstable",
    isPoor: status === "poor",
    isOffline: status === "offline",
  };
};
