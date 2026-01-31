"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Divider,
  Paper,
  Avatar,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Add,
  Search,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  LocationOn,
  CheckCircle,
  Schedule,
  Cancel,
  AccessTime,
  FolderOpen,
  PlayCircle,
  Done,
  Block,
} from "@mui/icons-material";

import { useData, Projet } from "../context/DataContext";

import ProjetFormModal from "../components/modals/ProjetFormModal";
import ProjetViewModal from "../components/modals/ProjetViewModal";
import ConfirmDialog from "../components/modals/ConfirmDialog";

import { useRouter, useSearchParams } from "next/navigation";

/* =====================================================
   STATUS CONFIG
===================================================== */
const getStatusConfig = (status?: string) => {
  const s = (status ?? "").toLowerCase();
  const map: any = {
    "en cours": {
      label: "En cours",
      bgColor: "#fff3e0",
      textColor: "#ee874f",
      icon: <Schedule fontSize="small" />,
    },
    terminer: {
      label: "Terminé",
      bgColor: "#e8f5e9",
      textColor: "#2e7d32",
      icon: <CheckCircle fontSize="small" />,
    },
    annuller: {
      label: "Annulé",
      bgColor: "#ffebee",
      textColor: "#d32f2f",
      icon: <Cancel fontSize="small" />,
    },
  };
  return (
    map[s] || {
      label: status || "Non défini",
      bgColor: "#f5f5f5",
      textColor: "#757575",
      icon: <AccessTime fontSize="small" />,
    }
  );
};

/* =====================================================
   HELPERS
===================================================== */
const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* =====================================================
   COMPONENT
