"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.replace("/"); // redirige vers le dashboard si pas admin
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div>Chargement...</div>; // ou un spinner
  }

  return <>{children}</>;
}
