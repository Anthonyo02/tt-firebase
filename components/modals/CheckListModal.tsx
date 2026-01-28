"use client";

import React, {
  useState,
  useEffect,
  useMemo,
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
  ChecklistRtl,
  CheckBoxOutlineBlank,
  CheckBox,
  MapOutlined,
} from "@mui/icons-material";
import { TransitionProps } from "@mui/material/transitions";
import { useData, CheckList } from "@/context/DataContext";
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
interface CheckListModalProps {
  open: boolean;
  checklist: CheckList | null;
  onClose: () => void;
}

// ✅ Ajout du champ status
interface MaterielUtilise {
  id: string;
  nom: string;
  utiliser: number;
  status: "ongoing" | "done";
}

interface FormState {
  titre: string;
  lieu: string;
  lieu_link: string;
  date_debut: string;
  responsable: string[];
  materiel: MaterielUtilise[];
  description: string;
}

// =======================
// COMPOSANT PRINCIPAL
// =======================
const CheckListModal: React.FC<CheckListModalProps> = ({
  open,
  checklist,
  onClose,
}) => {
  // =======================
  // HOOKS ET ÉTATS
  // =======================
  const {
    users,
    checklists,
    fetchChecklists,
    addChecklist,
    updateChecklist,
    materiels,
  } = useData();

  const [form, setForm] = useState<FormState>({
    titre: "",
    lieu: "",
    lieu_link: "",
    date_debut: "",
    responsable: [],
    materiel: [],
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const icon = <CheckBoxOutlineBlank fontSize="small" />;
  const checkedIcon = <CheckBox fontSize="small" />;

  // =======================
  // UTILITAIRES
  // =======================

  // ✅ Modification pour préserver le status existant ou mettre "ongoing" par défaut
  const extractMaterielsFromChecklist = useCallback(
    (checklistData: any): MaterielUtilise[] => {
      if (!checklistData.materiel) return [];

      let materielData = checklistData.materiel;

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
          status: (m.status as "ongoing" | "done") || "ongoing", // ✅ Préserver ou "ongoing" par défaut
        }))
        .filter((m) => m.id && m.utiliser > 0);
    },
    []
  );

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

  const isChecklistOverlapping = useCallback(
    (checklistItem: any): boolean => {
      if (!form.date_debut || !checklistItem.date_debut) return false;

      const currentStart = getStartOfDay(form.date_debut);
      const currentEnd = getEndOfDay(form.date_debut);
      const checklistStart = getStartOfDay(checklistItem.date_debut);
      const checklistEnd = getEndOfDay(checklistItem.date_debut);

      if (!currentStart || !currentEnd || !checklistStart || !checklistEnd)
        return false;

      return areIntervalsOverlapping(
        currentStart,
        currentEnd,
        checklistStart,
        checklistEnd
      );
    },
    [form.date_debut, getStartOfDay, getEndOfDay, areIntervalsOverlapping]
  );

  // =======================
  // CALCULS DES STOCKS
  // =======================

  const calculateQuantiteUtilisee = useCallback(
    (materielId: string): number => {
      let totalUtilise = 0;

      for (const c of checklists) {
        if (checklist && String(c.id) === String(checklist.id)) {
          continue;
        }

        if (!isChecklistOverlapping(c)) continue;

        const materielsDuChecklist = extractMaterielsFromChecklist(c);
        const materielUtilise = materielsDuChecklist.find(
          (m) => m.id === materielId
        );

        if (materielUtilise) {
          totalUtilise += materielUtilise.utiliser;
        }
      }
      return totalUtilise;
    },
    [checklists, checklist, isChecklistOverlapping, extractMaterielsFromChecklist]
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
      form.responsable.length > 0 &&
      form.materiel.length > 0
    );
  }, [form]);

  const verifierConflitsMateriel = useCallback((): string[] => {
    const erreurs: string[] = [];
    if (!form.date_debut || form.materiel.length === 0) return erreurs;

    for (const mUtilise of form.materiel) {
      const materielStock = materiels.find((m) => m.id === mUtilise.id);
      if (!materielStock) continue;

      let quantiteDejaReserveeParAutres = calculateQuantiteUtilisee(mUtilise.id);
      const quantiteTotaleDemandee = mUtilise.utiliser;
      const stockRestantApresAutres =
        materielStock.quantites - quantiteDejaReserveeParAutres;

      if (quantiteTotaleDemandee > stockRestantApresAutres) {
        erreurs.push(
          `${mUtilise.nom}: Stock insuffisant. Demandé: ${mUtilise.utiliser}. ` +
            `Stock total: ${materielStock.quantites}. Déjà réservé: ${quantiteDejaReserveeParAutres}. ` +
            `Disponible: ${stockRestantApresAutres}.`
        );
      }
    }
    return erreurs;
  }, [form, materiels, calculateQuantiteUtilisee]);

  const handleChange = useCallback((field: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Initialisation du formulaire
  useEffect(() => {
    if (!open) return;

    if (checklist) {
      const existingMateriel = extractMaterielsFromChecklist(checklist);

      setForm({
        titre: checklist.titre ?? "",
        lieu: checklist.lieu ?? "",
        lieu_link: checklist.lieu_link ?? "",
        date_debut: checklist.date_debut || "",
        responsable: Array.isArray(checklist.responsable)
          ? checklist.responsable
          : [],
        materiel: existingMateriel, // ✅ Le status est déjà inclus
        description: checklist.description ?? "",
      });
    } else {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const todayString = new Date(now.getTime() - offset)
        .toISOString()
        .slice(0, 16);

      setForm({
        titre: "",
        lieu: "",
        lieu_link: "",
        date_debut: todayString,
        responsable: [],
        materiel: [],
        description: "",
      });
    }

    setError("");
    setSuccess(false);
    setSubmitted(false);
  }, [checklist, open, extractMaterielsFromChecklist]);

  // =======================
  // SAUVEGARDE
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
      console.log("💾 Sauvegarde checklist...");
      console.log("📦 Matériels avec status:", form.materiel);

      if (checklist) {
        await updateChecklist(checklist.id, form);
      } else {
        await addChecklist(form);
      }

      console.log("🔄 Synchronisation...");
      await fetchChecklists();
      onClose();

      setSuccess(true);
    } catch (err: any) {
      console.error("❌ Erreur sauvegarde:", err);
      setError("Échec de la sauvegarde : " + err.message);
    } finally {
      setLoading(false);
    }
  }, [
    isFormValid,
    verifierConflitsMateriel,
    checklist,
    form,
    addChecklist,
    updateChecklist,
    fetchChecklists,
    onClose,
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

  const userNames = useMemo(() => users.map((u) => u.nom), [users]);

  // =======================
  // RENDER
  // =======================
  return (
    <>
      <Dialog
        open={open}
        onClose={!loading ? onClose : undefined}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Transition}
      >
        {/* HEADER */}
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
            disabled={loading}
            sx={{ position: "absolute", right: 12, top: 12, color: "white" }}
          >
            <Close />
          </IconButton>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}
            >
              <ChecklistRtl />
            </Avatar>

            <Box>
              <Typography variant="h5" fontWeight={700} color="white">
                {checklist ? "Modifier la checklist" : "Nouvelle checklist"}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                Gérez vos équipements et responsables
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* CONTENT */}
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
            {/* TITRE */}
            <TextField
              label="Titre *"
              value={form.titre}
              onChange={(e) => handleChange("titre", e.target.value)}
              fullWidth
              error={submitted && !form.titre}
              helperText={submitted && !form.titre ? "Le titre est requis" : ""}
            />

            {/* DATE DÉBUT */}
            <TextField
              label="Date *"
              type="datetime-local"
              value={toInputDateTime(form.date_debut)}
              onChange={(e) =>
                handleChange("date_debut", fromInputDateTime(e.target.value))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
              error={submitted && !form.date_debut}
              helperText={
                submitted && !form.date_debut ? "La date est requise" : ""
              }
            />

            {/* LIEU */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Lieu"
                  fullWidth
                  value={form.lieu}
                  onChange={(e) => handleChange("lieu", e.target.value)}
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

            {/* RESPONSABLES */}
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={userNames}
              value={form.responsable}
              onChange={(_, v) => handleChange("responsable", v)}
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
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Responsable(s) *"
                  error={submitted && form.responsable.length === 0}
                  helperText={
                    submitted && form.responsable.length === 0
                      ? "Au moins un responsable est requis"
                      : ""
                  }
                />
              )}
            />

            {/* MATÉRIELS - ✅ Modifié pour inclure le status */}
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={sortedMateriels}
              getOptionDisabled={(option) =>
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
                      utiliser: existing?.utiliser ?? 1,
                      status: existing?.status ?? "ongoing", // ✅ Préserver ou "ongoing"
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
                        sx={{ bgcolor: "#818660", color: "white" }}
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
                      opacity: option.disponible === 0 && !isSelected ? 0.5 : 1,
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
                                      status: "ongoing" as const, // ✅ Status par défaut
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
                    submitted && form.materiel.length === 0
                      ? "Au moins un équipement est requis"
                      : !form.date_debut
                      ? "La disponibilité dépend de la date"
                      : ""
                  }
                />
              )}
            />

            {/* DESCRIPTION */}
            <TextField
              label="Description"
              multiline
              rows={3}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>

        {/* ACTIONS */}
        <DialogActions sx={{ p: 3, bgcolor: "rgba(0,0,0,0.02)" }}>
          <Button onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={loading}
            sx={{
              minWidth: 120,
              bgcolor: "#818660",
              "&:hover": { bgcolor: "#6b7052" },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Sauvegarder"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MAP MODAL */}
      <MapPickerModal
        open={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        onValidate={(location) => {
          handleChange("lieu_link", location);
          setMapModalOpen(false);
        }}
        initialValue={form.lieu_link}
      />
    </>
  );
};

export default CheckListModal;