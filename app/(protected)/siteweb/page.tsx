// app/materiels/page.tsx
"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import SiteWeb from "@/components/SiteWeb";


export default function MaterielsPage() {
  return (
    <ProtectedRoute>
      <SiteWeb />
    </ProtectedRoute>
  );
}
