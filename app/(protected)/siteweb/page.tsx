// app/materiels/page.tsx
"use client";
import NotFound from "@/app/(public)/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import AboutPreview from "@/components/siteweb/AboutPreview";
import ContactEditor from "@/components/siteweb/ContactEditor";
import PartenaireEditor from "@/components/siteweb/PartenaireEditor";
import ProjetEdit from "@/components/siteweb/ProjetEdit";
import RealisationPage from "@/components/siteweb/RealisationPage";
import ServicesEditor from "@/components/siteweb/ServicesEditor";
import SiteWeb from "@/components/siteweb/SiteWeb";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { Grid, Typography } from "@mui/material";

export default function MaterielsPage() {
  const { isOffline } = useConnectionStatus();
  type SectionTitleProps = {
    title: string;
  };

  const SectionTitle = ({ title }: SectionTitleProps) => (
    <Grid
      container
      alignItems="center"
      justifyContent="center"
      borderRadius={2}
    >
      <Typography
        variant="h6"
        fontStyle="italic"
        sx={{
          color: "#616637",
          fontWeight: 900,
          letterSpacing: "0.05em",
          fontSize: "1.25rem",
          textTransform: "uppercase",
        }}
      >
        {title}
      </Typography>
    </Grid>
  );

  return (
    <>
      {!isOffline ? (
        <ProtectedRoute>
          <Grid container justifyContent="center" gap={3} sx={{ p: { sm: 2 } }}>
            <SectionTitle title="Carrousel" />
            <SiteWeb />

            <SectionTitle title="À propos" />
            <AboutPreview />

            <SectionTitle title="Réalisations" />
            <RealisationPage />

            <SectionTitle title="Projets" />
            <ProjetEdit />

            <SectionTitle title="Services" />
            <ServicesEditor />

            <SectionTitle title="Contact" />
            <ContactEditor />

            <SectionTitle title="Partenaires" />
            <PartenaireEditor />
          </Grid>
        </ProtectedRoute>
      ) : (
        <NotFound />
      )}
    </>
  );
}
