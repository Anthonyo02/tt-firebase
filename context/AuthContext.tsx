"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface User {
  id: string;
  nom: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth();

  // 🔹 Observer l'état de connexion
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              const userObj: User = {
                id: firebaseUser.uid,
                nom: data.nom,
                email: data.email,
                role: data.role,
              };
              setUser(userObj);
              localStorage.setItem("user", JSON.stringify(userObj));
            } else {
              setUser(null);
              localStorage.removeItem("user");
            }
          } catch (err) {
            console.error("Erreur récupération user Firestore:", err);
            setUser(null);
          }
        } else {
          setUser(null);
          localStorage.removeItem("user");
        }
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [auth]);

  // 🔹 Fonction login
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      // Récupérer les infos Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (!userDoc.exists()) throw new Error("Utilisateur introuvable");

      const data = userDoc.data();
      const userObj: User = {
        id: firebaseUser.uid,
        nom: data.nom,
        email: data.email,
        role: data.role,
      };
      setUser(userObj);
      localStorage.setItem("user", JSON.stringify(userObj));
      return { success: true };
    } catch (err: any) {
      console.error("Login error:", err);
      return { success: false, error: err.message || "Erreur inconnue" };
    }
  };

  // 🔹 Fonction logout
  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 🔹 Hook pratique

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error(
      "useAuth doit être utilisé à l'intérieur d'un AuthProvider",
    );
  return context;
};
