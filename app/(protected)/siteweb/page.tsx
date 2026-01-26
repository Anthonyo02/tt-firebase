// app/materiels/page.tsx
"use client";
import NotFound from "@/app/(public)/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import AboutPreview from "@/components/siteweb/AboutPreview";
import PartenaireEditor from "@/components/siteweb/PartenaireEditor";
import ProjetEdit from "@/components/siteweb/ProjetEdit";
import RealisationPage from "@/components/siteweb/RealisationPage";
import ServicesEditor from "@/components/siteweb/ServicesEditor";
import SiteWeb from "@/components/siteweb/SiteWeb";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { Grid } from "@mui/material";

export default function MaterielsPage() {
  const { isOffline } = useConnectionStatus();
  return (
    <>
      {!isOffline ? (
        <ProtectedRoute>
          <Grid container justifyContent="center" gap={3} sx={{ p: { sm: 2 } }}>
            <SiteWeb />
            <AboutPreview />
            <RealisationPage />
            <ProjetEdit />
            <ServicesEditor />
            <PartenaireEditor />
          </Grid>
        </ProtectedRoute>
      ) : (
        <NotFound />
      )}
    </>
  );
}
