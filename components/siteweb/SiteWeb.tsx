"use client";

import React, { useState, useEffect, useCallback } from "react";
import imageCompression from "browser-image-compression";

// Firebase Imports
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { db2 } from "@/lib/firebase-site";

// MUI Icons
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import PlayArrow from "@mui/icons-material/PlayArrow";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import Delete from "@mui/icons-material/Delete";
import PreviewIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import StarIcon from "@mui/icons-material/Star";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import FavoriteIcon from "@mui/icons-material/Favorite";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ImageIcon from "@mui/icons-material/Image";
import PaletteIcon from "@mui/icons-material/Palette";
import LinkIcon from "@mui/icons-material/Link";
import TextFieldsIcon from "@mui/icons-material/TextFields";

// MUI Components
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardMedia,
  Grid,
  CircularProgress,
  MenuItem,
  Stack,
  Alert,
  Snackbar,
  Divider,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Badge,
  useMediaQuery,
} from "@mui/material";
import { HeroCarousel } from "./preview/Hero";
import theme from "@/theme/muiTheme";

// --- Types ---
interface CtaButton {
  label: string;
  href: string;
  color: "primary" | "outline" | "secondary";
}

interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  imagePublicId?: string;
  icon: string;
  overlayColor: string;
  ctas: CtaButton[];
  order: number;
}

// --- Mapping des Icônes ---
const ICON_MAP: Record<string, React.ReactElement> = {
  Sparkles: <AutoAwesome />,
  Star: <StarIcon />,
  Rocket: <RocketLaunchIcon />,
  Lightbulb: <LightbulbIcon />,
  Heart: <FavoriteIcon />,
  Play: <PlayArrow />,
};

// --- Options de couleur pour les boutons CTA ---
const CTA_COLOR_OPTIONS = [
  { value: "primary", label: "Primaire (Plein)" },
  { value: "outline", label: "Contour (Transparent)" },
  { value: "secondary", label: "Secondaire" },
];

// --- Options de compression ---
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp" as const,
};

// --- Fonction helper pour convertir overlayColor en CSS ---
const getOverlayGradient = (overlayColor: string): string => {
  const colorMap: Record<string, string> = {
    "from-primary/80": "rgba(25, 118, 210, 0.8)",
    "from-secondary/80": "rgba(156, 39, 176, 0.8)",
    "from-blue-900/80": "rgba(13, 71, 161, 0.8)",
    "from-green-900/80": "rgba(27, 94, 32, 0.8)",
    "from-purple-900/80": "rgba(74, 20, 140, 0.8)",
    "from-black/70": "rgba(0, 0, 0, 0.7)",
  };
  return colorMap[overlayColor] || overlayColor || "rgba(0, 0, 0, 0.7)";
};

