"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // 🔹 Affiche un loader pendant le chargement
  if (isLoading) return <div>Chargement...</div>;

  // 🔹 Si hors ligne mais user présent en localStorage → ne pas déconnecter
  if (!navigator.onLine && user) {
    return <>{children}</>;
  }

  // 🔹 Redirection si pas de user
  if (!user) {
    router.push("/login");
    return null;
  }

  // 🔹 User connecté → afficher le contenu
  return <>{children}</>;
};

export default ProtectedRoute;
