"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // 🔹 Tant que l'auth n'est pas chargée → loader
  if (isLoading) return <div>Chargement...</div>;

  // 🔹 Si pas de user → redirection immédiate
  if (!user) {
    router.push("/login");
    return null; // ne rien afficher du tout
  }

  // 🔹 User connecté → affiche le layout complet
  return <>{children}</>;
};

export default ProtectedLayout;
