"use client";

import React, { useState, useEffect, useCallback } from "react";
import imageCompression from "browser-image-compression";

// Firebase
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db2 } from "@/lib/firebase-site";

// Icons (MUI)
import {
  Favorite as Heart,
  Lightbulb,
  ArrowForward as ArrowRight,
  Edit as EditIcon,
  Visibility as PreviewIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  TextFields as TextFieldsIcon,
  Image as ImageIcon,
  Palette as PaletteIcon,
  EnergySavingsLeaf,
  TabOutlined,
  ChevronLeft,
  ChevronRight,
  DeleteOutline as DeleteOutlineIcon,
  Star as StarIcon,
  PhoneAndroid as MobileIcon,
  DesktopWindows as DesktopIcon,
  CloudUpload as CloudUploadIcon,
  HourglassEmpty as PendingIcon,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Container,
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
  MenuItem,
  Avatar,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
  Chip,
} from "@mui/material";
import { About } from "./preview/About";
import ShowEditAbout from "../modals/ShowEditAbout";

// --- Types ---
interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface AboutData {
  tagline: string;
  title: string;
  description: string;
  experienceYears: string;
  images: string[];
  features: Feature[];
}

// Type pour les images en attente d'upload
interface PendingImage {
  file: File;
  previewUrl: string;
}

// --- Icon Map ---
const ICON_MAP: Record<string, React.ReactElement> = {
  Target: <TabOutlined />,
  Heart: <Heart />,
  Lightbulb: <Lightbulb />,
  Leaf: <EnergySavingsLeaf />,
  Star: <StarIcon />,
};

// --- Theme Colors ---
const THEME_COLORS = {
  beige: "#D5B595",
  olive: "#868B63",
  bgLight: "#FDFCFB",
  textMain: "#1A1A1A",
};

// --- Options de compression ---
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp" as const,
};