===================================================== */
const Projets: React.FC = () => {
  const theme = useTheme();

  const [localUser, setLocalUser] = useState<{
    nom?: string;
    email?: string;
    role?: string;
  }>({});
  const isAdmin = localUser?.role === "admin";

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setLocalUser(JSON.parse(stored));
      } catch {
        setLocalUser({});
      }
    } else {
      setLocalUser({});
    }
  }, []);

  const { projets, deleteProjet: contextDeleteProjet } = useData();

  const router = useRouter();
  const searchParams = useSearchParams();

  const statusFilter = searchParams.get("status") || "tous";

  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editProjet, setEditProjet] = useState<Projet | null>(null);
  const [viewProjet, setViewProjet] = useState<Projet | null>(null);
  const [deleteProjet, setDeleteProjet] = useState<Projet | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    el: HTMLElement;
    projet: Projet;
  } | null>(null);

  /* =====================================================
     FILTERS
  ===================================================== */
  const filteredProjets = useMemo(() => {
    const q = search.toLowerCase();
    return projets.filter((p) => {
      const matchText =
        p.titre.toLowerCase().includes(q) ||
        p.responsable.toLowerCase().includes(q) ||
        p.lieu.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "tous" || p.status.toLowerCase() === statusFilter;

      return matchText && matchStatus;
    });
  }, [projets, search, statusFilter]);

  const counts = useMemo(() => {
    const s = projets.map((p) => p.status.toLowerCase());
    return {
      tous: projets.length,
      "en cours": s.filter((x) => x === "en cours").length,
      terminer: s.filter((x) => x === "terminer").length,
      annuller: s.filter((x) => x === "annuller").length,
    };
  }, [projets]);

  /* =====================================================
     DELETE (Via Context)
  ===================================================== */
  const handleDelete = async () => {
    if (!deleteProjet) return;
    setIsLoading(true);

    try {
      await contextDeleteProjet(deleteProjet.id);
      setDeleteProjet(null);
      setMenuAnchor(null);
    } catch (error) {
      console.error("Erreur suppression:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (st: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (st === "tous") {
      params.delete("status");
    } else {
      params.set("status", st);
    }

    router.replace(`?${params.toString()}`);
  };

  /* =====================================================
     UI
  ===================================================== */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.03
        )} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
        p: { xs: 2, md: 4 },
      }}
    >
      {/* ============ HEADER ============ */}
      <Box
        sx={{
          borderRadius: { xs: 0, md: 4 },
          mx: { xs: -2, md: 0 },
          mt: { xs: -2, md: 0 },
          mb: 4,
          p: { xs: 3, md: 4 },
        background:
            "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Cercles décoratifs */}
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

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              <FolderOpen sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "white" }}>
                Projets
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.9)" }}>
                Gérez vos projets
              </Typography>
            </Box>
          </Box>

          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowForm(true)}
              sx={{
                bgcolor: "white",
                color: "primary",
                fontWeight: 600,
                px: 3,
                py: 1.2,
                borderRadius: 2.5,
                textTransform: "none",
                "&:hover": {
                  bgcolor: "#f8f8f6",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.2s",
              }}
            >
              Nouveau projet
            </Button>
          )}
        </Box>

        {/* Stats */}
        <Grid
          container
          spacing={2}
          sx={{ mt: 3, position: "relative", zIndex: 1 }}
        >
          {[
            {
              label: "Total",
              value: counts.tous,
              icon: <FolderOpen />,
              color: "#fff",
            },
            {
              label: "En cours",
              value: counts["en cours"],
              icon: <PlayCircle />,
              color: "#ee874f",
            },
            {
              label: "Terminés",
              value: counts.terminer,
              icon: <Done />,
              color: "#2e7d32",
            },
            {
              label: "Annulés",
              value: counts.annuller,
              icon: <Block />,
              color: "#d32f2f",
            },
          ].map((stat, i) => (
            <Grid item xs={6} sm={6} xl={3} key={i}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: i === 0 ? "rgba(255,255,255,0.2)" : stat.color,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "white", lineHeight: 1.2 }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ============ FILTRES ============ */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          p: 2,
          bgcolor: alpha(theme.palette.background.paper, 0.9),
        }}
      >
        <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
          {(["tous", "en cours", "terminer", "annuller"] as const).map((st) => {
            const cfg =
              st === "tous"
                ? { label: "Tous", bgColor: "#e3f2fd", textColor: "#1976d2" }
                : getStatusConfig(st);

            return (
              <Chip
                key={st}
                label={`${cfg.label} (${counts[st]})`}
                onClick={() => handleStatusChange(st)}
                sx={{
                  bgcolor: statusFilter === st ? cfg.bgColor : "transparent",
                  color: statusFilter === st ? cfg.textColor : "text.secondary",
                  fontWeight: statusFilter === st ? 700 : 400,
                  "&:hover": { bgcolor: alpha(cfg.bgColor, 0.5) },
                }}
              />
            );
          })}
        </Stack>

        <TextField
          fullWidth
          size="small"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />
      </Paper>

      {/* ============ LISTE DES PROJETS ============ */}
      <Grid container spacing={2}>
        {filteredProjets.map((p) => {
          const cfg = getStatusConfig(p.status);
          return (
            <Grid item xs={12} sm={6} md={4} key={p.id}>
              <Card
                onClick={() => setViewProjet(p)}
                sx={{
                  cursor: "pointer",
                  borderLeft: `4px solid ${cfg.textColor}`,
                  borderRadius: 3,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: `0 6px 20px ${alpha(
                      theme.palette.primary.main,
                      0.15
                    )}`,
                  },
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between">
                    <StatusChip status={p.status} />
                    {isAdmin && (
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuAnchor({ el: e.currentTarget, projet: p });
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    )}
                  </Box>

                  <Typography fontWeight={600} noWrap sx={{ mt: 1 }}>
                    {p.titre}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Responsable : {p.responsable}
                  </Typography>

                  {!!p.lieu && (
                    <Stack direction="row" spacing={0.5} mt={1}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {p.lieu}
                      </Typography>
                    </Stack>
                  )}

                  <Divider sx={{ my: 1 }} />

                  {!!p.date_debut && (
                    <Chip
                      size="small"
                      icon={<AccessTime />}
                      label={`Début : ${formatDate(p.date_debut)}`}
                      sx={{ borderRadius: 2 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* ============ EMPTY STATE ============ */}
      {filteredProjets.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            textAlign: "center",
            py: 8,
            borderRadius: 4,
            border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
          }}
        >
          <FolderOpen
            sx={{
              fontSize: 48,
              color: alpha(theme.palette.primary.main, 0.3),
              mb: 2,
            }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun projet trouvé
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {search
              ? "Modifiez vos critères de recherche"
              : "Ajoutez votre premier projet"}
          </Typography>
          {isAdmin && !search && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowForm(true)}
            >
              Ajouter
            </Button>
          )}
        </Paper>
      )}

      {/* Menu Contextuel */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2, minWidth: 160 },
        }}
      >
        <MenuItem onClick={() => setViewProjet(menuAnchor!.projet)}>
          <ListItemIcon>
            <Visibility fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Voir</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setEditProjet(menuAnchor!.projet)}>
          <ListItemIcon>
            <Edit fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>Modifier</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => setDeleteProjet(menuAnchor!.projet)}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Supprimer</ListItemText>
        </MenuItem>
      </Menu>

      {/* Modals */}
      <ProjetFormModal
        open={showForm || Boolean(editProjet)}
        projet={editProjet}
        onClose={() => {
          setShowForm(false);
          setEditProjet(null);
        }}
      />

      <ProjetViewModal
        open={Boolean(viewProjet)}
        projet={viewProjet}
        onClose={() => setViewProjet(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteProjet)}
        isLoading={isLoading}
        title="Supprimer"
        message={`Supprimer ${deleteProjet?.titre} ?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteProjet(null)}
      />
    </Box>
  );
};

const StatusChip = ({ status }: { status?: string }) => {
  const cfg = getStatusConfig(status);
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ bgcolor: cfg.bgColor, color: cfg.textColor, fontWeight: 700, borderRadius: 2 }}
    />
  );
};

export default Projets;