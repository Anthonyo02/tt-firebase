// app/materiels/page.tsx
"use client";

import Projets from "@/components/Projets";
import ProtectedRoute from "@/components/ProtectedRoute";


export default function MaterielsPage() {
  return (
    <ProtectedRoute>
      <Projets />
    </ProtectedRoute>
  );
}
