"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  Button,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  CheckCircle,
  RadioButtonUnchecked,
  LocationOn,
  CalendarToday,
  Group,
  Assignment,
  Print,
  ArrowBack,
  Map,
  InfoOutlined,
} from "@mui/icons-material";

// =======================
// INTERFACES
// =======================

interface MaterielItem {
  id: string;
  nom: string;
  utiliser: number;
  status: "ongoing" | "done";
}

interface ChecklistProps {
  data: {
    id: string; // ✅ ID du checklist pour la mise à jour
    titre: string;
    lieu: string;
    lieu_link: string;
    date_debut: string;
    equipe: string[];
    materiel: MaterielItem[] | string;
    description: string;
  };
  onBack?: () => void;
  onValidate?: (updatedMateriel: MaterielItem[]) => Promise<void>; // ✅ Fonction pour mettre à jour Firestore
}

// =======================
// COMPOSANT
// =======================
const ChecklistMateriel: React.FC<ChecklistProps> = ({
  data,
  onBack,
  onValidate,
}) => {
  // Parsing sécurisé du matériel
  const materielList: MaterielItem[] = useMemo(() => {
    let list: any[] = [];
    
    if (Array.isArray(data.materiel)) {
      list = data.materiel;
    } else {
      try {
        list = JSON.parse(data.materiel || "[]");
      } catch (e) {
        console.error("Erreur parsing matériel", e);
        return [];
      }
    }

    // ✅ Assurer que chaque item a un status (par défaut "ongoing")
    return list.map((m: any) => ({
      id: m.id,
      nom: m.nom,
      utiliser: m.utiliser,
      status: (m.status as "ongoing" | "done") || "ongoing",
    }));
  }, [data.materiel]);

  // ✅ État local pour les items cochés
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // ✅ Initialiser les checkboxes basé sur le status existant dans Firestore
  useEffect(() => {
    const initialChecked: Record<string, boolean> = {};
    materielList.forEach((item) => {
      // Si le status est "done", la checkbox est cochée automatiquement
      initialChecked[item.id] = item.status === "done";
    });
    setCheckedItems(initialChecked);
  }, [materielList]);

  // ✅ Toggle une checkbox (change seulement l'état local, pas Firestore)
  const handleToggle = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectAll = () => {
    const allChecked = materielList.every((m) => checkedItems[m.id]);
    const newState: Record<string, boolean> = {};
    materielList.forEach((m) => {
      newState[m.id] = !allChecked;
    });
    setCheckedItems(newState);
  };

  // Calculs de progression
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = materielList.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
  const isComplete = progress === 100 && totalCount > 0;

  // ✅ Vérifier s'il y a des changements par rapport à l'état initial (Firestore)
  const hasChanges = useMemo(() => {
    return materielList.some((item) => {
      const isCurrentlyChecked = checkedItems[item.id] ?? false;
      const wasChecked = item.status === "done";
      return isCurrentlyChecked !== wasChecked;
    });
  }, [materielList, checkedItems]);

  // ✅ Compter combien d'items ont changé vers "done"
  const newlyCheckedCount = useMemo(() => {
    return materielList.filter((item) => {
      const isCurrentlyChecked = checkedItems[item.id] ?? false;
      const wasChecked = item.status === "done";
      return isCurrentlyChecked && !wasChecked;
    }).length;
  }, [materielList, checkedItems]);

  // Formatage date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Date non définie";
    return new Date(dateStr.replace(" ", "T")).toLocaleString("fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // ✅ Valider et mettre à jour Firestore
  const handleValidate = async () => {
    if (!onValidate) return;

    setLoading(true);
    try {
      // Créer le nouveau tableau de matériel avec les status mis à jour
      const updatedMateriel: MaterielItem[] = materielList.map((item) => ({
        id: item.id,
        nom: item.nom,
        utiliser: item.utiliser,
        status: checkedItems[item.id] ? "done" : "ongoing",
      }));

      console.log("📤 Mise à jour du matériel:", updatedMateriel);
      
      await onValidate(updatedMateriel);
      
      console.log("✅ Validation réussie!");
    } catch (error) {
      console.error("❌ Erreur lors de la validation:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 900,
        mx: "auto",
        p: { xs: 2, md: 4 },
        bgcolor: "#f4f6f0",
        minHeight: "100vh",
      }}
    >
      {/* HEADER / NAVIGATION */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
          sx={{ color: "#6b7052" }}
        >
          Retour
        </Button>
        <Button
          startIcon={<Print />}
          onClick={handlePrint}
          variant="outlined"
          sx={{ borderColor: "#6b7052", color: "#6b7052" }}
        >
          Imprimer la liste
        </Button>
      </Box>

      {/* CARTE PRINCIPALE */}
      <Paper
        elevation={3}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {/* BANDEAU SUPÉRIEUR */}
        <Box
          sx={{
            background:
              "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
            color: "white",
            p: 4,
            position: "relative",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.8 }}>
                Bon de Sortie Matériel
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {data.titre}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
                <Chip
                  icon={<CalendarToday sx={{ color: "white !important" }} />}
                  label={formatDate(data.date_debut)}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "white",
                    fontWeight: 500,
                  }}
                />
                {data.lieu && (
                  <Chip
                    icon={<LocationOn sx={{ color: "white !important" }} />}
                    label={data.lieu}
                    component="a"
                    href={data.lieu_link || "#"}
                    target="_blank"
                    clickable={!!data.lieu_link}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.2)",
                      color: "white",
                      fontWeight: 500,
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* PROGRESS BOX */}
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.9)",
                color: "#555",
                borderRadius: 2,
                p: 2,
                minWidth: 150,
                textAlign: "center",
                boxShadow: 3,
              }}
            >
              <Typography variant="caption" fontWeight={600} display="block">
                PROGRESSION
              </Typography>
              <Typography
                variant="h3"
                color={isComplete ? "success.main" : "text.primary"}
                fontWeight={800}
              >
                {checkedCount}/{totalCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Éléments vérifiés
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* PROGRESS BAR */}
        <LinearProgress
          variant="determinate"
          value={progress}
          color={isComplete ? "success" : "primary"}
          sx={{ height: 8 }}
        />

        <Grid container>
          {/* COLONNE GAUCHE : LISTE MATERIEL */}
          <Grid item xs={12} md={8}>
            <Box sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" fontWeight={700} color="#444">
                  <Assignment
                    sx={{ verticalAlign: "middle", mr: 1, mb: 0.5 }}
                  />
                  Liste des équipements
                </Typography>
                <Button size="small" onClick={handleSelectAll}>
                  {progress === 100 ? "Tout décocher" : "Tout cocher"}
                </Button>
              </Box>

              <Divider sx={{ mb: 1 }} />

              <List sx={{ bgcolor: "background.paper" }}>
                {materielList.length === 0 ? (
                  <Typography
                    color="text.secondary"
                    sx={{ py: 4, textAlign: "center" }}
                  >
                    Aucun matériel assigné à ce projet.
                  </Typography>
                ) : (
                  materielList.map((item) => {
                    const isChecked = !!checkedItems[item.id];
                    const wasAlreadyDone = item.status === "done";

                    return (
                      <React.Fragment key={item.id}>
                        <ListItem
                          button
                          onClick={() => handleToggle(item.id)}
                          sx={{
                            borderRadius: 1,
                            mb: 1,
                            transition: "background 0.2s",
                            bgcolor: isChecked
                              ? "rgba(129, 134, 96, 0.08)"
                              : "transparent",
                            "&:hover": {
                              bgcolor: "rgba(0,0,0,0.04)",
                            },
                            // ✅ Bordure pour indiquer si déjà validé dans Firestore
                            borderLeft: wasAlreadyDone
                              ? "4px solid #4caf50"
                              : "4px solid transparent",
                          }}
                        >
                          <ListItemIcon>
                            <Checkbox
                              edge="start"
                              checked={isChecked}
                              tabIndex={-1}
                              disableRipple
                              icon={<RadioButtonUnchecked />}
                              checkedIcon={<CheckCircle color="success" />}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body1"
                                fontWeight={500}
                                sx={{
                                  textDecoration: isChecked
                                    ? "line-through"
                                    : "none",
                                  color: isChecked
                                    ? "text.disabled"
                                    : "text.primary",
                                }}
                              >
                                {item.nom}
                              </Typography>
                            }
                            secondary={
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Typography variant="caption" color="text.secondary">
                                  Réf: {item.id}
                                </Typography>
                                {/* ✅ Indicateur de status */}
                                <Chip
                                  label={wasAlreadyDone ? "Déjà validé" : "En attente"}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: "0.65rem",
                                    bgcolor: wasAlreadyDone
                                      ? "success.light"
                                      : "warning.light",
                                    color: wasAlreadyDone
                                      ? "success.dark"
                                      : "warning.dark",
                                  }}
                                />
                              </Box>
                            }
                          />
                          <Box sx={{ textAlign: "right" }}>
                            <Chip
                              label={`x ${item.utiliser}`}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                bgcolor: isChecked ? "#e0e0e0" : "#616637",
                                color: isChecked ? "#999" : "white",
                              }}
                            />
                          </Box>
                        </ListItem>
                        <Divider component="li" variant="inset" />
                      </React.Fragment>
                    );
                  })
                )}
              </List>
            </Box>
          </Grid>

          {/* COLONNE DROITE : DETAILS & EQUIPE */}
          <Grid
            item
            xs={12}
            md={4}
            sx={{ bgcolor: "#fafafa", borderLeft: "1px solid #eee" }}
          >
            <Box sx={{ p: 3 }}>
              {/* DESCRIPTION */}
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color="text.secondary"
                gutterBottom
              >
                <InfoOutlined
                  fontSize="small"
                  sx={{ verticalAlign: "middle", mr: 1 }}
                />
                DESCRIPTION / NOTES
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 2, mb: 4, bgcolor: "white", minHeight: 80 }}
              >
                <Typography variant="body2" color="text.secondary">
                  {data.description || "Aucune description fournie."}
                </Typography>
              </Paper>

              {/* EQUIPE */}
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color="text.secondary"
                gutterBottom
              >
                <Group
                  fontSize="small"
                  sx={{ verticalAlign: "middle", mr: 1 }}
                />
                ÉQUIPE ASSIGNÉE
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 4 }}>
                {data.equipe && data.equipe.length > 0 ? (
                  data.equipe.map((membre, index) => (
                    <Chip
                      key={index}
                      avatar={
                        <Avatar sx={{ bgcolor: "#818660" }}>
                          {membre.charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      label={membre}
                      variant="outlined"
                    />
                  ))
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Aucune équipe définie
                  </Typography>
                )}
              </Box>

              {/* CARTE / LIEN */}
              {data.lieu_link && (
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Map />}
                  href={data.lieu_link}
                  target="_blank"
                  sx={{ mb: 2 }}
                >
                  Voir sur la carte
                </Button>
              )}

              {/* ✅ RÉSUMÉ DES CHANGEMENTS */}
              {hasChanges && (
                <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: "info.light",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" color="info.dark" fontWeight={500}>
                    📝 {newlyCheckedCount} nouveau(x) élément(s) à valider
                  </Typography>
                </Paper>
              )}

              {/* ✅ BOUTON VALIDATION */}
              <Box sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  size="large"
                  disabled={loading || !hasChanges} // ✅ Désactivé si pas de changements
                  onClick={handleValidate}
                  sx={{
                    py: 1.5,
                    boxShadow: 4,
                    opacity: hasChanges ? 1 : 0.7,
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : isComplete && !hasChanges ? (
                    "✓ Tout validé"
                  ) : hasChanges ? (
                    "Valider les changements"
                  ) : (
                    `Reste ${totalCount - checkedCount} articles`
                  )}
                </Button>

                {/* ✅ Message informatif */}
                {!hasChanges && checkedCount > 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", textAlign: "center", mt: 1 }}
                  >
                    Aucun changement à sauvegarder
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ChecklistMateriel;