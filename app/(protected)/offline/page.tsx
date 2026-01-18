// app/materiels/page.tsx
"use client";

import Offline from "@/components/Offline";
import ProtectedRoute from "@/components/ProtectedRoute";


export default function MaterielsPage() {
  return (
    <ProtectedRoute>
      <Offline />
    </ProtectedRoute>
  );
}
