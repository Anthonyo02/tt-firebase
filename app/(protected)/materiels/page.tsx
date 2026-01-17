// app/materiels/page.tsx
"use client";

import Materiels from "@/components/Materiels";
import ProtectedRoute from "@/components/ProtectedRoute";


export default function MaterielsPage() {
  return (
    <ProtectedRoute>
      <Materiels />
    </ProtectedRoute>
  );
}
