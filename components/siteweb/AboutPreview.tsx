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
import { About } from "./preview/About"
import EditAbout from "../about/EditAbout";

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
        <EditAbout/>
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