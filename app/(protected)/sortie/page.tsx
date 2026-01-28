// app/projet/page.tsx
"use client";

import Projets from "@/components/Projets";
import ProtectedRoute from "@/components/ProtectedRoute";
import ChecklistList from "@/components/SortieMat";


export default function MaterielsPage() {
  return (
    <ProtectedRoute>
      <ChecklistList />
    </ProtectedRoute>
  );
}
