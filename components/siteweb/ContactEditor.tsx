"use client";

import React, { useState, useEffect } from "react";

// Firebase
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Icons (MUI)
import {
  Edit as EditIcon,
  Visibility as PreviewIcon,
  Save as SaveIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  AutoAwesome as SparkleIcon,
  Title as TitleIcon,
  ContactMail as ContactIcon,
  Map as MapIcon,
} from "@mui/icons-material";

import {
  Box,
  Typography,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
  Stack,
  Alert,
  Snackbar,
  Paper,
  useTheme,
  useMediaQuery,
  Fade,
  alpha,
  Button,
  Card,
  CardContent,
  Grid,
} from "@mui/material";

import ContactPreview from "./preview/ContactPreview";
import EditBannier from "../HeroImageEditor";

// --- Types ---
interface ContactData {
  titre: string;
  sousTitre: string;
  email: string;
  telephone: string;
  adresse: string;
  googleMapLink: string; // ✅ Nouveau champ
  horaires: string;
}

// --- Theme Colors ---
const THEME = {
  primary: {
    main: "#616637",
    light: "#8C915D",
    dark: "#3B3E21",
    gradient: "linear-gradient(135deg, #616637 0%, #3B3E21 100%)",
  },
  accent: {
    orange: "#F59E0B",
    green: "#10B981",
    blue: "#3B82F6",
  },
  neutral: {
    50: "#FAFAFA",
    100: "#F4F4F5",
    200: "#E4E4E7",
    300: "#D4D4D8",
    400: "#A1A1AA",
    500: "#71717A",
    600: "#52525B",
    700: "#3F3F46",
    800: "#27272A",
    900: "#18181B",
  },
};

