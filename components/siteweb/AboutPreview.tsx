"use client";

import React, { useState, useEffect, useCallback } from "react";
import imageCompression from "browser-image-compression";

// Firebase
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db2 } from "@/lib/firebase-site";

// Icons (MUI)
import {
  Edit as EditIcon,
  Visibility as PreviewIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Image as ImageIcon,
  CloudUpload as CloudUploadIcon,
  HourglassEmpty as PendingIcon,
  DeleteOutline as DeleteOutlineIcon,
  DesktopWindows as DesktopIcon,
  PhoneAndroid as MobileIcon,
  ColorLens as ColorIcon,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Typography,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Stack,
  Alert,
  Snackbar,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
  Chip,
  InputAdornment,
} from "@mui/material";

// Import du composant de prévisualisation front-end (si existant)
import { About } from "./preview/About";
// Import du modal global d'édition (pour les textes complexes)
import ShowEditAbout from "../modals/ShowEditAbout";

// --- Types ---
// Structure correspondant exactement à votre JSON demandé
interface HeroImage {
  imageUrl: string;
  imageId: string; // public_id cloudinary
  title: string;
  subTitle: string;
  color: string;
}

interface AboutData {
  image: HeroImage;
  history: any; // On simplifie ici car géré par ShowEditAbout, mais nécessaire pour le typage
  cards: any[];
  values: any;
  approach: any;
  cta: any;
}

// Type pour l'image en attente d'upload
interface PendingImage {
  file: File;
  previewUrl: string;
}

// --- Theme Colors ---
const THEME_COLORS = {
  beige: "#D5B595",
  olive: "#616637",
  bgLight: "#FDFCFB",
  textMain: "#1A1A1A",
};

// --- Options de compression ---
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1, // 1MB pour une image Hero
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp" as const,
};

