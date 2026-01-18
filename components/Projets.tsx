"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Folder,
  LocationOn,
  CheckCircle,
  Schedule,
  Cancel,
  AccessTime,
} from "@mui/icons-material";

import { useAuth } from "../context/AuthContext";
import { Projet } from "../context/DataContext";
import ProjetFormModal from "../components/modals/ProjetFormModal";
import ProjetViewModal from "../components/modals/ProjetViewModal";
import ConfirmDialog from "../components/modals/ConfirmDialog";

import { useRouter, useSearchParams } from "next/navigation";

// 🔥 FIREBASE
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

// ✅ Import LocalForage
import storage from "../lib/localforage";

const STORAGE_KEY = "projets";

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

const normalizeProjet = (raw: any): Projet => ({
  id: String(raw.id ?? ""),
  titre: String(raw.titre ?? ""),
  lieu: String(raw.lieu ?? ""),
  lieu_link: String(raw.lieu_link ?? ""),
  date_debut: String(raw.date_debut ?? ""),
  date_fin: raw.date_fin ? String(raw.date_fin) : undefined,
  responsable: String(raw.responsable ?? ""),
  equipe: Array.isArray(raw.equipe) ? raw.equipe : [],
  materiel: Array.isArray(raw.materiel) ? raw.materiel : [],
  detail: String(raw.detail ?? ""),
  status: raw.status ?? "en cours",
  commentaire: String(raw.commentaire ?? ""),
});

/* =====================================================
   COMPONENT
===================================================== */
const Projets: React.FC = () => {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusFilter = searchParams.get("status") || "tous";

  const [projets, setProjets] = useState<Projet[]>([]);
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

  // ✅ Chargement initial depuis LocalForage (Asynchrone)
  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const storedProjets = await storage.getItem<Projet[]>(STORAGE_KEY);
        if (storedProjets && Array.isArray(storedProjets)) {
          setProjets(storedProjets.map(normalizeProjet));
        }
      } catch (error) {
        console.error("Erreur chargement localForage projets:", error);
      }
    };
    loadFromStorage();
  }, []);

  /* =====================================================
     🔥 FIRESTORE REALTIME SYNC
  ===================================================== */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "projets"), (snap) => {
      const data: Projet[] = snap.docs.map((d) =>
        normalizeProjet({ id: d.id, ...d.data() })
      );
      
      // Mise à jour du state
      setProjets(data);
      
      // ✅ Sauvegarde dans LocalForage
      storage.setItem(STORAGE_KEY, data).catch(err => 
        console.error("Erreur sauvegarde localForage:", err)
      );
    });

    return () => unsub();
  }, []);

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
     DELETE
  ===================================================== */
  const handleDelete = async () => {
    if (!deleteProjet) return;
    setIsLoading(true);

    // Optimistic UI update (Optionnel mais recommandé)
    const newProjets = projets.filter(p => p.id !== deleteProjet.id);
    setProjets(newProjets);
    storage.setItem(STORAGE_KEY, newProjets);

    try {
      await deleteDoc(doc(db, "projets", deleteProjet.id));
      setDeleteProjet(null);
      setMenuAnchor(null);
    } catch (error) {
      console.error("Erreur suppression:", error);
      // Rollback si erreur (recharger depuis localForage ou Firestore se fera automatiquement)
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

    router.replace(`?${params.toString()}`); // remplace l'URL sans recharger
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