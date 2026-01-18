"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  forwardRef,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Autocomplete,
  IconButton,
  Typography,
  Checkbox,
  Avatar,
  Slide,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  InputAdornment,
} from "@mui/material";
import {
  Add,
  Remove,
  Close,
  Assignment,
  CheckCircle,
  AccessTime,
  Cancel,
  PlayArrow,
  CheckBoxOutlineBlank,
  CheckBox,
  MapOutlined,
} from "@mui/icons-material";
import { TransitionProps } from "@mui/material/transitions";
import { useData, Projet } from "@/context/DataContext";
import MapPickerModal from "./Map";

// =======================
// TRANSITION
// =======================
const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// =======================
// INTERFACES
// =======================
interface ProjetFormModalProps {
  open: boolean;
  projet: Projet | null;
  onClose: () => void;
}

interface MaterielUtilise {
  id: string;
  nom: string;
  utiliser: number;
}

interface FormState {
  titre: string;
  lieu: string;
  lieu_link: string;
  date_debut: string;
  date_fin: string;
  responsable: string;
  equipe: string[];
  materiel: MaterielUtilise[];
  detail: string;
  status: "en cours" | "terminer" | "annuller";
  commentaire: string;
}

// =======================
// COMPOSANT PRINCIPAL
// =======================
const ProjetFormModalOff: React.FC<ProjetFormModalProps> = ({
  open,
  projet,
  onClose,
}) => {
  // =======================
  // HOOKS ET ÉTATS
  // =======================
  const { users, projets, fetchProjets, addProjet, updateProjet, materiels } = useData();

  const [form, setForm] = useState<FormState>({
    titre: "",
    lieu: "",
    lieu_link: "",
    date_debut: "",
    date_fin: "",
    responsable: "",
    equipe: [],
    materiel: [],
    detail: "",
    status: "en cours",
    commentaire: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const isManualStatusChange = useRef(false);
  const initialDateDebut = useRef<string | null>(null);

  const icon = <CheckBoxOutlineBlank fontSize="small" />;
  const checkedIcon = <CheckBox fontSize="small" />;

  // =======================
  // UTILITAIRES
  // =======================

  const extractMaterielsFromProjet = useCallback(
    (projetData: any): MaterielUtilise[] => {
      if (!projetData.materiel) return [];

      let materielData = projetData.materiel;

      if (typeof materielData === "string") {
        try {
          materielData = JSON.parse(materielData);
        } catch (e) {
          console.error("Erreur parsing matériel:", e);
          return [];
        }
      }

      if (!Array.isArray(materielData)) return [];

      return materielData
        .map((m: any) => ({
          id: String(m.id || ""),
          nom: String(m.nom || ""),
          utiliser: Number(m.utiliser || 0),
        }))
        .filter((m) => m.id && m.utiliser > 0);
    },
    []
  );

  const isDateDebutPassed = useCallback((date: string): boolean => {
    if (!date) return false;
    return new Date(date.replace(" ", "T")) < new Date();
  }, []);

  const getStartOfDay = useCallback((dateStr: string): Date | null => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const getEndOfDay = useCallback((dateStr: string): Date | null => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }, []);

  const areIntervalsOverlapping = useCallback(
    (startA: Date, endA: Date, startB: Date, endB: Date): boolean => {
      return startA <= endB && endA >= startB;
    },
    []
  );

  const isProjetOverlapping = useCallback(
    (projetItem: any): boolean => {
      if (!form.date_debut || !projetItem.date_debut) return false;

      const currentStart = getStartOfDay(form.date_debut);
      const currentEnd = form.date_fin
        ? getEndOfDay(form.date_fin)
        : getEndOfDay(form.date_debut);
      const projetStart = getStartOfDay(projetItem.date_debut);
      const projetEnd = projetItem.date_fin
        ? getEndOfDay(projetItem.date_fin)
        : getEndOfDay(projetItem.date_debut);

      if (!currentStart || !currentEnd || !projetStart || !projetEnd) return false;

      return areIntervalsOverlapping(currentStart, currentEnd, projetStart, projetEnd);
    },
    [form.date_debut, form.date_fin, getStartOfDay, getEndOfDay, areIntervalsOverlapping]
  );

  // =======================
  // CALCULS DES STOCKS
  // =======================

  const calculateQuantiteUtilisee = useCallback(
    (materielId: string): number => {
      let totalUtilise = 0;

      for (const p of projets) {
        // Exclure le projet en cours d'édition de son propre calcul de stock
        // et exclure les projets "annuller" ou "terminer" du calcul du stock.
        if (
          (projet && String(p.id) === String(projet.id)) ||
          p.status === "annuller" ||
         p.status === "terminer" // <-- Ajout de cette condition
        ) {
          continue;
        }

        // Si la date du projet actuel (dans la boucle) ne chevauche pas celle du formulaire, on l'ignore
        if (!isProjetOverlapping(p)) continue;

        const materielsDuProjet = extractMaterielsFromProjet(p);
        const materielUtilise = materielsDuProjet.find((m) => m.id === materielId);

        if (materielUtilise) {
          totalUtilise += materielUtilise.utiliser;
        }
      }
      return totalUtilise;
    },
    [projets, projet, isProjetOverlapping, extractMaterielsFromProjet]
  );

  const materielsDisponibles = useMemo(() => {
    if (!form.date_debut || materiels.length === 0) {
      return materiels.map((m) => ({
        ...m,
        disponible: m.quantites,
      }));
    }

    return materiels.map((mat) => {
      const quantiteUtilisee = calculateQuantiteUtilisee(mat.id);
      const disponible = Math.max(0, mat.quantites - quantiteUtilisee);

      return {
        ...mat,
        disponible,
      };
    });
  }, [materiels, form.date_debut, calculateQuantiteUtilisee]);

  const sortedMateriels = useMemo(() => {
    const selectedIds = new Set(form.materiel.map((m) => m.id));
    return [...materielsDisponibles].sort((a, b) => {
      const aSel = selectedIds.has(a.id) ? 0 : 1;
      const bSel = selectedIds.has(b.id) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      return a.nom.localeCompare(b.nom);
    });
  }, [materielsDisponibles, form.materiel]);

  const selectedMateriels = useMemo(
    () =>
      materielsDisponibles.filter((m) =>
        form.materiel.some((fm) => fm.id === m.id)
      ),
    [materielsDisponibles, form.materiel]
  );

  // =======================
  // VALIDATION & EFFETS
  // =======================

  const isFormValid = useMemo(() => {
    return (
      form.titre.trim() !== "" &&
      form.date_debut !== "" &&
      form.responsable.trim() !== "" &&
      form.materiel.length > 0
    );
  }, [form]);

  const verifierConflitsMateriel = useCallback((): string[] => {
    const erreurs: string[] = [];
    if (!form.date_debut || form.materiel.length === 0) return erreurs;

    for (const mUtilise of form.materiel) {
      const materielStock = materiels.find((m) => m.id === mUtilise.id);
      if (!materielStock) continue;

      // Recalculer la quantité utilisée en excluant la quantité du matériel actuel
      // si on est en mode édition et que ce matériel est déjà dans le projet.
      let quantiteDejaReserveeParAutresProjets = calculateQuantiteUtilisee(mUtilise.id);

      // Si le projet est en mode édition, et que le matériel est déjà présent,
      // la quantité déjà utilisée par le projet lui-même ne devrait pas être considérée comme un conflit.
      // C'est déjà géré par calculateQuantiteUtilisee qui exclut `projet.id`.
      // Donc, `quantiteDejaReserveeParAutresProjets` est déjà la quantité des AUTRES projets actifs.

      const quantiteTotaleDemandee = mUtilise.utiliser;
      const stockRestantApresAutresProjets = materielStock.quantites - quantiteDejaReserveeParAutresProjets;


      if (quantiteTotaleDemandee > stockRestantApresAutresProjets) {
        erreurs.push(
          `${mUtilise.nom}: Stock insuffisant. Demandé: ${mUtilise.utiliser}. ` +
          `Stock total: ${materielStock.quantites}. Déjà réservé par d'autres projets actifs: ${quantiteDejaReserveeParAutresProjets}. ` +
          `Quantité disponible pour ce projet: ${stockRestantApresAutresProjets}.`
        );
      }
    }
    return erreurs;
  }, [form, materiels, calculateQuantiteUtilisee]);


  // Gestion automatique du statut selon la date
  useEffect(() => {
    if (!open) return; // Ne rien faire si le modal n'est pas ouvert
    if (!form.date_debut) return;
    if (projet && isManualStatusChange.current) return; // Ne pas écraser un changement manuel de statut
    if (projet && initialDateDebut.current === form.date_debut) return; // Ne pas changer si la date de début n'a pas changé

    // La logique de détermination du statut automatique
    const newAutoStatus = isDateDebutPassed(form.date_debut)
      ? "terminer"
      : "en cours";

    setForm((prev) => ({
      ...prev,
      status:
        // Si le statut précédent était "en cours" ou "terminer", on applique le statut automatique.
        // Sinon (si c'était "annuller" manuellement), on garde "annuller".
        prev.status === "en cours" || prev.status === "terminer"
          ? newAutoStatus
          : prev.status,
    }));

    isManualStatusChange.current = false; // Réinitialiser après l'exécution de l'effet
  }, [form.date_debut, projet, isDateDebutPassed, open]);


  const handleStatusChange = useCallback(
    (newStatus: "en cours" | "annuller") => {
      if (!projet) {
        setError("Impossible de changer le statut en création.");
        return;
      }
      // Logique simple de bascule
      setForm((p) => ({ ...p, status: newStatus }));
      isManualStatusChange.current = true; // Indiquer un changement manuel
    },
    [projet]
  );

  const handleChange = useCallback((field: keyof FormState, value: any) => {
    setForm((prev) => {
      let newForm = { ...prev, [field]: value };
      if (field === "responsable") {
        // Le responsable ne peut pas être dans l'équipe
        newForm.equipe = prev.equipe.filter((u) => u !== value);
      }
      return newForm;
    });

    if (field !== "status") {
      isManualStatusChange.current = false; // Si d'autres champs sont modifiés, le statut n'est plus "manuel"
    }
  }, []);

  // Initialisation du formulaire
  useEffect(() => {
    if (!open) return; // Ne rien faire si le modal est fermé

    isManualStatusChange.current = false; // Réinitialiser le drapeau manuel

    if (projet) {
      const existingMateriel = extractMaterielsFromProjet(projet);
      const dateDebut = projet.date_debut || "";
      initialDateDebut.current = dateDebut; // Stocker la date de début initiale

      setForm({
        titre: projet.titre ?? "",
        lieu: projet.lieu ?? "",
        lieu_link: projet.lieu_link ?? "",
        date_debut: dateDebut,
        date_fin: projet.date_fin || "",
        responsable: projet.responsable ?? "",
        equipe: Array.isArray(projet.equipe) ? projet.equipe : [],
        materiel: existingMateriel,
        detail: projet.detail ?? "",
        status: projet.status ?? "en cours",
        commentaire: projet.commentaire ?? "",
      });
    } else {
      // Pour un nouveau projet, définir les valeurs par défaut
      const now = new Date();
      // Ajustement pour le fuseau horaire local pour que toISOString() donne la bonne date/heure locale
      const offset = now.getTimezoneOffset() * 60000;
      const todayString = new Date(now.getTime() - offset)
        .toISOString()
        .slice(0, 16); // Format YYYY-MM-DDTHH:MM

      initialDateDebut.current = null; // Pas de date initiale pour un nouveau projet
      setForm({
        titre: "",
        lieu: "",
        lieu_link: "",
        date_debut: todayString,
        date_fin: "",
        responsable: "",
        equipe: [],
        materiel: [],
        detail: "",
        status: "en cours",
        commentaire: "",
      });
    }

    // Réinitialiser les messages d'état
    setError("");
    setSuccess(false);
    setSubmitted(false);
  }, [projet, open, extractMaterielsFromProjet]);

  // =======================
  // SAUVEGARDE & LOCALFORAGE
  // =======================
  const save = useCallback(async () => {
    setSubmitted(true);
    if (!isFormValid) {
      setError("Veuillez remplir les champs obligatoires.");
      return;
    }

    const conflits = verifierConflitsMateriel();
    if (conflits.length > 0) {
      setError(`Conflit de stock détecté : ${conflits.join(", ")}`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("💾 Sauvegarde en cours...");

      // 1. Sauvegarde dans Firebase via le Contexte
      if (projet) {
        await updateProjet(projet.id, form);
      } else {
        await addProjet(form);
      }

      // 2. SYNCHRONISATION CRITIQUE AVEC LOCALFORAGE
      // On force le fetch pour récupérer les dernières données du serveur
      // et mettre à jour le stockage local (LocalForage) via useData
      console.log("🔄 Synchronisation avec LocalForage...");
      await fetchProjets();
      onClose(),

      setSuccess(true);
      // setTimeout(() => onClose(), 800);
    } catch (err: any) {
      console.error("❌ Erreur sauvegarde:", err);
      setError("Échec de la sauvegarde : " + err.message);
    } finally {
      setLoading(false);
    }
  }, [
    isFormValid,
    verifierConflitsMateriel,
    projet,
    form,
    addProjet,
    updateProjet,
    fetchProjets,
    onClose // Ajout de onClose aux dépendances pour être correct
  ]);

  // =======================
  // UI HELPERS
  // =======================
  const toInputDateTime = useCallback((value: string): string => {
    return value ? value.replace(" ", "T").slice(0, 16) : "";
  }, []);

  const fromInputDateTime = useCallback((value: string): string => {
    return value ? value.replace("T", " ") : "";
  }, []);

  const isUpdateMode = !!projet;
  const canToggleToAnnuler = isUpdateMode && form.status === "en cours";
  const canToggleToEncours = isUpdateMode && form.status === "annuller";
  const userNames = useMemo(() => users.map((u) => u.nom), [users]);

  // =======================
  // RENDER
  // =======================
  return (
    <>
      {/* <Dialog
        open={open}
        onClose={!loading ? onClose : undefined}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Transition}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
            position: "relative",
            overflow: "hidden",
            py: 3,
            px: 3,
          }}
        >
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

          <IconButton
            onClick={onClose}
            disabled={loading}
            sx={{ position: "absolute", right: 12, top: 12, color: "white" }}
          >
            <Close />
          </IconButton>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}>
              <Assignment />
            </Avatar>

            <Box>
              <Typography variant="h5" fontWeight={700} color="white">
                {projet ? "Modifier le projet" : "Nouveau projet"}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                <Chip
                  icon={
                    isDateDebutPassed(form.date_debut) ? (
                      <CheckCircle />
                    ) : (
                      <AccessTime />
                    )
                  }
                  label={
                    form.status === "annuller"
                      ? "Annulé"
                      : isDateDebutPassed(form.date_debut) 
                      ? "Terminé" // Si la date est passée ET non annulé
                      : form.status // Sinon, afficher le statut réel ("en cours")
                  }
                  color={
                    form.status === "annuller"
                      ? "error"
                      : isDateDebutPassed(form.date_debut)
                      ? "success"
                      : "warning"
                  }
                  sx={{ fontWeight: 600, textTransform: "capitalize" }}
                  size="small"
                />

                {canToggleToAnnuler && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Cancel />}
                    onClick={() => handleStatusChange("annuller")}
                    sx={{
                      color: "white",
                      borderColor: "white",
                      minHeight: 24,
                      padding: "0 8px",
                      fontSize: "0.75rem",
                      textTransform: "none",
                      lineHeight: 1.2,
                      "& .MuiButton-startIcon": { marginRight: "4px", marginLeft: "-2px", fontSize: "18px" },
                      "&:hover": { background: "rgba(255, 0, 0, 0.3)" }, // Légère modification pour le hover
                    }}
                  >
                    Annuler Projet
                  </Button>
                )}

                {canToggleToEncours && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PlayArrow />}
                    onClick={() => handleStatusChange("en cours")}
                    sx={{
                      color: "white",
                      borderColor: "white",
                      minHeight: 24,
                      padding: "0 8px",
                      fontSize: "0.75rem",
                      textTransform: "none",
                      lineHeight: 1.2,
                      "& .MuiButton-startIcon": { marginRight: "4px", marginLeft: "-2px", fontSize: "18px" },
                      "&:hover": { background: "rgba(255, 145, 0, 0.3)" }, // Légère modification pour le hover
                    }}
                  >
                    Réactiver
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        <DialogContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Enregistré avec succès !</Alert>}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              label="Titre *"
              value={form.titre}
              onChange={(e) => handleChange("titre", e.target.value)}
              fullWidth
              error={submitted && !form.titre}
              helperText={submitted && !form.titre ? "Le titre est requis" : ""}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Date début *"
                  type="datetime-local"
                  value={toInputDateTime(form.date_debut)}
                  onChange={(e) => {
                    const val = fromInputDateTime(e.target.value);
                    handleChange("date_debut", val);
                    if (
                      form.date_fin &&
                      new Date(val) > new Date(form.date_fin.replace(" ", "T"))
                    ) {
                      // Si la date de début devient après la date de fin, ajuster la date de fin
                      handleChange("date_fin", val);
                    }
                  }}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  error={submitted && !form.date_debut}
                  helperText={submitted && !form.date_debut ? "La date de début est requise" : ""}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Date fin"
                  type="datetime-local"
                  value={toInputDateTime(form.date_fin)}
                  onChange={(e) =>
                    handleChange("date_fin", fromInputDateTime(e.target.value))
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  inputProps={{ min: toInputDateTime(form.date_debut) }} // La date de fin ne peut pas être avant la date de début
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Lieu"
                  fullWidth
                  value={form.lieu}
                  onChange={(e) => handleChange("lieu", e.target.value)}
                  // Pas d'erreur ici, car le lieu n'est pas obligatoire
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Lien Lieu"
                  fullWidth
                  value={form.lieu_link}
                  onChange={(e) => handleChange("lieu_link", e.target.value)}
                  placeholder="Saisir ou utiliser la carte"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setMapModalOpen(true)}
                          edge="end"
                          color="primary"
                          title="Ouvrir la carte"
                        >
                          <MapOutlined />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Autocomplete
              freeSolo
              options={userNames}
              value={form.responsable}
              onChange={(_, v) => handleChange("responsable", v ?? "")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Responsable *"
                  error={submitted && !form.responsable}
                  helperText={submitted && !form.responsable ? "Le responsable est requis" : ""}
                />
              )}
            />

            <Autocomplete
              multiple
              disableCloseOnSelect
              options={userNames.filter((u) => u !== form.responsable)} // Le responsable ne peut pas être dans l'équipe
              value={form.equipe}
              onChange={(_, v) => handleChange("equipe", v)}
              getOptionLabel={(option) => option}
              renderOption={(props, option, { selected }) => {
                const { key, ...restProps } = props;
                return (
                  <li key={key} {...restProps}>
                    <Checkbox
                      icon={icon}
                      checkedIcon={checkedIcon}
                      checked={selected}
                      sx={{ mr: 1 }}
                    />
                    {option}
                  </li>
                );
              }}
              renderInput={(params) => <TextField {...params} label="Équipe" />}
            />

            <Autocomplete
              multiple
              disableCloseOnSelect
              options={sortedMateriels}
              getOptionDisabled={(option) =>
                // Désactiver si le matériel n'est pas disponible et n'est pas déjà sélectionné
                option.disponible! <= 0 &&
                !form.materiel.some((m) => m.id === option.id)
              }
              getOptionLabel={(opt) => `${opt.nom} (Dispo: ${opt.disponible})`}
              value={selectedMateriels}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              onChange={(_, newValue) => {
                setForm((prev) => ({
                  ...prev,
                  materiel: newValue.map((mat) => {
                    const existing = prev.materiel.find((m) => m.id === mat.id);
                    return {
                      id: mat.id,
                      nom: mat.nom,
                      utiliser: existing?.utiliser ?? 1, // Garder la quantité existante ou 1 par défaut
                    };
                  }),
                }));
              }}
              renderTags={(value, getTagProps) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    const qty =
                      form.materiel.find((m) => m.id === option.id)?.utiliser ?? 1;
                    return (
                      <Chip
                        key={key}
                        label={`${option.nom} ×${qty}`}
                        {...tagProps}
                        sx={{ bgcolor: "#616637", color: "white" }}
                      />
                    );
                  })}
                </Box>
              )}
              renderOption={(props$, option) => {
                const selectedEntry = form.materiel.find((e) => e.id === option.id);
                const isSelected = !!selectedEntry;
                const currentQty = selectedEntry?.utiliser ?? 1;
                const { key, ...restProps } = props$;
                return (
                  <li
                    key={key}
                    {...restProps}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      opacity: option.disponible === 0 && !isSelected ? 0.5 : 1, // Opacité réduite si non dispo et non sélectionné
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Checkbox
                        checked={isSelected}
                        disabled={option.disponible === 0 && !isSelected}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {option.nom}
                        </Typography>
                        <Typography
                          variant="caption"
                          color={option.disponible === 0 ? "error" : "text.secondary"}
                        >
                          Dispo: {option.disponible} / Total: {option.quantites}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center" }}
                      onClick={(e) => e.stopPropagation()} // Empêche la sélection/désélection lors du clic sur les boutons + -
                    >
                      <IconButton
                        size="small"
                        disabled={!isSelected || currentQty <= 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm((prev) => ({
                            ...prev,
                            materiel: prev.materiel.map((m) =>
                              m.id === option.id
                                ? { ...m, utiliser: m.utiliser - 1 }
                                : m
                            ),
                          }));
                        }}
                      >
                        <Remove fontSize="small" />
                      </IconButton>
                      <Typography
                        sx={{ width: 24, textAlign: "center", fontWeight: 600 }}
                      >
                        {isSelected ? currentQty : 0}
                      </Typography>
                      <IconButton
                        size="small"
                        disabled={
                          !form.date_debut || // Désactiver si aucune date de début n'est choisie
                          (!isSelected && option.disponible === 0) || // Ou si non sélectionné et non dispo
                          (isSelected && currentQty >= option.disponible!) // Ou si sélectionné et quantité atteint le disponible
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm((prev) => {
                            const exists = prev.materiel.some(
                              (m) => m.id === option.id
                            );
                            return {
                              ...prev,
                              materiel: exists
                                ? prev.materiel.map((m) =>
                                    m.id === option.id
                                      ? { ...m, utiliser: m.utiliser + 1 }
                                      : m
                                  )
                                : [
                                    ...prev.materiel,
                                    {
                                      id: option.id,
                                      nom: option.nom,
                                      utiliser: 1,
                                    },
                                  ],
                            };
                          });
                        }}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                    </Box>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Équipements *"
                  placeholder={
                    !form.date_debut
                      ? "Sélectionnez une date d'abord"
                      : "Rechercher..."
                  }
                  error={submitted && form.materiel.length === 0}
                  helperText={
                    (submitted && form.materiel.length === 0)
                      ? "Au moins un équipement est requis"
                      : (!form.date_debut ? "La disponibilité dépend des dates" : "")
                  }
                />
              )}
            />

            <TextField
              label="Détail"
              multiline
              rows={3}
              value={form.detail}
              onChange={(e) => handleChange("detail", e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: "rgba(0,0,0,0.02)" }}>
          <Button onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Sauvegarder"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <MapPickerModal
        open={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        onValidate={(location) => {
          handleChange("lieu_link", location);
          setMapModalOpen(false);
        }}
        initialValue={form.lieu_link}
      /> */}
      <Typography variant="h1">projet offligne</Typography>
    </>
  );
};

export default ProjetFormModalOff;