export default function SiteWeb() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [tabValue, setTabValue] = useState(0);

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // État pour l'édition
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<SlideData | null>(null);

  // --- 1. FIREBASE: Charger les données en temps réel ---
  useEffect(() => {
    const slidesRef = collection(db2, "website_slides");
    const q = query(slidesRef, orderBy("order", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSlides = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || "Sans titre",
          subtitle: data.subtitle || "",
          image: data.image || "/imgcarousel/placeholder.png",
          imagePublicId: data.imagePublicId || "",
          icon: data.icon || "Sparkles",
          overlayColor: data.overlayColor || "#616637",
          ctas: data.ctas || [
            { label: "En savoir plus", href: "#", color: "primary" },
          ],
          order: data.order || 0,
        } as SlideData;
      });

      setSlides(fetchedSlides);
      setLoading(false);

      if (fetchedSlides.length > 0 && !selectedSlideId) {
        setSelectedSlideId(fetchedSlides[0].id);
      }
    });

    return () => unsubscribe();
  }, [selectedSlideId]); // Ajout dépendance safe

  const selectedSlide = slides.find((s) => s.id === selectedSlideId) || null;

  // --- Logique du Carousel ---
  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (tabValue === 1 || slides.length === 0) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, tabValue, slides.length]);

  // --- 2. CLOUDINARY ---
  const handleImageUpload = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
      const currentSlideData = slides.find((s) => s.id === id);

      const formData = new FormData();
      formData.append("file", compressedFile);
      if (currentSlideData?.imagePublicId) {
        formData.append("publicId", currentSlideData.imagePublicId);
      }

      const res = await fetch("/api/cloudinary/uploadweb", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await updateDoc(doc(db2, "website_slides", id), {
        image: data.imageUrl,
        imagePublicId: data.imagePublicId,
      });

      setToast({ msg: "Image mise à jour !", type: "success" });
    } catch (error: any) {
      setToast({ msg: error.message || "Erreur upload", type: "error" });
    } finally {
      setUploadingId(null);
    }
  };

  // --- 3. ACTIONS ---
  const handleAddSlide = async () => {
    try {
      const maxOrder = slides.reduce((max, s) => Math.max(max, s.order), 0);
      const newSlide = {
        title: "Nouveau Slide",
        subtitle: "Description courte ici",
        image: "/imgcarousel/placeholder.png",
        icon: "Sparkles",
        overlayColor: "#1976d2",
        ctas: [{ label: "En savoir plus", href: "#", color: "primary" }],
        order: maxOrder + 1,
      };
      const docRef = await addDoc(collection(db2, "website_slides"), newSlide);
      setSelectedSlideId(docRef.id);
      setToast({ msg: "Slide ajouté", type: "success" });
    } catch (e: any) {
      setToast({ msg: e.message, type: "error" });
    }
  };

  const confirmDelete = (slide: SlideData) => {
    setSlideToDelete(slide);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!slideToDelete) return;
    try {
      await deleteDoc(doc(db2, "website_slides", slideToDelete.id));
      if (slideToDelete.imagePublicId) {
        fetch("/api/cloudinary/deleteweb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: slideToDelete.imagePublicId }),
        }).catch(console.error);
      }
      setToast({ msg: "Slide supprimé", type: "success" });
      const remaining = slides.filter((s) => s.id !== slideToDelete.id);
      setSelectedSlideId(remaining.length > 0 ? remaining[0].id : null);
    } catch (e: any) {
      setToast({ msg: e.message, type: "error" });
    } finally {
      setDeleteDialogOpen(false);
      setSlideToDelete(null);
    }
  };

  const handleLocalChange = (
    id: string,
    field: keyof SlideData,
    value: any,
  ) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const handleCtaChange = (
    slideId: string,
    ctaIndex: number,
    field: keyof CtaButton,
    value: string,
  ) => {
    setSlides((prev) =>
      prev.map((slide) => {
        if (slide.id !== slideId) return slide;
        const newCtas = [...slide.ctas];
        newCtas[ctaIndex] = { ...newCtas[ctaIndex], [field]: value };
        return { ...slide, ctas: newCtas };
      }),
    );
  };

  const handleAddCta = (slideId: string) => {
    setSlides((prev) =>
      prev.map((slide) => {
        if (slide.id !== slideId) return slide;
        return {
          ...slide,
          ctas: [
            ...slide.ctas,
            { label: "Bouton", href: "#", color: "outline" as const },
          ],
        };
      }),
    );
  };

  const handleRemoveCta = (slideId: string, ctaIndex: number) => {
    setSlides((prev) =>
      prev.map((slide) => {
        if (slide.id !== slideId) return slide;
        return {
          ...slide,
          ctas: slide.ctas.filter((_, idx) => idx !== ctaIndex),
        };
      }),
    );
  };

  const handleSaveSlide = async (id: string) => {
    const slideToSave = slides.find((s) => s.id === id);
    if (!slideToSave) return;
    setSavingId(id);
    try {
      await updateDoc(doc(db2, "website_slides", id), {
        title: slideToSave.title,
        subtitle: slideToSave.subtitle,
        icon: slideToSave.icon,
        overlayColor: slideToSave.overlayColor,
        ctas: slideToSave.ctas,
        order: slideToSave.order,
      });
      setToast({ msg: "Sauvegardé avec succès", type: "success" });
    } catch (e: any) {
      setToast({ msg: e.message, type: "error" });
    } finally {
      setSavingId(null);
    }
  };
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  if (loading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{ width: "100%" }}
      // border={"red solid 2px"}
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.3)"
      borderRadius={3}
      overflow={"hidden"}
    >
      {/* TABS HEADER */}
      <Box
        sx={{
          maxWidth: 1400,
          mx: "auto",
          px: { xs: 0, md: 4 },
          bgcolor: "#616637",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{
            "& .MuiTabs-indicator": {
              height: 5,
              borderRadius: "3px 3px 0 0",
              background: "white",
            },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: { xs: "0.875rem", md: "1rem" },
              minHeight: 64,
              color: "white",
              "&.Mui-selected": { color: "white" },
            },
          }}
        >
          <Tab
            icon={<PreviewIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={isMobile ? "Aperçu" : "Aperçu du site"}
          />
          <Tab
            icon={
              <Badge
                // badgeContent={pendingCount}
                sx={{
                  "& .MuiBadge-badge": {
                    background: "THEME.secondary.gradient",
                    color: "white",
                  },
                }}
              >
                <EditIcon sx={{ fontSize: 20 }} />
              </Badge>
            }
            iconPosition="start"
            label={isMobile ? "Éditeur" : "Éditeur Visuel"}
          />
        </Tabs>
      </Box>

      {/* --- VUE APERÇU (Identique à avant) --- */}
      {tabValue === 0 && <HeroCarousel />}

      {/* --- NOUVELLE VUE ÉDITEUR (Split Screen) --- */}
      {tabValue === 1 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: { xs: "auto", md: "calc(100vh - 72px)" },
          }}
        >
          {/* 1. TOP BAR: SÉLECTEUR DE SLIDES (Horizontal) */}
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              overflowX: "auto",
              // bgcolor: "red",
              zIndex: 10,
              borderRadius: 0,
            }}
          >
            <Button
              variant="contained"
              onClick={handleAddSlide}
              startIcon={<AddIcon />}
              sx={{ flexShrink: 0 }}
            >
              Nouveau
            </Button>
            <Divider orientation="vertical" flexItem />
            <Stack direction="row" spacing={2} alignItems="center">
              {slides.map((slide) => (
                <Box
                  key={slide.id}
                  onClick={() => setSelectedSlideId(slide.id)}
                  sx={{
                    position: "relative",
                    cursor: "pointer",
                    border:
                      selectedSlideId === slide.id
                        ? "3px solid #1976d2"
                        : "2px solid #616637",
                    borderRadius: 1,
                    opacity: selectedSlideId === slide.id ? 1 : 0.7,
                    transition: "all 0.2s",
                    "&:hover": { opacity: 1, transform: "scale(1.05)" },
                  }}
                >
                  <Avatar
                    src={slide.image}
                    variant="rounded"
                    sx={{ width: 80, height: 50 }}
                  >
                    <ImageIcon />
                  </Avatar>
                  <Box
                    sx={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      bgcolor: selectedSlideId === slide.id ? "red" : "#616637",
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
                    {slide.order}
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>

          {/* 2. MAIN AREA: GRID SPLIT */}
          <Box
            sx={{ flex: 1, p: { xs: 1, sm: 6 }, overflow: "hidden" }}
            bgcolor={"secondary"}
          >
            {selectedSlide ? (
              <Grid container spacing={4} sx={{ height: "100%" }}>
                {/* COLONNE GAUCHE: PRÉVISUALISATION FIXE */}
                <Grid
                  item
                  xs={12}
                  md={7}
                  lg={8}
                  sx={{
                    height: "100%",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    fontWeight={600}
                    color="text.secondary"
                  >
                    Prévisualisation en direct
                  </Typography>
                  <Paper
                    elevation={4}
                    sx={{
                      flex: 1,
                      borderRadius: { xs: 0, sm: 4 },
                      overflow: "hidden",
                      position: "relative",
                      border: "4px solid white",
                    }}
                  >
                    <Box>
                      <img
                        src={selectedSlide.image}
                        alt="bg"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          background: `linear-gradient(to right, ${getOverlayGradient(selectedSlide.overlayColor)} 0%, transparent 100%)`,
                        }}
                      />
                    </Box>

                    {/* Contenu simulé */}
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        p: { xs: 2, sm: 5 },
                        display: "flex",
                        alignItems: "center",
                        color: "white",
                      }}
                    >
                      <Box sx={{ maxWidth: "80%" }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            bgcolor: "rgba(255,255,255,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mb: 2,
                          }}
                        >
                          {React.cloneElement(
                            ICON_MAP[selectedSlide.icon] || <AutoAwesome />,
                            { fontSize: "small" },
                          )}
                        </Box>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                          {selectedSlide.title}
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
                          {selectedSlide.subtitle}
                        </Typography>
                        <Stack direction="row" spacing={{ xs: 1, sm: 3 }}>
                          {selectedSlide.ctas.map((cta, i) => (
                            <Button
                              key={i}
                              variant={
                                cta.color === "outline"
                                  ? "outlined"
                                  : "contained"
                              }
                              color={
                                cta.color === "outline" ? "inherit" : "primary"
                              }
                              sx={
                                cta.color === "outline"
                                  ? { borderColor: "white", color: "white" }
                                  : {}
                              }
                            >
                              {cta.label}
                            </Button>
                          ))}
                        </Stack>
                      </Box>
                    </Box>

                    {/* Bouton Upload Flottant */}
                    <Box sx={{ position: "absolute", top: 16, right: 16 }}>
                      <Button
                        component="label"
                        variant="contained"
                        color="info"
                        startIcon={
                          uploadingId ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <CloudUploadIcon />
                          )
                        }
                        disabled={!!uploadingId}
                        sx={{ borderRadius: 4 }}
                      >
                        Changer l'image
                        <input
                          hidden
                          accept="image/*"
                          type="file"
                          onChange={(e) =>
                            e.target.files?.[0] &&
                            handleImageUpload(
                              selectedSlide.id,
                              e.target.files[0],
                            )
                          }
                        />
                      </Button>
                    </Box>
                  </Paper>
                </Grid>

                {/* COLONNE DROITE: ÉDITEUR ACCORDÉONS */}
                <Grid
                  item
                  xs={12}
                  md={5}
                  lg={4}
                  sx={{ height: "100%", overflowY: "auto", pr: 1 }}
                >
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="h6" fontWeight={600}>
                        Propriétés
                      </Typography>
                      <IconButton
                        color="error"
                        onClick={() => confirmDelete(selectedSlide)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                    {/* 1. TEXTE */}
                    <Accordion
                      defaultExpanded
                      elevation={0}
                      sx={{
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px !important",
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextFieldsIcon color="primary" />
                          <Typography fontWeight={500}>Textes</Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <TextField
                            label="Titre Principal"
                            fullWidth
                            multiline
                            rows={2}
                            value={selectedSlide.title}
                            onChange={(e) =>
                              handleLocalChange(
                                selectedSlide.id,
                                "title",
                                e.target.value,
                              )
                            }
                          />
                          <TextField
                            label="Sous-titre"
                            fullWidth
                            multiline
                            rows={3}
                            value={selectedSlide.subtitle}
                            onChange={(e) =>
                              handleLocalChange(
                                selectedSlide.id,
                                "subtitle",
                                e.target.value,
                              )
                            }
                          />
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                    {/* 2. STYLE */}
                    <Accordion
                      elevation={0}
                      sx={{
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px !important",
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PaletteIcon color="secondary" />
                          <Typography fontWeight={500}>
                            Apparence & Ordre
                          </Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <TextField
                            select
                            label="Icône décorative"
                            value={selectedSlide.icon}
                            onChange={(e) =>
                              handleLocalChange(
                                selectedSlide.id,
                                "icon",
                                e.target.value,
                              )
                            }
                            fullWidth
                          >
                            {Object.keys(ICON_MAP).map((key) => (
                              <MenuItem key={key} value={key}>
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  gap={1}
                                >
                                  {React.cloneElement(ICON_MAP[key], {
                                    fontSize: "small",
                                  })}
                                  {key}
                                </Stack>
                              </MenuItem>
                            ))}
                          </TextField>

                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1,
                                bgcolor: selectedSlide.overlayColor,
                                border: "1px solid #ccc",
                              }}
                            />
                            <TextField
                              label="Couleur du dégradé"
                              type="color"
                              value={selectedSlide.overlayColor}
                              onChange={(e) =>
                                handleLocalChange(
                                  selectedSlide.id,
                                  "overlayColor",
                                  e.target.value,
                                )
                              }
                              fullWidth
                              sx={{
                                "& input": { height: 40, cursor: "pointer" },
                              }}
                            />
                          </Stack>

                          <TextField
                            label="Ordre d'affichage"
                            type="number"
                            value={selectedSlide.order}
                            onChange={(e) =>
                              handleLocalChange(
                                selectedSlide.id,
                                "order",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            fullWidth
                          />
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                    {/* 3. CTA (Boutons d'action) - NOUVEAU DESIGN */}
                    <Accordion
                      defaultExpanded
                      elevation={0}
                      sx={{
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px !important",
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <LinkIcon color="action" />
                          <Badge
                            badgeContent={selectedSlide.ctas.length}
                            color="primary"
                          >
                            <Typography fontWeight={500} sx={{ mr: 1 }}>
                              Boutons d'action
                            </Typography>
                          </Badge>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails sx={{ bgcolor: "#fafafa" }}>
                        <Stack spacing={2}>
                          {selectedSlide.ctas.map((cta, i) => (
                            <Paper
                              key={i}
                              elevation={1}
                              sx={{ p: 2, borderLeft: "4px solid #1976d2" }}
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
                                    BOUTON #{i + 1}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      handleRemoveCta(selectedSlide.id, i)
                                    }
                                    disabled={selectedSlide.ctas.length <= 1}
                                  >
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                </Grid>
                                <Grid item xs={6}>
                                  <TextField
                                    label="Texte"
                                    value={cta.label}
                                    onChange={(e) =>
                                      handleCtaChange(
                                        selectedSlide.id,
                                        i,
                                        "label",
                                        e.target.value,
                                      )
                                    }
                                    size="small"
                                    fullWidth
                                  />
                                </Grid>
                                <Grid item xs={6}>
                                  <TextField
                                    select
                                    label="Style"
                                    value={cta.color}
                                    onChange={(e) =>
                                      handleCtaChange(
                                        selectedSlide.id,
                                        i,
                                        "color",
                                        e.target.value,
                                      )
                                    }
                                    size="small"
                                    fullWidth
                                  >
                                    {CTA_COLOR_OPTIONS.map((opt) => (
                                      <MenuItem
                                        key={opt.value}
                                        value={opt.value}
                                      >
                                        {opt.label}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField
                                    label="Lien URL"
                                    value={cta.href}
                                    onChange={(e) =>
                                      handleCtaChange(
                                        selectedSlide.id,
                                        i,
                                        "href",
                                        e.target.value,
                                      )
                                    }
                                    size="small"
                                    fullWidth
                                    InputProps={{
                                      startAdornment: (
                                        <LinkIcon
                                          fontSize="small"
                                          sx={{ mr: 1, opacity: 0.5 }}
                                        />
                                      ),
                                    }}
                                  />
                                </Grid>
                              </Grid>
                            </Paper>
                          ))}

                          <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => handleAddCta(selectedSlide.id)}
                            fullWidth
                            sx={{ borderStyle: "dashed" }}
                          >
                            Ajouter un bouton
                          </Button>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                    <Box sx={{ height: 20 }} /> {/* Spacer */}
                    <Button
                      variant="contained"
                      // color="success"
                      size="large"
                      startIcon={
                        savingId === selectedSlide.id ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <SaveIcon />
                        )
                      }
                      onClick={() => handleSaveSlide(selectedSlide.id)}
                      disabled={savingId === selectedSlide.id}
                      fullWidth
                      sx={{ py: 1.5, borderRadius: 2 ,color:"white",  bgcolor:"#616637"}}
                    >
                      Enregistrer le slide
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            ) : (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.5,
                }}
              >
                <ImageIcon sx={{ fontSize: 80, mb: 2 }} />
                <Typography variant="h5">
                  Sélectionnez un slide en haut pour commencer
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Dialog Suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Supprimer le slide ?</DialogTitle>
        <DialogContent>
          <Typography>
            Voulez-vous vraiment supprimer "{slideToDelete?.title}" ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
      >
        <Alert severity={toast?.type || "info"}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
