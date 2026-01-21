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
} from "@mui/icons-material";

import { useAuth } from "../context/AuthContext";
// 🔥 Import du Contexte (C'est lui qui gère LocalForage + Firebase)
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
  
  // ✅ On récupère les données et la fonction delete depuis le Contexte
  const { projets, deleteProjet: contextDeleteProjet } = useData();
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusFilter = searchParams.get("status") || "tous";

  // Plus besoin de state local 'projets', on utilise celui du contexte
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
    // On filtre sur la liste venant du contexte
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
      // ✅ Appel au contexte qui gère Firestore et LocalForage
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
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Projets
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredProjets.length} projet(s)
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={() => setShowForm(true)}
          >
            Nouveau projet
          </Button>
        )}
      </Box>

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
        placeholder="Rechercher..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

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
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
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

                  <Typography fontWeight={600} noWrap>
                    {p.titre}
                  </Typography>

                  <Typography variant="body2">
                    Responsable : {p.responsable}
                  </Typography>

                  {!!p.lieu && (
                    <Stack direction="row" spacing={0.5} mt={1}>
                      <LocationOn fontSize="small" />
                      <Typography variant="caption">{p.lieu}</Typography>
                    </Stack>
                  )}

                  <Divider sx={{ my: 1 }} />

                  {!!p.date_debut && (
                    <Chip
                      size="small"
                      icon={<AccessTime />}
                      label={`Début : ${formatDate(p.date_debut)}`}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Menu Contextuel */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => setViewProjet(menuAnchor!.projet)}>
          <ListItemIcon>
            <Visibility />
          </ListItemIcon>
          <ListItemText>Voir</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setEditProjet(menuAnchor!.projet)}>
          <ListItemIcon>
            <Edit />
          </ListItemIcon>
          <ListItemText>Modifier</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setDeleteProjet(menuAnchor!.projet)}>
          <ListItemIcon>
            <Delete />
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
      sx={{ bgcolor: cfg.bgColor, color: cfg.textColor, fontWeight: 700 }}
    />
  );
};

export default Projets;