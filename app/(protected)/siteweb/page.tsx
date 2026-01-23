// app/materiels/page.tsx
"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import AboutPreview from "@/components/siteweb/AboutPreview";
import PartenaireEditor from "@/components/siteweb/PartenaireEditor";
import RealisationPage from "@/components/siteweb/RealisationPage";
import SiteWeb from "@/components/siteweb/SiteWeb";
import { Grid } from "@mui/material";

export default function MaterielsPage() {
  return (
    <ProtectedRoute>
      <Grid container justifyContent="center" gap={3} sx={{ p: { sm: 2 } }}>
        <SiteWeb />
        <AboutPreview />
        <RealisationPage />
        <PartenaireEditor />
      </Grid>
    </ProtectedRoute>
  );
}
