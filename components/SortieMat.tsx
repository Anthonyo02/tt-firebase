"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  Dialog,
  IconButton,
  Tooltip,
  Alert,
  Stack,
  Fab,
  Paper,
  Avatar,
  alpha,
  useTheme,
} from "@mui/material";
import {
  CheckCircle,
  LocationOn,
  Group,
  Inventory2,
  Close,
  CalendarToday,
  Add,
  Edit,
  PlaylistAddCheck,
  Delete,
  Schedule,
  Today,
  AssignmentTurnedIn,
} from "@mui/icons-material";
import { useData, CheckList } from "@/context/DataContext";
import ChecklistMateriel from "./modals/SortieMaterielCheckModal";
import CheckListModal from "./modals/CheckListModal";

// =======================
// INTERFACE MATERIEL
// =======================
interface MaterielItem {
  id: string;
  nom: string;
  utiliser: number;
  status: "ongoing" | "done";
}

// =======================
// COMPOSANT : Liste des Checklists
// =======================
const ChecklistList: React.FC = () => {
  const theme = useTheme();
  const { checklists, deleteChecklist, updateChecklist, fetchChecklists } = useData();

  // État pour le modal d'Exécution (Faire la checklist)
  const [executionData, setExecutionData] = useState<CheckList | null>(null);
  const [executionModalOpen, setExecutionModalOpen] = useState(false);

  // État pour le modal d'Édition/Création
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<CheckList | null>(null);

  // =======================
  // STATISTIQUES
  // =======================
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    let total = 0;
    let terminees = 0;
    let enCours = 0;
    let aujourdhui = 0;

    checklists.forEach((c) => {
      total++;

      // Vérifier si aujourd'hui
      if (c.date_debut) {
        const checklistDate = new Date(c.date_debut.replace(" ", "T")).toDateString();
        if (checklistDate === todayStr) {
          aujourdhui++;
        }
      }

      // Calculer progression
      const materielArray = Array.isArray(c.materiel)
        ? c.materiel
        : JSON.parse((c.materiel as string) || "[]");

      const totalItems = materielArray.length;
      if (totalItems > 0) {
        const doneItems = materielArray.filter((m: any) => m.status === "done").length;
        if (doneItems === totalItems) {
          terminees++;
        } else if (doneItems > 0) {
          enCours++;
        }
      }
    });

    return { total, terminees, enCours, aujourdhui };
  }, [checklists]);

  // =======================
  // LOGIQUE DE FILTRE
  // =======================
  const checklistsAPreparer = useMemo(() => {
    const now = new Date();
    return checklists
      .filter((c) => {
        if (!c.date_debut) return false;
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date_debut.replace(" ", "T")).getTime();
        const dateB = new Date(b.date_debut.replace(" ", "T")).getTime();
        return Math.abs(dateA - now.getTime()) - Math.abs(dateB - now.getTime());
      });
  }, [checklists]);

  // =======================
  // ACTIONS
  // =======================

  const handleOpenEdit = (checklist: CheckList | null = null) => {
    setSelectedChecklist(checklist);
    setEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setEditModalOpen(false);
    setSelectedChecklist(null);
  };

  const handleOpenExecution = (checklist: CheckList) => {
    setExecutionData(checklist);
    setExecutionModalOpen(true);
  };

  const handleCloseExecution = () => {
    setExecutionModalOpen(false);
    setExecutionData(null);
  };

  const handleValidateMateriel = async (updatedMateriel: MaterielItem[]) => {
    if (!executionData) return;

    try {
      console.log("📤 Mise à jour des matériels dans Firestore...");
      console.log("Checklist ID:", executionData.id);
      console.log("Matériels mis à jour:", updatedMateriel);

      await updateChecklist(executionData.id, {
        materiel: updatedMateriel,
      });

      await fetchChecklists();

      console.log("✅ Matériels validés avec succès!");

      handleCloseExecution();
    } catch (error) {
      console.error("❌ Erreur lors de la validation:", error);
      throw error;
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Voulez-vous vraiment supprimer cette checklist ?")) {
      await deleteChecklist(id);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr.replace(" ", "T")).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getChecklistProgress = (checklist: CheckList) => {
    const materielArray = Array.isArray(checklist.materiel)
      ? checklist.materiel
      : JSON.parse((checklist.materiel as string) || "[]");

    const total = materielArray.length;
    if (total === 0) return { done: 0, total: 0, percent: 0 };

    const done = materielArray.filter((m: any) => m.status === "done").length;
    return {
      done,
      total,
      percent: Math.round((done / total) * 100),
    };
  };

  return (
    <>
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
        {/* ================== HEADER STYLISÉ ================== */}
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
              position: "absolute",
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.05)",
              top: 40,
              left: "60%",
            }}
          />

          {/* Contenu Header */}
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
                <PlaylistAddCheck sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "white" }}>
                  Checklists
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.9)" }}>
                  Gérez vos listes de matériel
                </Typography>
              </Box>
            </Box>

            {/* BOUTON CRÉER */}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenEdit(null)}
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
              Nouvelle Checklist
            </Button>
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
                value: stats.total,
                icon: <PlaylistAddCheck />,
                color: "#fff",
              },
              {
                label: "Terminées",
                value: stats.terminees,
                icon: <AssignmentTurnedIn />,
                color: "#4caf50",
              },
              {
                label: "En cours",
                value: stats.enCours,
                icon: <Schedule />,
                color: "#ff9800",
              },
              {
                label: "Aujourd'hui",
                value: stats.aujourdhui,
                icon: <Today />,
                color: "#2196f3",
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
                    transition: "transform 0.2s, background 0.2s",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.2)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: i === 0 ? "rgba(255,255,255,0.2)" : stat.color,
                        boxShadow: i !== 0 ? `0 4px 14px ${alpha(stat.color, 0.4)}` : "none",
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

        {/* ================== LISTE DES CHECKLISTS ================== */}
        {checklistsAPreparer.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              textAlign: "center",
              py: 8,
              borderRadius: 4,
              border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.8),
            }}
          >
            <PlaylistAddCheck
              sx={{
                fontSize: 64,
                color: alpha(theme.palette.primary.main, 0.3),
                mb: 2,
              }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune checklist trouvée
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Cliquez sur "Nouvelle Checklist" pour commencer
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenEdit(null)}
              sx={{
                bgcolor: "#5c6bc0",
                "&:hover": { bgcolor: "#3f51b5" },
              }}
            >
              Créer une checklist
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {checklistsAPreparer.map((checklist) => {
              const materielArray = Array.isArray(checklist.materiel)
                ? checklist.materiel
                : JSON.parse((checklist.materiel as string) || "[]");

              const nbMateriel = materielArray.reduce(
                (acc: number, m: any) => acc + (m.utiliser || 0),
                0
              );

              const progress = getChecklistProgress(checklist);
              const isComplete = progress.percent === 100 && progress.total > 0;

              const isToday =
                checklist.date_debut &&
                new Date(checklist.date_debut.replace(" ", "T")).toDateString() ===
                  new Date().toDateString();

              return (
                <Grid item xs={12} sm={6} md={4} key={checklist.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border: isComplete
                        ? "2px solid #4caf50"
                        : isToday
                        ? "2px solid #5c6bc0"
                        : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      boxShadow: isToday
                        ? "0 4px 20px rgba(92,107,192,0.25)"
                        : `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
                      transition: "all 0.3s",
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.background.paper, 0.95),
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.15)}`,
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      {/* En-tête Carte */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{
                            pr: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "#333",
                          }}
                        >
                          {checklist.titre}
                        </Typography>

                        <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                          <Tooltip title="Modifier">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(checklist);
                              }}
                              sx={{ color: "text.secondary" }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              onClick={(e) => handleDelete(checklist.id, e)}
                              sx={{ color: "error.main" }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Badges status */}
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                        {isComplete && (
                          <Chip
                            label="TERMINÉ"
                            size="small"
                            color="success"
                            icon={<CheckCircle />}
                            sx={{ fontWeight: 800, fontSize: "0.65rem", height: 24 }}
                          />
                        )}
                        {isToday && !isComplete && (
                          <Chip
                            label="AUJOURD'HUI"
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 800, fontSize: "0.65rem", height: 20 }}
                          />
                        )}
                        {progress.total > 0 && !isComplete && (
                          <Chip
                            label={`${progress.done}/${progress.total} validés`}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.65rem",
                              height: 20,
                              borderColor: progress.done > 0 ? "#4caf50" : "#bdbdbd",
                              color: progress.done > 0 ? "#4caf50" : "#757575",
                            }}
                          />
                        )}
                      </Box>

                      <Divider sx={{ my: 1.5, borderColor: "rgba(0,0,0,0.05)" }} />

                      {/* Détails */}
                      <Stack spacing={1.5} sx={{ mt: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            {formatDate(checklist.date_debut)}
                          </Typography>
                        </Box>

                        {checklist.lieu && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {checklist.lieu}
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Group fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {checklist.responsable?.length || 0} responsable(s)
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Inventory2 fontSize="small" color="action" />
                          <Typography variant="body2" fontWeight={600} color="#5c6bc0">
                            {nbMateriel} équipements à préparer
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>

                    <CardActions sx={{ pt: 0, pb: 3, px: 3 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={isComplete ? <CheckCircle /> : <PlaylistAddCheck />}
                        onClick={() => handleOpenExecution(checklist)}
                        sx={{
                          bgcolor: isComplete ? "#4caf50" : "#5c6bc0",
                          "&:hover": { bgcolor: isComplete ? "#388e3c" : "#3f51b5" },
                          fontWeight: 700,
                          py: 1.2,
                          borderRadius: 2,
                          boxShadow: isComplete
                            ? "0 4px 12px rgba(76,175,80,0.3)"
                            : "0 4px 12px rgba(92,107,192,0.3)",
                        }}
                      >
                        {isComplete ? "Voir la Checklist" : "Lancer la Checklist"}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* BOUTON FLOTTANT MOBILE */}
      <Fab
        color="primary"
        onClick={() => handleOpenEdit(null)}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          bgcolor: "#5c6bc0",
          "&:hover": { bgcolor: "#3f51b5" },
          display: { xs: "flex", md: "none" },
          boxShadow: "0 4px 20px rgba(92,107,192,0.4)",
        }}
      >
        <Add />
      </Fab>

      {/* ================== MODAL : CRÉATION / ÉDITION ================== */}
      <CheckListModal
        open={editModalOpen}
        checklist={selectedChecklist}
        onClose={handleCloseEdit}
      />

      {/* ================== MODAL : EXÉCUTION (Sortie Matériel) ================== */}
      <Dialog
        open={executionModalOpen}
        onClose={handleCloseExecution}
        maxWidth="lg"
        fullWidth
        fullScreen
        sx={{
          "& .MuiDialog-paper": {
            bgcolor: "#f4f6f0",
          },
        }}
      >
        <Box sx={{ position: "relative", minHeight: "100vh" }}>
          <IconButton
            onClick={handleCloseExecution}
            sx={{
              position: "fixed",
              right: 20,
              top: 20,
              zIndex: 1300,
              bgcolor: "white",
              boxShadow: 2,
              "&:hover": { bgcolor: "#f5f5f5" },
            }}
          >
            <Close />
          </IconButton>

          {executionData && (
            <ChecklistMateriel
              data={{
                id: executionData.id,
                titre: executionData.titre,
                lieu: executionData.lieu,
                lieu_link: executionData.lieu_link,
                date_debut: executionData.date_debut,
                materiel: Array.isArray(executionData.materiel)
                  ? executionData.materiel.map((m: any) => ({
                      id: m.id,
                      nom: m.nom,
                      utiliser: m.utiliser,
                      status: m.status || "ongoing",
                    }))
                  : [],
                equipe: executionData.responsable,
                description: executionData.description,
              }}
              onBack={handleCloseExecution}
              onValidate={handleValidateMateriel}
            />
          )}
        </Box>
      </Dialog>
    </>
  );
};

export default ChecklistList;