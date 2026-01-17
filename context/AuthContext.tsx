
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
// ❌ On enlève axios
// import axios from "axios";

// ✅ On importe Firebase
import { db } from "@/lib/firebase"; // Assure-toi que le chemin est bon
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc 
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérification au chargement de la page (F5)
  useEffect(() => {
    const checkUser = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          // Vérifier si l'utilisateur existe toujours dans la DB
          await verifyUser(parsedUser);
        } catch {
          localStorage.removeItem("user");
        }
      }
      setIsLoading(false);
    };
    checkUser();
  }, []);

  const verifyUser = async (currentUser: User) => {
    try {
      // On cherche le document par son ID directement
      const userRef = doc(db, "users", currentUser.id);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Si l'utilisateur n'existe plus dans la DB, on le déconnecte
        logout();
      } else {
        // Optionnel : Mettre à jour les infos locales si le rôle a changé
        const data = userSnap.data();
        if (data.role !== currentUser.role) {
          const updatedUser = { ...currentUser, role: data.role };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.log("Impossible de vérifier l'utilisateur (probablement hors ligne)");
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // 🔍 REQUÊTE FIRESTORE
      // On cherche un utilisateur avec cet email ET ce mot de passe
      const usersRef = collection(db, "users");
      const q = query(
        usersRef, 
        where("email", "==", email), 
        where("password", "==", password)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, error: "Email ou mot de passe incorrect" };
      }

      // Si on trouve un utilisateur (on prend le premier)
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      const userObj: User = {
        id: userDoc.id,
        nom: userData.nom || "Utilisateur",
        email: userData.email,
        role: userData.role || "employer",
      };

      setUser(userObj);
      localStorage.setItem("user", JSON.stringify(userObj));
      return { success: true };

    } catch (error) {
      console.error("Erreur Login Firebase:", error);
      return { success: false, error: "Erreur de connexion au serveur" };
    } finally {
      setIsLoading(false);
    }
  };

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
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};