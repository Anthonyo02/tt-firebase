import { useEffect, useState } from "react";

// ✅ Nouveau type avec 4 statuts
export type ConnectionStatus = "stable" | "unstable" | "poor" | "offline";

const PING_URL =
  "https://script.google.com/macros/s/AKfycbwNccbNorawZl7Sr0Ty1mw86L66sxRQIVA2Sh6clLlZeTpzpzmm_4Qkn-N2C5ueYnSXrw/exec";

const TIMEOUT = 2000; // timeout fetch
const SLOW_THRESHOLD = 2500; // >2.5s = unstable
const POOR_THRESHOLD = 3500; // >3.5s = poor

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>("stable");

  const checkConnection = async () => {
    // ⚫ Hors ligne réseau
    if (!navigator.onLine) {
      setStatus("offline");
      console.log({ online: navigator.onLine, status: "offline" });
      return;
    }

    // ❌ Si on est déjà offline, ne ping pas le serveur
    if (status === "offline") return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const start = performance.now();

      await fetch(PING_URL, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      const duration = performance.now() - start;

      if (duration > POOR_THRESHOLD) {
        // 🟡 Connexion très mauvaise
        setStatus("poor");
      } else if (duration > SLOW_THRESHOLD) {
        // 🟠 Connexion instable
        setStatus("unstable");
      } else {
        // 🟢 Connexion stable
        setStatus("stable");
      }

      console.log({ online: navigator.onLine, status });
    } catch {
      // 🟠 Timeout ou erreur API
      setStatus("unstable");
    } finally {
      clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    checkConnection();

    const interval = setInterval(checkConnection, 15000);

    window.addEventListener("online", checkConnection);
    window.addEventListener("offline", () => setStatus("offline"));

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", checkConnection);
      window.removeEventListener("offline", () => setStatus("offline"));
    };
  }, [status]); // 🔹 status en dépendance pour ne pas ping si offline

  return {
    status,
    isStable: status === "stable",
    isUnstable: status === "unstable",
    isPoor: status === "poor",
    isOffline: status === "offline",
  };
};