// --- Helper: Extraire l'ID public Cloudinary depuis l'URL ---
const getCloudinaryPublicId = (url: string): string | null => {
  try {
    const regex = /\/v\d+\/(.+)\.[a-z]+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (e) {
    console.error("Erreur extraction ID", e);
    return null;
  }
};

// --- Valeurs par défaut ---
const DEFAULT_ABOUT_DATA: AboutData = {
  tagline: "QUI SOMMES-NOUS",
  title: "Une agence engagée pour un impact positif",
  description:
    "Tolo-Tady Communication est une agence de communication engagée à Madagascar, spécialisée dans le storytelling, la production audiovisuelle et le marketing digital au service des organisations à impact social, environnemental et économique positif.",
  experienceYears: "5+",
  images: ["/imgcarousel/bandfsdnier.png"],
  features: [
    {
      icon: "Target",
      title: "Impact mesurable",
      description: "Des résultats concrets pour votre communication",
    },
    {
      icon: "Heart",
      title: "Engagement social",
      description: "Au service d'un Madagascar meilleur",
    },
    {
      icon: "Lightbulb",
      title: "Innovation créative",
      description: "Des solutions adaptées et modernes",
    },
    {
      icon: "Leaf",
      title: "Durabilité",
      description: "Communication responsable et éthique",
    },
  ],
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function AboutPreview() {
  // Hooks pour responsive
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // États
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingImg, setDeletingImg] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  // ✅ NOUVEAU: État pour stocker les images en attente d'upload
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  // ============================================
  // USEEFFECT - FIREBASE SYNC
  // ============================================
  useEffect(() => {
    const docRef = doc(db2, "website_content", "about_section");

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = snapshot.data();

          const aboutData: AboutData = {
            tagline: docData.tagline || DEFAULT_ABOUT_DATA.tagline,
            title: docData.title || DEFAULT_ABOUT_DATA.title,
            description: docData.description || DEFAULT_ABOUT_DATA.description,
            experienceYears:
              docData.experienceYears || DEFAULT_ABOUT_DATA.experienceYears,
            images: Array.isArray(docData.images)
              ? docData.images
              : DEFAULT_ABOUT_DATA.images,
            features: Array.isArray(docData.features)
              ? docData.features.map((f: any) => ({
                  icon: f.icon || "Star",
                  title: f.title || "Nouveau point",
                  description: f.description || "",
                }))
              : DEFAULT_ABOUT_DATA.features,
          };

          setData(aboutData);
        } else {
          setDoc(docRef, DEFAULT_ABOUT_DATA);
          setData(DEFAULT_ABOUT_DATA);
        }

        setLoading(false);
      },
      (error) => {
        console.error("Erreur Firebase onSnapshot:", error);
        setToast({
          msg: "Erreur de connexion à la base de données",
          type: "error",
        });
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // ✅ NOUVEAU: Cleanup des blob URLs au démontage
  useEffect(() => {
    return () => {
      pendingImages.forEach((pending) => {
        URL.revokeObjectURL(pending.previewUrl);
      });
    };
  }, []);

  // ============================================
  // LOGIQUE DU CAROUSEL
  // ============================================
  const nextSlide = useCallback(() => {
    if (!data || data.images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % data.images.length);
  }, [data]);

  const prevSlide = useCallback(() => {
    if (!data || data.images.length <= 1) return;
    setCurrentIndex(
      (prev) => (prev - 1 + data.images.length) % data.images.length,
    );
  }, [data]);

  useEffect(() => {
    if (tabValue === 1 || !data || data.images.length <= 1) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [data, tabValue, nextSlide]);

  // ✅ NOUVEAU: Vérifier si une URL est une image en attente
  const isPendingImage = useCallback(
    (url: string): boolean => {
      return pendingImages.some((p) => p.previewUrl === url);
    },
    [pendingImages],
  );

  // ✅ NOUVEAU: Obtenir le nombre d'images en attente
  const pendingCount = pendingImages.length;

  // ============================================
  // ACTIONS - SAUVEGARDE (MODIFIÉ)
  // ============================================
  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setUploading(pendingImages.length > 0);

    try {
      let finalImages = [...data.images];
      const uploadErrors: string[] = [];

      // ✅ Upload des images en attente une par une
      for (const pending of pendingImages) {
        try {
          // Compression de l'image
          const compressedFile = await imageCompression(
            pending.file,
            COMPRESSION_OPTIONS,
          );

          // Upload vers Cloudinary
          const formData = new FormData();
          formData.append("file", compressedFile);

          const res = await fetch("/api/cloudinary/uploadweb/about", {
            method: "POST",
            body: formData,
          });

          const resData = await res.json();

          if (!res.ok) {
            throw new Error(resData.error || "Erreur upload");
          }

          // Remplacer l'URL temporaire par l'URL Cloudinary
          const index = finalImages.indexOf(pending.previewUrl);
          if (index !== -1) {
            finalImages[index] = resData.imageUrl;
          }

          // Libérer la mémoire du blob URL
          URL.revokeObjectURL(pending.previewUrl);
        } catch (uploadError: any) {
          console.error("Erreur upload image:", uploadError);
          uploadErrors.push(pending.file.name);

          // Retirer l'image échouée de la liste
          finalImages = finalImages.filter((img) => img !== pending.previewUrl);
          URL.revokeObjectURL(pending.previewUrl);
        }
      }

      // Vider la liste des images en attente
      setPendingImages([]);

      // Mettre à jour le state local avec les URLs finales
      setData({ ...data, images: finalImages });

      // Sauvegarder dans Firebase
      await updateDoc(doc(db2, "website_content", "about_section"), {
        ...data,
        images: finalImages,
      });

      // Afficher le message approprié
      if (uploadErrors.length > 0) {
        setToast({
          msg: `Sauvegarde effectuée, mais ${uploadErrors.length} image(s) n'ont pas pu être uploadées`,
          type: "warning",
        });
      } else {
        setToast({ msg: "Contenu mis à jour avec succès !", type: "success" });
      }
    } catch (e: any) {
      console.error("Erreur sauvegarde:", e);
      setToast({
        msg: e.message || "Erreur lors de la sauvegarde",
        type: "error",
      });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  // ============================================
  // ACTIONS - AJOUT IMAGE TEMPORAIRE (MODIFIÉ)
  // ============================================
  const handleImageSelect = (file: File) => {
    if (!data) return;

    // Créer une URL temporaire pour la prévisualisation
    const previewUrl = URL.createObjectURL(file);

    // Ajouter à la liste des images en attente
    setPendingImages((prev) => [...prev, { file, previewUrl }]);

    // Ajouter l'URL temporaire aux images pour l'affichage
    setData({ ...data, images: [...data.images, previewUrl] });

    // Sélectionner automatiquement la nouvelle image
    setSelectedImageIndex(data.images.length);

    setToast({
      msg: "Image ajoutée en prévisualisation. Cliquez sur 'Enregistrer' pour confirmer.",
      type: "info",
    });
  };

  // ============================================
  // ACTIONS - SUPPRESSION IMAGE (MODIFIÉ)
  // ============================================
  const handleDeleteImage = async (index: number) => {
    if (!data || data.images.length <= 1) {
      setToast({
        msg: "Vous devez garder au moins une image",
        type: "error",
      });
      return;
    }

    const imageUrl = data.images[index];

    // ✅ Si c'est une image en attente, on la supprime simplement
    if (isPendingImage(imageUrl)) {
      // Libérer le blob URL
      URL.revokeObjectURL(imageUrl);

      // Retirer de la liste des images en attente
      setPendingImages((prev) => prev.filter((p) => p.previewUrl !== imageUrl));

      // Retirer de data.images
      const newImages = data.images.filter((_, idx) => idx !== index);
      setData({ ...data, images: newImages });

      // Ajuster la sélection
      if (selectedImageIndex >= newImages.length) {
        setSelectedImageIndex(Math.max(0, newImages.length - 1));
      }
      if (currentIndex >= newImages.length) {
        setCurrentIndex(Math.max(0, newImages.length - 1));
      }

      setToast({
        msg: "Image temporaire supprimée",
        type: "success",
      });
      return;
    }

    // ✅ Si c'est une image déjà sur Cloudinary
    setDeletingImg(index);

    try {
      const publicId = getCloudinaryPublicId(imageUrl);

      if (publicId) {
        const response = await fetch("/api/cloudinary/deleteweb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId }),
        });

        if (!response.ok) {
          console.warn("Erreur suppression Cloudinary (non bloquant)");
        }
      }

      const newImages = data.images.filter((_, idx) => idx !== index);
      setData({ ...data, images: newImages });

      if (selectedImageIndex >= newImages.length) {
        setSelectedImageIndex(Math.max(0, newImages.length - 1));
      }
      if (currentIndex >= newImages.length) {
        setCurrentIndex(Math.max(0, newImages.length - 1));
      }

      setToast({
        msg: "Image supprimée. N'oubliez pas d'enregistrer.",
        type: "success",
      });
    } catch (e: any) {
      console.error("Erreur suppression:", e);
      setToast({
        msg: "Erreur lors de la suppression",
        type: "error",
      });
    } finally {
      setDeletingImg(null);
    }
  };

  // ============================================
  // ACTIONS - ANNULER LES IMAGES EN ATTENTE
  // ============================================
  const handleCancelPendingImages = () => {
    if (!data) return;

    // Libérer tous les blob URLs
    pendingImages.forEach((pending) => {
      URL.revokeObjectURL(pending.previewUrl);
    });

    // Retirer les images en attente de data.images
    const confirmedImages = data.images.filter((img) => !isPendingImage(img));
    setData({ ...data, images: confirmedImages });

    // Vider la liste des images en attente
    setPendingImages([]);

    // Ajuster la sélection
    if (selectedImageIndex >= confirmedImages.length) {
      setSelectedImageIndex(Math.max(0, confirmedImages.length - 1));
    }

    setToast({
      msg: "Images en attente annulées",
      type: "info",
    });
  };

  // ============================================
  // ACTIONS - MODIFICATIONS LOCALES
  // ============================================
  const handleLocalChange = (field: keyof AboutData, value: any) => {
    if (!data) return;
    setData({ ...data, [field]: value });
  };

  const handleFeatureChange = (
    index: number,
    field: keyof Feature,
    value: string,
  ) => {
    if (!data) return;
    const newFeatures = [...data.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setData({ ...data, features: newFeatures });
  };

  const handleAddFeature = () => {
    if (!data) return;
    setData({
      ...data,
      features: [
        ...data.features,
        {
          icon: "Star",
          title: "Nouveau point",
          description: "Description ici",
        },
      ],
    });
  };

  const handleRemoveFeature = (index: number) => {
    if (!data || data.features.length <= 1) {
      setToast({
        msg: "Vous devez garder au moins un point fort",
        type: "error",
      });
      return;
    }
    setData({
      ...data,
      features: data.features.filter((_, idx) => idx !== index),
    });
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading || !data) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress size={60} sx={{ color: THEME_COLORS.olive }} />
        <Typography color="text.secondary">
          Chargement de la section...
        </Typography>
      </Box>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <Box
      sx={{ width: "100%", minHeight: "100vh" }}
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.3)"
      overflow={"hidden"}
      borderRadius={3}
    >
      {/* ========== TABS HEADER ========== */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 1400,
          mx: "auto",
          // Un peu de padding vertical sur mobile pour aérer
          pt: { xs: 1, md: 0 },
          px: { xs: 1, md: 4 },
        }}
        bgcolor={"#616637"}
      >
        <Grid container alignItems="center">
          {" "}
          {/* Ajout de alignItems center */}
          {/* ZONE TABS : Prend plus de place sur mobile pour le scroll */}
          <Grid item xs={9} sm={8} md={9}>
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              variant="scrollable" // IMPORTANT: Permet le scroll horizontal sur petit mobile
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: { xs: 50, md: 64 }, // Hauteur réduite sur mobile
                "& .MuiTabs-indicator": {
                  height: 4,
                  borderRadius: "3px 3px 0 0",
                  background: "white",
                },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: { xs: "0.8rem", md: "1rem" },
                  minHeight: { xs: 50, md: 64 },
                  color: "rgba(255,255,255, 0.7)",
                  padding: { xs: "12px 10px", md: "12px 16px" }, // Moins de padding sur mobile
                  "&.Mui-selected": { color: "white" },
                },
              }}
            >
              <Tab
                icon={<PreviewIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
                iconPosition="start"
                label={isMobile ? "Aperçu" : "Aperçu du site"}
              />
              <Tab
                icon={
                  <Badge
                    // badgeContent={pendingCount}
                    sx={{
                      "& .MuiBadge-badge": {
                        // background: "THEME.secondary.gradient", // Décommentez si vous avez accès au thème
                        background: "#ff4444",
                        color: "white",
                      },
                    }}
                  >
                    <EditIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
                  </Badge>
                }
                iconPosition="start"
                label={isMobile ? "Éditeur" : "Éditeur Visuel"}
              />
            </Tabs>
          </Grid>
          {/* ZONE BOUTON : S'adapte à droite */}
          <Grid item xs={3} sm={4} md={3}>
            <ShowEditAbout />
          </Grid>
        </Grid>
      </Box>
      {/* ========== VUE APERÇU ========== */}
      {tabValue === 0 && (
        <Box
          component="section"
          sx={{
            bgcolor: "#FDFCFB",
            overflow: "hidden",
          }}
        >
          <About />
        </Box>
      )}

      {/* ========== VUE ÉDITEUR ========== */}
      {tabValue === 1 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: { xs: "auto", md: "calc(100vh - 72px)" },
          }}
        >
          {/* TOP BAR: IMAGES */}
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              overflowX: "auto",
              zIndex: 10,
              borderRadius: 0,
              flexShrink: 0,
            }}
          >
            <Button
              component="label"
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
            >
              {isMobile ? "Ajouter" : "Ajouter Image"}
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={(e) =>
                  e.target.files?.[0] && handleImageSelect(e.target.files[0])
                }
              />
            </Button>

            {/* ✅ NOUVEAU: Indicateur d'images en attente */}
            {pendingCount > 0 && (
              <>
                <Chip
                  icon={<PendingIcon />}
                  label={`${pendingCount} en attente`}
                  color="warning"
                  size="small"
                  onDelete={handleCancelPendingImages}
                />
              </>
            )}

            <Divider orientation="vertical" flexItem />
            <Stack direction="row" spacing={2} alignItems="center">
              {data.images.map((img, idx) => {
                const isPending = isPendingImage(img);
                return (
                  <Box
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    sx={{
                      position: "relative",
                      cursor: "pointer",
                      border:
                        selectedImageIndex === idx
                          ? "3px solid #1976d2"
                          : isPending
                            ? "2px dashed #ed6c02"
                            : "2px solid #616637",
                      borderRadius: 1,
                      opacity: selectedImageIndex === idx ? 1 : 0.7,
                      transition: "all 0.2s",
                      "&:hover": { opacity: 1, transform: "scale(1.05)" },
                      flexShrink: 0,
                    }}
                  >
                    <Avatar
                      src={img}
                      variant="rounded"
                      sx={{ width: 80, height: 50 }}
                    >
                      <ImageIcon />
                    </Avatar>

                    {/* ✅ Badge indiquant si l'image est en attente */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        bgcolor: isPending
                          ? "#ed6c02"
                          : selectedImageIndex === idx
                            ? "#1976d2"
                            : "#616637",
                        color: "white",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {isPending ? "!" : idx + 1}
                    </Box>

                    {data.images.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(idx);
                        }}
                        disabled={deletingImg === idx}
                        sx={{
                          position: "absolute",
                          bottom: -8,
                          right: -8,
                          bgcolor: "error.main",
                          color: "white",
                          width: 20,
                          height: 20,
                          "&:hover": { bgcolor: "error.dark" },
                        }}
                      >
                        {deletingImg === idx ? (
                          <CircularProgress size={10} color="inherit" />
                        ) : (
                          <DeleteIcon sx={{ fontSize: 12 }} />
                        )}
                      </IconButton>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Paper>

          {/* MAIN AREA: GRID SPLIT */}
          <Box
            sx={{
              flex: 1,
              overflow: { xs: "visible", md: "hidden" },
              p: { xs: 2, md: 3 },
            }}
          >
            <Grid container spacing={2} sx={{ height: "100%" }}>
              {/* COLONNE GAUCHE: PRÉVISUALISATION */}
              <Grid
                item
                xs={12}
                md={7}
                lg={8}
                sx={{
                  height: { xs: "auto", md: "100%" },
                  display: "flex",
                  flexDirection: "column",
                  minHeight: { xs: 400, md: 0 },
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    color="text.secondary"
                  >
                    Prévisualisation
                  </Typography>
                  {isMobile && <MobileIcon color="disabled" />}
                  {!isMobile && <DesktopIcon color="disabled" />}
                </Stack>

                <Paper
                  elevation={4}
                  sx={{
                    flex: 1,
                    borderRadius: 4,
                    overflow: "hidden",
                    position: "relative",
                    border: "4px solid white",
                    bgcolor: THEME_COLORS.bgLight,
                    height: { xs: "500px", md: "auto" },
                  }}
                >
                  {/* ✅ Indicateur si l'image affichée est en attente */}
                  {isPendingImage(data.images[selectedImageIndex]) && (
                    <Chip
                      icon={<PendingIcon />}
                      label="Non enregistrée"
                      color="warning"
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        zIndex: 10,
                      }}
                    />
                  )}

                  <Box
                    sx={{
                      height: "100%",
                      p: { xs: 2, md: 4 },
                      overflowY: "auto",
                    }}
                  >
                    <Grid container spacing={4} alignItems="center">
                      <Grid item xs={12} container>
                        <Box>
                          <Box
                            sx={{
                              borderRadius: "16px",
                              overflow: "hidden",
                              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                            }}
                          >
                            <img
                              src={
                                data.images[selectedImageIndex] ||
                                data.images[0]
                              }
                              alt="preview"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </Box>
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 12,
                              right: 10,
                              bgcolor: THEME_COLORS.beige,
                              color: "white",
                              p: 1,
                              borderRadius: "12px",
                              boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                            }}
                          >
                            <Typography
                              variant="h5"
                              fontWeight="bold"
                              align="left"
                            >
                              {data.experienceYears}
                            </Typography>
                            <Typography variant="body2" display="block">
                              Années d'expérience
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>

              {/* COLONNE DROITE: ÉDITEUR */}
              <Grid
                item
                xs={12}
                md={5}
                lg={4}
                sx={{
                  height: { xs: "auto", md: "100%" },
                  overflowY: { xs: "visible", md: "auto" },
                  pr: 1,
                }}
                pt={0}
              >
                <Stack
                  borderRadius={1}
                  spacing={2}
                  sx={{
                    height: { xs: "auto", md: "100%" },
                    overflowY: { xs: "visible", md: "auto" },
                    pr: 1,
                  }}
                >
                  <Grid
                    container
                    sx={{ position: "sticky", top: 0, zIndex: 99 }}
                    bgcolor={"#616637"}
                    borderRadius={1}
                  >
                    <Typography variant="h6" fontWeight={600} m={2}>
                      Propriétés
                    </Typography>
                  </Grid>

                  {/* ACCORDION: TEXTES */}
                  <Accordion
                    defaultExpanded
                    elevation={0}
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px !important",
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction="row" spacing={1}>
                        <TextFieldsIcon color="primary" />
                        <Typography fontWeight={500}>Textes</Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        <TextField
                          label="Surtitre"
                          fullWidth
                          size="small"
                          value={data.tagline}
                          onChange={(e) =>
                            handleLocalChange("tagline", e.target.value)
                          }
                        />
                        <TextField
                          label="Titre Principal"
                          fullWidth
                          multiline
                          rows={2}
                          value={data.title}
                          onChange={(e) =>
                            handleLocalChange("title", e.target.value)
                          }
                        />
                        <TextField
                          label="Description"
                          fullWidth
                          multiline
                          rows={4}
                          value={data.description}
                          onChange={(e) =>
                            handleLocalChange("description", e.target.value)
                          }
                        />
                        <TextField
                          label="Années d'expérience"
                          fullWidth
                          size="small"
                          value={data.experienceYears}
                          onChange={(e) =>
                            handleLocalChange("experienceYears", e.target.value)
                          }
                        />
                      </Stack>
                    </AccordionDetails>
                  </Accordion>

                  {/* ACCORDION: FEATURES */}
                  <Accordion
                    elevation={0}
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px !important",
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction="row" spacing={1}>
                        <PaletteIcon color="secondary" />
                        <Badge
                          badgeContent={data.features.length}
                          color="primary"
                        >
                          <Typography fontWeight={500} sx={{ mr: 1 }}>
                            Points forts
                          </Typography>
                        </Badge>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ bgcolor: "#fafafa", px: 1 }}>
                      <Stack spacing={2}>
                        {data.features.map((f, i) => (
                          <Paper
                            key={i}
                            elevation={1}
                            sx={{ p: 2, borderLeft: "4px solid #868B63" }}
                          >
                            <Grid container spacing={2}>
                              <Grid
                                item
                                xs={12}
                                display="flex"
                                justifyContent="space-between"
                              >
                                <Typography
                                  variant="caption"
                                  fontWeight="bold"
                                  color="primary"
                                >
                                  POINT #{i + 1}
                                </Typography>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveFeature(i)}
                                  disabled={data.features.length <= 1}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  select
                                  label="Icône"
                                  value={f.icon}
                                  onChange={(e) =>
                                    handleFeatureChange(
                                      i,
                                      "icon",
                                      e.target.value,
                                    )
                                  }
                                  size="small"
                                  fullWidth
                                >
                                  {Object.keys(ICON_MAP).map((key) => (
                                    <MenuItem key={key} value={key}>
                                      <Stack direction="row" gap={1}>
                                        {React.cloneElement(ICON_MAP[key], {
                                          fontSize: "small",
                                        })}
                                        {key}
                                      </Stack>
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  label="Titre"
                                  value={f.title}
                                  onChange={(e) =>
                                    handleFeatureChange(
                                      i,
                                      "title",
                                      e.target.value,
                                    )
                                  }
                                  size="small"
                                  fullWidth
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  label="Description"
                                  value={f.description}
                                  onChange={(e) =>
                                    handleFeatureChange(
                                      i,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                  size="small"
                                  fullWidth
                                  multiline
                                  rows={2}
                                />
                              </Grid>
                            </Grid>
                          </Paper>
                        ))}
                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={handleAddFeature}
                          fullWidth
                          sx={{ borderStyle: "dashed" }}
                        >
                          Ajouter un point fort
                        </Button>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>

                  {/* SPACER */}
                  <Box sx={{ height: 20 }} />

                  {/* BOUTON ENREGISTRER */}
                  <Grid
                    container
                    justifyContent={"right"}
                    sx={{ position: "sticky", bottom: 1, zIndex: 99 }}
                  >
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={
                        saving ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : pendingCount > 0 ? (
                          <CloudUploadIcon />
                        ) : (
                          <SaveIcon />
                        )
                      }
                      onClick={handleSave}
                      disabled={saving}
                      sx={{
                        borderRadius: 2,
                        bgcolor: pendingCount > 0 ? "#ed6c02" : "#616637",
                        "&:hover": {
                          bgcolor: pendingCount > 0 ? "#c55a02" : "#4a4d2a",
                        },
                      }}
                    >
                      {saving
                        ? uploading
                          ? "Upload en cours..."
                          : "Enregistrement..."
                        : pendingCount > 0
                          ? `Enregistrer (${pendingCount} image${pendingCount > 1 ? "s" : ""} à uploader)`
                          : "Enregistrer les modifications"}
                    </Button>
                  </Grid>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}

      {/* ========== TOAST NOTIFICATION ========== */}
      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast(null)}
          severity={toast?.type || "info"}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