// --- Valeurs par défaut ---
const DEFAULT_ABOUT_DATA: AboutData = {
  image: {
    imageUrl: "",
    imageId: "",
    title: "À Propos",
    subTitle: "Une agence de communication engagée",
    color: "#888c69",
  },
  history: {},
  cards: [],
  values: {},
  approach: {},
  cta: {},
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function AboutPreview() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // États
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  // État pour l'image Hero en attente d'upload
  const [pendingHeroImage, setPendingHeroImage] = useState<PendingImage | null>(null);

  // ============================================
  // USEEFFECT - FIREBASE SYNC
  // ============================================
  useEffect(() => {
    // Note: On pointe vers "full_about" comme demandé
    const docRef = doc(db2, "website_content", "full_about");

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = snapshot.data();
          // On s'assure que la structure image existe
          const loadedData = {
            ...docData,
            image: {
              imageUrl: docData.image?.imageUrl || DEFAULT_ABOUT_DATA.image.imageUrl,
              imageId: docData.image?.imageId || DEFAULT_ABOUT_DATA.image.imageId,
              title: docData.image?.title || DEFAULT_ABOUT_DATA.image.title,
              subTitle: docData.image?.subTitle || DEFAULT_ABOUT_DATA.image.subTitle,
              color: docData.image?.color || DEFAULT_ABOUT_DATA.image.color,
            }
          } as AboutData;
          
          setData(loadedData);
        } else {
          setDoc(docRef, DEFAULT_ABOUT_DATA);
          setData(DEFAULT_ABOUT_DATA);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Erreur Firebase:", error);
        setToast({ msg: "Erreur de connexion", type: "error" });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Cleanup des URLs temporaires
  useEffect(() => {
    return () => {
      if (pendingHeroImage) {
        URL.revokeObjectURL(pendingHeroImage.previewUrl);
      }
    };
  }, [pendingHeroImage]);

  // ============================================
  // GESTION DE L'IMAGE
  // ============================================
  
  const handleImageSelect = (file: File) => {
    if (!data) return;

    // Nettoyage ancienne preview
    if (pendingHeroImage) {
      URL.revokeObjectURL(pendingHeroImage.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingHeroImage({ file, previewUrl });

    // Mise à jour optimiste de l'UI
    setData({
      ...data,
      image: {
        ...data.image,
        imageUrl: previewUrl
      }
    });

    setToast({
      msg: "Image sélectionnée. Cliquez sur Enregistrer pour uploader.",
      type: "info",
    });
  };

  const handleCancelPending = () => {
    if (!pendingHeroImage) return;
    URL.revokeObjectURL(pendingHeroImage.previewUrl);
    setPendingHeroImage(null);
    setToast({ msg: "Modification d'image annulée", type: "info" });
    // Note: Pour rafraîchir l'ancienne image, on compte sur le prochain snapshot Firebase ou un reload manuel
  };

  // ============================================
  // SAUVEGARDE (AVEC UPLOAD FULLABOUT)
  // ============================================
  const handleSave = async () => {
    if (!data) return;
    setSaving(true);

    try {
      let finalImageData = { ...data.image };

      // 1. Upload Cloudinary si une nouvelle image est sélectionnée
      if (pendingHeroImage) {
        setUploading(true);
        try {
          const compressedFile = await imageCompression(
            pendingHeroImage.file,
            COMPRESSION_OPTIONS
          );

          const formData = new FormData();
          formData.append("file", compressedFile);
          
          // Si on remplace une image existante, on passe son ID (Optionnel, géré par votre API)
          if (data.image.imageId) {
            formData.append("publicId", data.image.imageId);
          }

          // Appel à VOTRE route API spécifique
          const res = await fetch("/api/cloudinary/uploadweb/fullabout", {
            method: "POST",
            body: formData,
          });

          const resData = await res.json();

          if (!res.ok) {
            throw new Error(resData.error || "Erreur upload");
          }

          // Mise à jour avec les infos Cloudinary
          finalImageData = {
            ...finalImageData,
            imageUrl: resData.imageUrl,
            imageId: resData.imagePublicId, // ou resData.public_id selon votre API
          };

          // Nettoyage
          URL.revokeObjectURL(pendingHeroImage.previewUrl);
          setPendingHeroImage(null);

        } catch (uploadErr) {
          console.error("Erreur Upload:", uploadErr);
          setToast({ msg: "Erreur lors de l'upload de l'image", type: "error" });
          setSaving(false);
          setUploading(false);
          return; // On arrête si l'upload échoue
        }
      }

      // 2. Sauvegarde Firestore
      const docRef = doc(db2, "website_content", "full_about");
      
      // On sauvegarde l'objet image mis à jour et on conserve le reste
      await updateDoc(docRef, {
        image: finalImageData,
        // On peut aussi mettre à jour les autres champs s'ils ont été modifiés localement
        // history: data.history, cards: data.cards, etc.
      });

      setData({ ...data, image: finalImageData });
      setToast({ msg: "Sauvegarde réussie !", type: "success" });

    } catch (e: any) {
      console.error("Erreur Sauvegarde:", e);
      setToast({ msg: "Erreur lors de la sauvegarde", type: "error" });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  // ============================================
  // HANDLERS LOCAUX (TEXTE & COULEUR)
  // ============================================
  const handleImageFieldChange = (field: keyof HeroImage, value: string) => {
    if (!data) return;
    setData({
      ...data,
      image: {
        ...data.image,
        [field]: value
      }
    });
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading || !data) {
    return (
      <Box sx={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: THEME_COLORS.olive }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{ width: "100%" }}
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.3)"
      overflow={"hidden"}
      borderRadius={3}
    >
      {/* HEADER TABS */}
      <Box
        sx={{
          width: "100%",
          bgcolor: THEME_COLORS.olive,
          px: { xs: 1, md: 4 },
        }}
      >
        <Grid container alignItems="center">
          <Grid item xs={9}>
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              variant="scrollable"
              sx={{
                minHeight: { xs: 50, md: 64 },
                "& .MuiTabs-indicator": { bgcolor: "white" },
                "& .MuiTab-root": {
                  color: "rgba(255,255,255,0.7)",
                  "&.Mui-selected": { color: "white" },
                },
              }}
            >
              <Tab icon={<PreviewIcon />} iconPosition="start" label="Aperçu" />
              <Tab 
                icon={
                  <Badge color="warning" variant="dot" invisible={!pendingHeroImage}>
                    <EditIcon />
                  </Badge>
                } 
                iconPosition="start" 
                label="Éditeur Hero" 
              />
            </Tabs>
          </Grid>
          <Grid item xs={3} sx={{ textAlign: "right", p: 1 }}>
            {/* Le modal ShowEditAbout gère le reste du contenu (Cards, History, CTA) */}
            <ShowEditAbout />
          </Grid>
        </Grid>
      </Box>

      {/* VUE APERÇU */}
      {tabValue === 0 && (
        <Box sx={{ bgcolor: "#FDFCFB" }}>
          <About />
        </Box>
      )}

      {/* VUE ÉDITEUR (HERO IMAGE) */}
      {tabValue === 1 && (
        <Box sx={{ height: { xs: "auto", md: "calc(100vh - 140px)" }, display: "flex", flexDirection: { xs: "column", md: "row" } }}>
          
          {/* GAUCHE : PRÉVISUALISATION IMAGE */}
          <Box sx={{ flex: 1, p: 3, bgcolor: "#f0f0f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <Paper 
              elevation={4}
              sx={{ 
                position: "relative", 
                width: "100%", 
                maxWidth: 800, 
                aspectRatio: "16/9", 
                borderRadius: 2, 
                overflow: "hidden",
                border: pendingHeroImage ? "4px dashed #ed6c02" : "none"
              }}
            >
              {data.image.imageUrl ? (
                <>
                  <img 
                    src={data.image.imageUrl} 
                    alt="Hero" 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  />
                  {/* Simulation Overlay Texte */}
                  <Box sx={{
                    position: "absolute",
                    bottom: 0, left: 0, right: 0,
                    p: 3,
                    background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                    color: "white"
                  }}>
                    <Typography variant="overline" sx={{ color: data.image.color, fontWeight: "bold", fontSize: "0.9rem" }}>
                      {data.image.subTitle}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {data.image.title}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#ccc" }}>
                  <ImageIcon sx={{ fontSize: 60, color: "#999" }} />
                </Box>
              )}

              {pendingHeroImage && (
                <Chip 
                  label="En attente de sauvegarde" 
                  color="warning" 
                  size="small" 
                  sx={{ position: "absolute", top: 10, right: 10 }} 
                />
              )}
            </Paper>

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUploadIcon />}
                sx={{ bgcolor: THEME_COLORS.olive }}
              >
                Changer l'image
                <input hidden type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])} />
              </Button>
              {pendingHeroImage && (
                <Button variant="outlined" color="warning" onClick={handleCancelPending}>
                  Annuler
                </Button>
              )}
            </Stack>
          </Box>

          {/* DROITE : FORMULAIRE */}
          <Box sx={{ width: { xs: "100%", md: 400 }, borderLeft: "1px solid #ddd", bgcolor: "white", display: "flex", flexDirection: "column" }}>
            <Box sx={{ p: 2, borderBottom: "1px solid #eee", bgcolor: "#fafafa" }}>
              <Typography variant="h6" fontWeight={600}>Paramètres Hero</Typography>
            </Box>
            
            <Box sx={{ p: 3, flex: 1, overflowY: "auto" }}>
              <Stack spacing={3}>
                <TextField
                  label="Titre Principal"
                  fullWidth
                  value={data.image.title}
                  onChange={(e) => handleImageFieldChange("title", e.target.value)}
                  variant="outlined"
                />
                
                <TextField
                  label="Sous-titre / Tagline"
                  fullWidth
                  value={data.image.subTitle}
                  onChange={(e) => handleImageFieldChange("subTitle", e.target.value)}
                  variant="outlined"
                  multiline
                  rows={2}
                />

                <TextField
                  label="Couleur d'accent (Sous-titre)"
                  fullWidth
                  value={data.image.color}
                  onChange={(e) => handleImageFieldChange("color", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ColorIcon sx={{ color: data.image.color }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <input 
                        type="color" 
                        value={data.image.color} 
                        onChange={(e) => handleImageFieldChange("color", e.target.value)}
                        style={{ border: "none", background: "transparent", width: 30, cursor: "pointer" }} 
                      />
                    )
                  }}
                />

                <Alert severity="info" sx={{ fontSize: "0.85rem" }}>
                  L'ID Cloudinary sera mis à jour automatiquement lors de la sauvegarde.
                  <br />
                  <strong>ID actuel :</strong> {data.image.imageId || "Aucun"}
                </Alert>
              </Stack>
            </Box>

            <Box sx={{ p: 2, borderTop: "1px solid #ddd", bgcolor: "#fafafa", textAlign: "right" }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                sx={{ 
                  bgcolor: pendingHeroImage ? "#ed6c02" : THEME_COLORS.olive,
                  "&:hover": { bgcolor: pendingHeroImage ? "#e65100" : "#4a4d2a" }
                }}
              >
                {saving ? "Sauvegarde..." : pendingHeroImage ? "Enregistrer & Uploader" : "Enregistrer"}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* TOAST */}
      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setToast(null)} severity={toast?.type || "info"} variant="filled">
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}