// --- Valeurs par défaut ---
const DEFAULT_DATA: ContactData = {
  titre: "Contactez-nous",
  sousTitre: "Nous sommes à votre écoute pour tous vos projets",
  email: "tolotady.agency@gmail.com",
  telephone: "+261 34 90 729 86 ",
  adresse: "Ampamantanana – Androndra",
  googleMapLink: "", // ✅ Nouveau champ
  horaires: "Lun - Ven: 8h - 17h",
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function ContactEditor() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  // États
  const [data, setData] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<ContactData | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);
  const [open, setOpen] = useState(true);

  // ============================================
  // FIREBASE SYNC
  // ============================================
  useEffect(() => {
    const docRef = doc(db, "website_content", "contact_section");

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = snapshot.data() as ContactData;
          const contactData: ContactData = {
            titre: docData.titre || DEFAULT_DATA.titre,
            sousTitre: docData.sousTitre || DEFAULT_DATA.sousTitre,
            email: docData.email || DEFAULT_DATA.email,
            telephone: docData.telephone || DEFAULT_DATA.telephone,
            adresse: docData.adresse || DEFAULT_DATA.adresse,
            googleMapLink: docData.googleMapLink || DEFAULT_DATA.googleMapLink, // ✅
            horaires: docData.horaires || DEFAULT_DATA.horaires,
          };
          setData(contactData);
          setOriginalData(contactData);
        } else {
          setDoc(docRef, DEFAULT_DATA);
          setData(DEFAULT_DATA);
          setOriginalData(DEFAULT_DATA);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Erreur Firebase:", error);
        setToast({ msg: "Erreur de connexion", type: "error" });
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Détecter les changements
  useEffect(() => {
    if (data && originalData) {
      const changed = JSON.stringify(data) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [data, originalData]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleSave = async () => {
    if (!data) return;
    setSaving(true);

    try {
      await updateDoc(doc(db, "website_content", "contact_section"), {
        titre: data.titre,
        sousTitre: data.sousTitre,
        email: data.email,
        telephone: data.telephone,
        adresse: data.adresse,
        googleMapLink: data.googleMapLink, // ✅
        horaires: data.horaires,
      });
      setOriginalData(data);
      setHasChanges(false);
      setToast({ msg: "Modifications enregistrées !", type: "success" });
    } catch (e: any) {
      console.error("❌ Erreur sauvegarde:", e);
      setToast({ msg: e.message || "Erreur de sauvegarde", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalData) {
      setData({ ...originalData });
      setHasChanges(false);
      setToast({ msg: "Modifications annulées", type: "info" });
    }
  };

  const handleChange = (field: keyof ContactData, value: string) => {
    if (!data) return;
    setData({ ...data, [field]: value });
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading || !data) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${THEME.neutral[50]} 0%, ${THEME.neutral[100]} 100%)`,
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <Box sx={{ position: "relative", width: 60, height: 60 }}>
            <CircularProgress
              size={60}
              thickness={2}
              sx={{ color: THEME.primary.main, position: "absolute" }}
            />
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <SparkleIcon sx={{ fontSize: 24, color: THEME.primary.main }} />
            </Box>
          </Box>
          <Typography
            variant="body1"
            sx={{
              background: THEME.primary.gradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            Chargement...
          </Typography>
        </Stack>
      </Box>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <Box
      sx={{
        width: "100%",
        // minHeight: "100vh",
        background: `linear-gradient(180deg, ${THEME.neutral[50]} 0%, ${THEME.neutral[100]} 100%)`,
      }}
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.3)"
      borderRadius={2}
      overflow="hidden"
    >
      {/* ========== TABS HEADER ========== */}
      <Paper
        elevation={0}
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backdropFilter: "blur(20px)",
          backgroundColor: alpha("#616637", 0.9),
          borderBottom: `1px solid ${THEME.neutral[200]}`,
        }}
      >
        <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 1, sm: 1.5, md: 2 } }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: "2px 2px 0 0",
                background: "white",
              },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.875rem" },
                minHeight: { xs: 40, md: 48 },
                px: { xs: 1, sm: 1.5 },
                color: "white",
                "&.Mui-selected": { color: "white" },
              },
            }}
          >
            <Tab
              icon={<PreviewIcon sx={{ fontSize: { xs: 16, md: 18 } }} />}
              iconPosition="start"
              label={isSmall ? "" : isMobile ? "Aperçu" : "Aperçu du site"}
            />
            <Tab
              icon={<EditIcon sx={{ fontSize: { xs: 16, md: 18 } }} />}
              iconPosition="start"
              label={isSmall ? "" : isMobile ? "Éditeur" : "Éditeur"}
            />
          </Tabs>
        </Box>
      </Paper>

      {/* ========== VUE APERÇU ========== */}
      {tabValue === 0 && (
        <Fade in timeout={500}>
          <Box py={2} >
            <ContactPreview  data={data}/>
          </Box>
        </Fade>
      )}

      {/* ========== VUE ÉDITEUR ========== */}
      {tabValue === 1 && (
        <Fade in timeout={500}>
          <Box
            sx={{ maxWidth: 1000, mx: "auto", p: { xs: 1, sm: 1.5, md: 2 } }}
          >
            {/* Bannière */}
            <EditBannier
              open={open}
              onClose={() => setOpen(false)}
              url="bannier_contact"
            />

            {/* TOP BAR */}
            <Paper
              elevation={0}
              sx={{
                px: { xs: 1, sm: 1.5, md: 2 },
                my:  1 ,
                borderRadius: { xs: 1.5, md: 2 },
                background: "white",
                border: `1px solid ${THEME.neutral[200]}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <ContactIcon
                  sx={{
                    fontSize: { xs: 20, md: 24 },
                    color: THEME.primary.main,
                  }}
                />
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    }}
                  >
                    Informations de Contact
                  </Typography>
                  <Typography
                    variant="caption"
                    color={THEME.neutral[500]}
                    sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                  >
                    Modifiez vos coordonnées
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1}>
                {hasChanges && (
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    size="small"
                    sx={{
                      textTransform: "none",
                      borderColor: THEME.neutral[300],
                      color: THEME.neutral[600],
                      fontSize: "0.75rem",
                      py: 0.5,
                      px: 1.5,
                      "&:hover": {
                        borderColor: THEME.neutral[400],
                        bgcolor: THEME.neutral[50],
                      },
                    }}
                  >
                    Annuler
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={
                    saving ? (
                      <CircularProgress size={14} sx={{ color: "white" }} />
                    ) : (
                      <SaveIcon sx={{ fontSize: 16 }} />
                    )
                  }
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  size="small"
                  sx={{
                    background: hasChanges
                      ? `linear-gradient(135deg, ${THEME.accent.orange} 0%, #EA580C 100%)`
                      : THEME.primary.gradient,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    py: 0.5,
                    px: 2,
                    boxShadow: hasChanges
                      ? "0 2px 8px rgba(245, 158, 11, 0.3)"
                      : "0 2px 8px rgba(99, 102, 241, 0.3)",
                    "&:hover": {
                      transform: "translateY(-1px)",
                    },
                    "&:disabled": {
                      background: THEME.neutral[300],
                      color: THEME.neutral[500],
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </Stack>
            </Paper>

            {/* FORMULAIRE */}
            <Grid container spacing={1}>
              {/* Titres */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    borderRadius: { xs: 1.5, md: 2 },
                    border: `1px solid ${THEME.neutral[200]}`,
                  }}
                >
                  <CardContent sx={{ px: 1 }}>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      mb={2}
                    >
                      <TitleIcon
                        sx={{ color: THEME.primary.main, fontSize: 18 }}
                      />
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ fontSize: "0.875rem" }}
                      >
                        En-tête
                      </Typography>
                    </Stack>
                    <Stack spacing={2}>
                      <TextField
                        label="Titre principal"
                        fullWidth
                        value={data.titre}
                        onChange={(e) => handleChange("titre", e.target.value)}
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                          "& .MuiInputLabel-root": { fontSize: "0.875rem" },
                          "& .MuiInputBase-input": { fontSize: "0.875rem" },
                        }}
                      />
                      <TextField
                        label="Sous-titre"
                        fullWidth
                        multiline
                        rows={2}
                        value={data.sousTitre}
                        onChange={(e) =>
                          handleChange("sousTitre", e.target.value)
                        }
                        size="small"
                        
                        sx={{
                          "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                          "& .MuiInputLabel-root": { fontSize: "0.875rem" },
                          "& .MuiInputBase-input": { fontSize: "0.875rem" },
                        }}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Email */}
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    borderRadius: { xs: 1.5, md: 2 },
                    border: `1px solid ${THEME.neutral[200]}`,
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      mb={1.5}
                    >
                      <EmailIcon
                        sx={{ color: THEME.accent.blue, fontSize: 18 }}
                      />
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ fontSize: "0.875rem" }}
                      >
                        Email
                      </Typography>
                    </Stack>
                    <TextField
                      fullWidth
                      value={data.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      size="small"
                      type="email"
                      placeholder="contact@example.com"
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                        "& .MuiInputBase-input": { fontSize: "0.875rem" },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Téléphone */}
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    borderRadius: { xs: 1.5, md: 2 },
                    border: `1px solid ${THEME.neutral[200]}`,
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      mb={1.5}
                    >
                      <PhoneIcon
                        sx={{ color: THEME.accent.green, fontSize: 18 }}
                      />
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ fontSize: "0.875rem" }}
                      >
                        Téléphone
                      </Typography>
                    </Stack>
                    <TextField
                      fullWidth
                      value={data.telephone}
                      onChange={(e) =>
                        handleChange("telephone", e.target.value)
                      }
                      size="small"
                      type="tel"
                      placeholder="+261 34 00 000 00"
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                        "& .MuiInputBase-input": { fontSize: "0.875rem" },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Adresse - ÉLARGI POUR 2 CHAMPS */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    borderRadius: { xs: 1.5, md: 2 },
                    border: `1px solid ${THEME.neutral[200]}`,
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      mb={1.5}
                    >
                      <LocationIcon sx={{ color: "#EF4444", fontSize: 18 }} />
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ fontSize: "0.875rem" }}
                      >
                        Adresse
                      </Typography>
                    </Stack>
                    <Stack spacing={2}>
                      <TextField
                        label="Adresse complète"
                        fullWidth
                        value={data.adresse}
                        onChange={(e) =>
                          handleChange("adresse", e.target.value)
                        }
                        size="small"
                        
                        placeholder="Antananarivo, Madagascar"
                        sx={{
                          "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                          "& .MuiInputLabel-root": { fontSize: "0.875rem" },
                          "& .MuiInputBase-input": { fontSize: "0.875rem" },
                        }}
                      />
                      <TextField
                        label="Lien Google Maps"
                        fullWidth
                        value={data.googleMapLink}
                        onChange={(e) =>
                          handleChange("googleMapLink", e.target.value)
                        }
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <MapIcon
                              sx={{
                                mr: 1,
                                color: THEME.neutral[400],
                                fontSize: 18,
                              }}
                            />
                          ),
                        }}
                        placeholder="Ex : -18.942222, 47.537281"
                        sx={{
                          "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                          "& .MuiInputLabel-root": { fontSize: "0.875rem" },
                          "& .MuiInputBase-input": { fontSize: "0.875rem" },
                        }}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Horaires */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    borderRadius: { xs: 1.5, md: 2 },
                    border: `1px solid ${THEME.neutral[200]}`,
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      mb={1.5}
                    >
                      <ScheduleIcon
                        sx={{ color: THEME.accent.orange, fontSize: 18 }}
                      />
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ fontSize: "0.875rem" }}
                      >
                        Horaires
                      </Typography>
                    </Stack>
                    <TextField
                      fullWidth
                      value={data.horaires}
                      onChange={(e) => handleChange("horaires", e.target.value)}
                      size="small"
                      multiline
                      rows={2}
                      placeholder="Lun - Ven: 8h - 17h"
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                        "& .MuiInputBase-input": { fontSize: "0.875rem" },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      )}

      {/* ========== TOAST ========== */}
      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast(null)}
          severity={toast?.type || "info"}
          variant="filled"
          sx={{
            borderRadius: 1.5,
            fontWeight: 600,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            fontSize: "0.75rem",
          }}
        >
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
