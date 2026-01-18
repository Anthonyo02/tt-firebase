"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export interface User {
  id: string;
  nom: string;
  email: string;
  role: "admin" | "employer";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ============================
  // 🔐 CHECK USER AU DÉMARRAGE
  // ============================
  useEffect(() => {
    let cancelled = false;

    // ⏱️ Timeout OFFLINE (IMPORTANT)
    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn("⏱️ Auth timeout → offline mode");
        setIsLoading(false);
      }
    }, 1500);

    const initAuth = async () => {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const parsedUser: User = JSON.parse(storedUser);
          setUser(parsedUser);

          // 🔥 Vérifier Firestore SEULEMENT si online
          if (navigator.onLine) {
            await verifyUser(parsedUser);
          }
        } catch {
          localStorage.removeItem("user");
        }
      }

      if (!cancelled) {
        setIsLoading(false);
        clearTimeout(timeout);
      }
    };

    initAuth();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  // ============================
  // 🔍 VERIFY USER (ONLINE ONLY)
  // ============================
  const verifyUser = async (currentUser: User) => {
    try {
      const userRef = doc(db, "users", currentUser.id);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        logout();
      } else {
        const data = userSnap.data();
        if (data.role !== currentUser.role) {
          const updatedUser = { ...currentUser, role: data.role };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.log("⚠️ Verify skipped (offline)");
    }
  };

  // ============================
  // 🔑 LOGIN
  // ============================
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", "==", email),
        where("password", "==", password)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        return { success: false, error: "Email ou mot de passe incorrect" };
      }

      const docUser = snap.docs[0];
      const data = docUser.data();

      const userObj: User = {
        id: docUser.id,
        nom: data.nom || "Utilisateur",
        email: data.email,
        role: data.role || "employer",
      };

      setUser(userObj);
      localStorage.setItem("user", JSON.stringify(userObj));

      return { success: true };
    } catch (error) {
      console.error("Erreur login:", error);
      return { success: false, error: "Serveur inaccessible" };
    } finally {
      setIsLoading(false);
    }
  };

  // ============================
  // 🚪 LOGOUT
  // ============================
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
