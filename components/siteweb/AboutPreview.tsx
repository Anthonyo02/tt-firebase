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
  const [pendingHeroImage, setPendingHeroImage] = useState<PendingImage | null>(
    null,
  );

  // ============================================
  // USEEFFECT - FIREBASE SYNC
  // ============================================
  useEffect(() => {
    const docRef = doc(db2, "website_content", "full_about");

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        // ⚠️ Données venant du cache (mode hors ligne)
        if (snapshot.metadata.fromCache) {
          setToast({
            msg: "Mode hors connexion — données locales affichées",
            type: "warning",
          });
        }

        // ✅ Le document existe (serveur ou cache)
        if (snapshot.exists()) {
          const docData = snapshot.data();

          const loadedData: AboutData = {
            image: {
              imageUrl:
                docData.image?.imageUrl ?? DEFAULT_ABOUT_DATA.image.imageUrl,

              imageId:
                docData.image?.imageId ?? DEFAULT_ABOUT_DATA.image.imageId,

              title: docData.image?.title ?? DEFAULT_ABOUT_DATA.image.title,

              subTitle:
                docData.image?.subTitle ?? DEFAULT_ABOUT_DATA.image.subTitle,

              color: docData.image?.color ?? DEFAULT_ABOUT_DATA.image.color,
            },

            history: docData.history ?? {},
            cards: docData.cards ?? [],
            values: docData.values ?? {},
            approach: docData.approach ?? {},
            cta: docData.cta ?? {},
          };

          setData(loadedData);
        } else {
          // ⚠️ IMPORTANT :
          // ❌ NE JAMAIS écrire en base ici
          // ✅ On affiche seulement les valeurs par défaut EN LOCAL
          setData(DEFAULT_ABOUT_DATA);
        }

        setLoading(false);
      },
      (error) => {
        console.error("Erreur Firestore :", error);

        setToast({
          msg: "Erreur de connexion à Firestore",
          type: "error",
        });

        setLoading(false);
      },
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
  // RENDER
  // ============================================
  if (loading || !data) {
    return (
      <Box
        sx={{
          height: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
                  <Badge
                    color="warning"
                    variant="dot"
                    invisible={!pendingHeroImage}
                  >
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
      {tabValue === 1 && <EditAbout />}

      {/* TOAST */}
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
        >
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
