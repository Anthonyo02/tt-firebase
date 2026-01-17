import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
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
// ❌ Supprimé : On utilise maintenant les matériels depuis Firestore via useData
// import useLocalStorage from "@/hooks/useLocalStorage";
import { LocationOn } from "@mui/icons-material";
import { InputAdornment } from "@mui/material";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import MapPickerModal from "./Map";

// =======================
// TRANSITION
// =======================
const Transition = React.forwardRef(function Transition(
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

interface MaterielItem {
  id: string;
  nom: string;
  quantites: number;
  disponible?: number;
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
const ProjetFormModal: React.FC<ProjetFormModalProps> = ({
  open,
  projet,
  onClose,
}) => {
  // =======================
  // HOOKS ET ÉTATS
  // =======================
  // 🔥 Mise à jour : On récupère les fonctions Firebase depuis le contexte
  const { users, projets, fetchProjets, addProjet, updateProjet, materiels } =
    useData();

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

  const isManualStatusChange = useRef(false);
  const initialDateDebut = useRef<string | null>(null);
  const icon = <CheckBoxOutlineBlank fontSize="small" />;
  const checkedIcon = <CheckBox fontSize="small" />;
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Configuration de la carte
  const [mapModalOpen, setMapModalOpen] = useState(false);

  // =======================
  // UTILITAIRES
  // =======================

  /**
   * Extrait et normalise la liste des matériels d'un projet
   */
  const extractMaterielsFromProjet = useCallback(
    (projet: any): MaterielUtilise[] => {
      if (!projet.materiel) return [];

      let materielData = projet.materiel;

      // Si c'est une chaîne, essayer de parser
      if (typeof materielData === "string") {
        try {
          materielData = JSON.parse(materielData);
        } catch (e) {
          console.error("Erreur parsing matériel:", e);
          return [];
        }
      }

      // S'assurer que c'est un tableau
      if (!Array.isArray(materielData)) return [];

      // Normaliser chaque élément
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

  /**
   * Vérifie si la date de début est passée
   */
  const isDateDebutPassed = useCallback((date: string): boolean => {
    if (!date) return false;
    return new Date(date.replace(" ", "T")) < new Date();
  }, []);

  /**
   * Obtient le début de la journée pour une date donnée
   */
  const getStartOfDay = useCallback((dateStr: string): Date | null => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  /**
   * Obtient la fin de la journée pour une date donnée
   */
  const getEndOfDay = useCallback((dateStr: string): Date | null => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      23,
      59,
      59,
      999
    );
  }, []);

  /**
   * Vérifie si deux intervalles de temps se chevauchent
   */
  const areIntervalsOverlapping = useCallback(
    (startA: Date, endA: Date, startB: Date, endB: Date): boolean => {
      return startA <= endB && endA >= startB;
    },
    []
  );

  /**
   * Vérifie si un projet se chevauche avec les dates du formulaire
   */
  const isProjetOverlapping = useCallback(
    (projet: any): boolean => {
      if (!form.date_debut || !projet.date_debut) return false;

      const currentStart = getStartOfDay(form.date_debut);
      const currentEnd = form.date_fin
        ? getEndOfDay(form.date_fin)
        : getEndOfDay(form.date_debut);
      const projetStart = getStartOfDay(projet.date_debut);
      const projetEnd = projet.date_fin
        ? getEndOfDay(projet.date_fin)
        : getEndOfDay(projet.date_debut);

      if (!currentStart || !currentEnd || !projetStart || !projetEnd)
        return false;

      return areIntervalsOverlapping(
        currentStart,
        currentEnd,
        projetStart,
        projetEnd
      );
    },
    [
      form.date_debut,
      form.date_fin,
      getStartOfDay,
      getEndOfDay,
      areIntervalsOverlapping,
    ]
  );

  // =======================
  // CALCULS DES STOCKS
  // =======================

  /**
   * Calcule la quantité totale utilisée pour un matériel donné
   */
  const calculateQuantiteUtilisee = useCallback(
    (materielId: string): number => {
      let totalUtilise = 0;

      for (const p of projets) {
        // Ignorer le projet actuel en mode édition et les projets annulés
        if (
          (projet && String(p.id) === String(projet.id)) ||
          p.status === "annuller"
        ) {
          continue;
        }

        // Vérifier si le projet se chevauche
        if (!isProjetOverlapping(p)) continue;

        // Extraire les matériels du projet
        const materielsDuProjet = extractMaterielsFromProjet(p);

        // Chercher notre matériel dans la liste
        const materielUtilise = materielsDuProjet.find(
          (m) => m.id === materielId
        );
        if (materielUtilise) {
          totalUtilise += materielUtilise.utiliser;
        }
      }

      return totalUtilise;
    },
    [projets, projet, isProjetOverlapping, extractMaterielsFromProjet]
  );

  /**
   * Calcule la disponibilité des matériels pour les dates sélectionnées
   */
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

      console.log(
        `Matériel ${mat.nom}: Total=${mat.quantites}, Utilisé=${quantiteUtilisee}, Disponible=\({disponible}`
      );

      return {
        ...mat,
        disponible,
      };
    });
  }, [materiels, form.date_debut, calculateQuantiteUtilisee]);

  /**
   * Trie les matériels pour afficher les sélectionnés en premier
   */
  const sortedMateriels = useMemo(() => {
    const selectedIds = new Set(form.materiel.map((m) => m.id));
    return [...materielsDisponibles].sort((a, b) => {
      const aSel = selectedIds.has(a.id) ? 0 : 1;
      const bSel = selectedIds.has(b.id) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      return a.nom.localeCompare(b.nom);
    });
  }, [materielsDisponibles, form.materiel]);

  /**
   * Filtre les matériels sélectionnés
   */
  const selectedMateriels = useMemo(
    () =>
      materielsDisponibles.filter((m) =>
        form.materiel.some((fm) => fm.id === m.id)
      ),
    [materielsDisponibles, form.materiel]
  );

  // =======================
  // VALIDATION
  // =======================

  /**
   * Vérifie si le formulaire est valide
   */
  const isFormValid = useMemo(() => {
    return (
      form.titre.trim() !== "" &&
      form.date_debut !== "" &&
      form.responsable.trim() !== "" &&
      form.materiel.length > 0
    );
  }, [form]);

  /**
   * Vérifie les conflits de matériel de manière stricte
   */
  const verifierConflitsMateriel = useCallback((): string[] => {
    const erreurs: string[] = [];
    if (!form.date_debut || form.materiel.length === 0) return erreurs;

    for (const mUtilise of form.materiel) {
      const materielStock = materiels.find((m) => m.id === mUtilise.id);
      if (!materielStock) continue;

      const quantiteUtilisee = calculateQuantiteUtilisee(mUtilise.id);
      const quantiteTotale = quantiteUtilisee + mUtilise.utiliser;

      console.log(
        `Vérification pour \){mUtilise.nom}: Stock=${materielStock.quantites}, Utilisé ailleurs=${quantiteUtilisee}, Dans ce formulaire=${mUtilise.utiliser}, Total=\({quantiteTotale}`
      );

      if (quantiteTotale > materielStock.quantites) {
        erreurs.push(
          `\){mUtilise.nom}: Stock total (${materielStock.quantites}) insuffisant. ` +
            `Déjà utilisé: ${quantiteUtilisee}, Demandé: ${mUtilise.utiliser}, ` +
            `Total: ${quantiteTotale}`
        );
      }
    }

    return erreurs;
  }, [form, materiels, calculateQuantiteUtilisee]);

  // =======================
  // GESTION DU STATUT
  // =======================

  /**
   * Met à jour automatiquement le statut selon la $date
   */
  useEffect(() => {
    if (!form.date_debut) return;

    if (projet && isManualStatusChange.current) return;

    if (projet && initialDateDebut.current === form.date_debut) return;

    const newAutoStatus = isDateDebutPassed(form.date_debut)
      ? "terminer"
      : "en cours";

    setForm((prev) => ({
      ...prev,
      status:
        prev.status === "en cours" || prev.status === "terminer"
          ? newAutoStatus
          : prev.status,
    }));

    isManualStatusChange.current = false;
  }, [form.date_debut, projet, isDateDebutPassed]);

  /**
   * Gère le changement manuel de statut avec règles strictes
   */
  const handleStatusChange = useCallback(
    (newStatus: "en cours" | "annuller") => {
      if (!projet) {
        setError("Impossible de changer le statut en création.");
        return;
      }

      const current = form.status;

      if (current === "en cours" && newStatus === "annuller") {
        setForm((p) => ({ ...p, status: newStatus }));
        isManualStatusChange.current = true;
        return;
      }

      if (current === "annuller" && newStatus === "en cours") {
        setForm((p) => ({ ...p, status: newStatus }));
        isManualStatusChange.current = true;
        return;
      }

      setError(
        `Action impossible : Vous ne pouvez passer de "${current}" qu'à "\({
          current === "en cours" ? "annuller" : "en cours"
        }"`
      );
    },
    [projet, form.status]
  );

  // =======================
  // GESTION DU FORMULAIRE
  // =======================

  const handleChange = useCallback((field: keyof FormState, value: any) => {
    setForm((prev) => {
      let newForm = { ...prev, [field]: value };

      // Si on change le responsable, le retirer automatiquement de l'équipe
      if (field === "responsable") {
        newForm.equipe = prev.equipe.filter((u) => u !== value);
      }

      return newForm;
    });

    if (field !== "status") {
      isManualStatusChange.current = false;
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    isManualStatusChange.current = false;

    if (projet) {
      const existingMateriel = extractMaterielsFromProjet(projet);
      const dateDebut = projet.date_debut || "";
      initialDateDebut.current = dateDebut;

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
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const todayString = new Date(now.getTime() - offset)
        .toISOString()
        .slice(0, 16);

      initialDateDebut.current = null;
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

    setError("");
    setSuccess(false);
    setSubmitted(false);
  }, [projet, open, extractMaterielsFromProjet]);

  // =======================
  // 🔥 NOUVELLE LOGIQUE FIREBASE
  // =======================
  const save = useCallback(async () => {
    setSubmitted(false);
    if (!isFormValid) {
      setError("Veuillez remplir les champs obligatoires.");
      return;
    }

    const conflits = verifierConflitsMateriel();
    if (conflits.length > 0) {
      setError(`Conflit de stock détecté : \){conflits.join(", ")}`);
      return;
    }

    if (projet) {
      const ancienStatus = projet.status;
      const transitionAutorisee =
        (ancienStatus === "en cours" && form.status === "annuller") ||
        (ancienStatus === "annuller" && form.status === "en cours") ||
        form.status === ancienStatus;

      // if (!transitionAutorisee) {
      //   setError("Transition de statut non autorisée.");
      //   return;
      // }
    }

    setLoading(true);
    setError("");

    try {
      if (projet) {
        // Mode édition : mise à jour du projet dans Firestore
        await updateProjet(projet.id, form);
      } else {
        // Mode création : ajout d'un nouveau projet dans Firestore
        await addProjet(form);
      }

      await fetchProjets();
      setSuccess(true);
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setError("Échec de la sauvegarde : " + err.message);
    } finally {
      setLoading(false);
    }
  }, [
    isFormValid,
    verifierConflitsMateriel,
    projet,
    form,
    fetchProjets,
    onClose,
    addProjet,
    updateProjet,
  ]);

  // =======================
  // UTILITAIRES D'AFFICHAGE
  // =======================

  const toInputDateTime = useCallback((value: string): string => {
    return value ? value.replace(" ", "T").slice(0, 16) : "";
  }, []);

  const fromInputDateTime = useCallback((value: string): string => {
    return value ? value.replace("T", " ") : "";
  }, []);

  // =======================
  // RENDU
  // =======================
  const isUpdateMode = !!projet;
  const canToggleToAnnuler = isUpdateMode && form.status === "en cours";
  const canToggleToEncours = isUpdateMode && form.status === "annuller";
  const userNames = useMemo(() => users.map((u) => u.nom), [users]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Transition}
    >
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
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
          sx={{ position: "absolute", right: 12, top: 12, color: "white" }}
        >
          <Close />
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}
          >
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
                    ? "Terminé"
                    : form.status
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
                    minHeight: 24, // hauteur d’un Chip small
                    padding: "0 8px", // padding Chip
                    fontSize: "0.75rem", // taille texte Chip
                    textTransform: "none", // Chip n’est pas en majuscule
                    lineHeight: 1.2,
                    "& .MuiButton-startIcon": {
                      marginRight: "4px",
                      marginLeft: "-2px",
                      fontSize: "18px", // taille icône Chip
                    },
                    "&:hover": {
                      background: "rgba(255, 0, 0, 1)",
                    },
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
                    minHeight: 24, // hauteur d’un Chip small
                    padding: "0 8px", // padding Chip
                    fontSize: "0.75rem", // taille texte Chip
                    textTransform: "none", // Chip n’est pas en majuscule
                    lineHeight: 1.2,
                    "& .MuiButton-startIcon": {
                      marginRight: "4px",
                      marginLeft: "-2px",
                      fontSize: "18px", // taille icône Chip
                    },
                    "&:hover": {
                      background: "rgba(255, 145, 0, 0.63)",
                    },
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Enregistré avec succès !
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            label="Titre *"
            value={form.titre}
            onChange={(e) => handleChange("titre", e.target.value)}
            fullWidth
            error={submitted && !form.titre}
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
                    handleChange("date_fin", val);
                  }
                }}
                InputLabelProps={{ shrink: true }}
                fullWidth
                error={submitted && !form.date_debut}
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
                inputProps={{ min: toInputDateTime(form.date_debut) }}
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
                error={submitted && !form.lieu}
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
                helperText={
                  submitted && !form.responsable ? "Champ requis" : ""
                }
              />
            )}
          />

          <Autocomplete
            multiple
            disableCloseOnSelect
            options={userNames.filter((u) => u !== form.responsable)}
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
              option.disponible! <= 0 &&
              !form.materiel.some((m) => m.id === option.id)
            }
            getOptionLabel={(opt) => `${opt.nom} (Dispo: \({opt.disponible})`}
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
                    utiliser: existing?.utiliser ?? 1,
                  };
                }),
              }));
            }}
            renderTags={(value, getTagProps) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });

                  const qty =
                    form.materiel.find((m) => m.id === option.id)?.utiliser ??
                    1;

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
              const selectedEntry = form.materiel.find(
                (e) => e.id === option.id
              );
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
                    opacity: option.disponible! <= 0 ? 0.5 : 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Checkbox
                      checked={isSelected}
                      disabled={option.disponible! <= 0 && !isSelected}
                    />
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {option.nom}
                      </Typography>
                      <Typography
                        variant="caption"
                        color={
                          option.disponible === 0 ? "error" : "text.secondary"
                        }
                      >
                        Dispo: {option.disponible} / Total: {option.quantites}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{ display: "flex", alignItems: "center" }}
                    onClick={(e) => e.stopPropagation()}
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
                        !form.date_debut ||
                        (!isSelected && option.disponible === 0) ||
                        (isSelected && currentQty >= option.disponible!)
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
                  !form.date_debut ? "La disponibilité dépend des dates" : ""
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
      <MapPickerModal
        open={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        onValidate={(location) => {
          handleChange("lieu_link", location);
          setMapModalOpen(false);
        }}
        initialValue={form.lieu_link}
      />
      <DialogActions sx={{ p: 3, bgcolor: "rgba(0,0,0,0.02)" }}>
        <Button onClick={onClose}>Annuler</Button>
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
  );
};

export default ProjetFormModal;
