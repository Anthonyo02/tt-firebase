"use client";

import React, { useMemo } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import { Folder, Inventory2, TrendingUp } from "@mui/icons-material";
import { Materiel, Projet, useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

// =================================================================
// StatCard — Modern Hover & Responsive
// =================================================================
interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactElement;
  color: string;
  filterStatus?: "en cours" | "terminer" | "annuller";
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  color,
  filterStatus,
}) => {
  const router = useRouter();// pour aller à une page
  // router.push(`/projets?status=${encodeURIComponent(filterStatus)}`); // avec query param

  const theme = useTheme();

  const handleClick = () => {
    if (!filterStatus) return;
    router.push(`/projets?status=${encodeURIComponent(filterStatus)}`);
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: `linear-gradient(135deg, ${alpha(color, 0.05)}, ${alpha(
          color,
          0.02
        )})`,
        transition:
          "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease-in-out",
        cursor: filterStatus ? "pointer" : "default",
        "&:hover": filterStatus
          ? {
              transform: "translateY(-6px)",
              boxShadow: `0 8px 24px ${alpha(color, 0.15)}`,
            }
          : {},
        overflow: "hidden",
        position: "relative",
        "&::before": filterStatus
          ? {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: color,
              opacity: 0,
              transition: "opacity 0.3s ease",
            }
          : {},
        "&:hover::before": filterStatus ? { opacity: 1 } : {},
      }}
      onClick={handleClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="start">
          <Box>
            <Typography
              variant="caption"
              fontWeight={600}
              textTransform="uppercase"
              color="text.secondary"
              letterSpacing={0.5}
              mb={0.5}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              component="div"
              fontWeight={700}
              color={color}
              sx={{ lineHeight: 1.2 }}
            >
              {value}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              {description}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: color,
              backgroundColor: alpha(color, 0.1),
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.1)",
                backgroundColor: alpha(color, 0.2),
              },
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// =================================================================
// RecentProjectsCard — Scrollable & Sleek
// =================================================================
const statusConfig = {
  terminer: { label: "Terminé", color: "success" as const },
  "en cours": { label: "En cours", color: "warning" as const },
  annuller: { label: "Annulé", color: "error" as const },
};

interface RecentProjectsCardProps {
  projets: Projet[];
  onNavigate: () => void;
}

const RecentProjectsCard: React.FC<RecentProjectsCardProps> = ({
  projets,
  onNavigate,
}) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        height: { xs: 420, lg: "100%" },
        maxHeight: { lg: "calc(100vh - 180px)" },
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        overflow: "hidden",
      }}
      onClick={onNavigate}
    >
      <CardContent
        sx={{ p: 0, height: "100%", display: "flex", flexDirection: "column" }}
      >
        {/* HEADER */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            background:
              "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
            // position: "relative",
            overflow: "hidden",
            px: 3,
            py: 1,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          {" "}
          <Box
            sx={{
              position: "absolute",
              width: 300,
              height: 300,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.1)",
              top: -100,
              right: -50,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: 150,
              height: 150,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.08)",
              bottom: -30,
              left: "30%",
            }}
          />
          <Typography variant="h6" fontWeight={700}>
            Projets récents
          </Typography>
          <Typography
            variant="caption"
            color="text.primary"
            fontWeight={"bold"}
          >
            {projets.length} total
          </Typography>
        </Box>

        {/* SCROLLABLE LIST */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 2,
            py: 1.5,
            "&::-webkit-scrollbar": {
              width: 6,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: alpha(theme.palette.grey[400], 0.5),
              borderRadius: 8,
            },
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {projets.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 6,
                textAlign: "center",
              }}
            >
              <Folder sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
              <Typography color="text.secondary">
                Aucun projet à afficher
              </Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={1.5}>
              {projets.map((projet) => (
                <Box
                  key={projet.id}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition:
                      "background-color 0.2s ease, transform 0.2s ease",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.action.hover, 0.1),
                      transform: "translateX(4px)",
                    },
                  }}
                >
                  <Box>
                    <Typography
                      fontWeight={600}
                      variant="body2"
                      noWrap
                      maxWidth={200}
                    >
                      {projet.titre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {projet.responsable} •{" "}
                      {new Date(projet.date_debut).toLocaleDateString("fr-FR")}
                    </Typography>
                  </Box>

                  <Chip
                    label={statusConfig[projet.status]?.label || projet.status}
                    size="small"
                    color={statusConfig[projet.status]?.color || "default"}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// =================================================================
// StockStatusCard — Clean Progress Bars
// =================================================================
interface StockStatusCardProps {
  materiels: Materiel[];
  onNavigate: () => void;
}

const StockStatusCard: React.FC<StockStatusCardProps> = ({
  materiels,
  onNavigate,
}) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        height: { xs: 420, lg: "100%" },
        maxHeight: { lg: "calc(100vh - 180px)" }, // ← limite absolue
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        overflow: "hidden",
      }}
      onClick={onNavigate}
    >
      <CardContent
        sx={{ p: 0, height: "100%", display: "flex", flexDirection: "column" }}
      >
        {/* HEADER */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            background:
              "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
            // position: "relative",
            overflow: "hidden",
            px: 3,
            py: 1,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          {" "}
          <Box
            sx={{
              position: "absolute",
              width: 300,
              height: 300,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.1)",
              top: -100,
              right: -50,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: 150,
              height: 150,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.08)",
              bottom: -30,
              left: "30%",
            }}
          />
          <Typography variant="h6" fontWeight={700}>
            État du stock
          </Typography>
          <Typography
            variant="caption"
            color="text.primary"
            fontWeight={"bold"}
          >
            {materiels.length} types
          </Typography>
        </Box>

        {/* SCROLLABLE LIST */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 2,
            py: 1.5,
            "&::-webkit-scrollbar": {
              width: 6,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: alpha(theme.palette.grey[400], 0.5),
              borderRadius: 8,
            },
          }}
        >
          {materiels.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 6,
                textAlign: "center",
              }}
            >
              <Inventory2
                sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
              />
              <Typography color="text.secondary">
                Aucun matériel en stock
              </Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={2}>
              {materiels.map((mat) => (
                <Box key={mat.id}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={0.5}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      noWrap
                      maxWidth={160}
                    >
                      {mat.nom}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {mat.quantites || 0} unités
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(((mat.quantites || 0) / 20) * 100, 100)}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: alpha(theme.palette.grey[300], 0.3),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 5,
                        backgroundColor:
                          (mat.quantites || 0) < 5
                            ? theme.palette.warning.main
                            : theme.palette.primary.main,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// =================================================================
// DASHBOARD PRINCIPAL — Responsive Grid & Modern Layout
// =================================================================
const Dashboard: React.FC = () => {
  const { projets, materiels } = useData();
  const { user } = useAuth();
 

  const statsData = useMemo(() => {
    const projetsTermines = projets.filter(
      (p) => p.status === "terminer"
    ).length;
    const projetsEnCours = projets.filter(
      (p) => p.status === "en cours"
    ).length;
    const projetsAnnules = projets.filter(
      (p) => p.status === "annuller"
    ).length;
    const stockTotal = materiels.reduce(
      (acc, m) => acc + (m.quantites || 0),
      0
    );

    return [
      {
        title: "Projets terminés",
        value: projetsTermines,
        icon: <Folder />,
        color: "#10b981", // emerald-500
        description: "Finalisés avec succès",
        filterStatus: "terminer" as const,
      },
      {
        title: "Projets en cours",
        value: projetsEnCours,
        icon: <Folder />,
        color: "#f59e0b", // amber-500
        description: "Encore actifs",
        filterStatus: "en cours" as const,
      },
      {
        title: "Projets annulés",
        value: projetsAnnules,
        icon: <Folder />,
        color: "#ef4444", // red-500
        description: "Arrêtés ou suspendus",
        filterStatus: "annuller" as const,
      },
      {
        title: "Stock total",
        value: stockTotal,
        icon: <TrendingUp />,
        color: "#8b5cf6", // violet-500
        description: "Unités disponibles",
      },
      {
        title: "Types de matériels",
        value: materiels.length,
        icon: <Inventory2 />,
        color: "#06b6d4", // cyan-500
        description: "Équipements distincts",
      },
    ];
  }, [projets, materiels]);

  const recentProjets = useMemo(() => projets.slice(0, 5), [projets]);
  const recentMateriels = useMemo(() => materiels, [materiels]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Greeting Header */}
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Bonjour, {user?.nom} 👋
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" maxWidth={600}>
          Voici un aperçu de l'activité des projets et de l'état du stock.
          Cliquez sur les cartes pour explorer davantage.
        </Typography>
      </Box>

      {/* Stats Grid — Fully Responsive */}
      <Grid container spacing={2.5} sx={{ mb: { xs: 3, md: 4 } }}>
        {statsData.map((stat, index) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            lg={2.4} // 5 colonnes sur grand écran
            key={index}
          >
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Content Cards — Stack on mobile */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <RecentProjectsCard
            projets={recentProjets}
            onNavigate={() => ("/projets")}
          />
        </Grid>
        <Grid item xs={12} lg={4}>
          <StockStatusCard
            materiels={recentMateriels}
            onNavigate={() => ("/materiels")}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
