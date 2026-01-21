"use client";

import React, { useState, useEffect, useCallback } from "react";
import imageCompression from "browser-image-compression";

// Firebase
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Icons (MUI)
import {
  Edit as EditIcon,
  Visibility as PreviewIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  TextFields as TextFieldsIcon,
  VideoLibrary as VideoIcon,
  Photo as PhotoIcon,
  CloudUpload as CloudUploadIcon,
  HourglassEmpty as PendingIcon,
  PlayCircleOutline as PlayIcon,
  Link as LinkIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  AutoAwesome as SparkleIcon,
  Collections as GalleryIcon,
  Movie as MovieIcon,
  YouTube as YouTubeIcon,
} from "@mui/icons-material";

import {
  Box,
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
  MenuItem,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
  Chip,
  Card,
  CardMedia,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  Grow,
  alpha,
  Button,
} from "@mui/material";

// Import du composant preview
import Realisation from "./preview/Realisation";
import { Camera, Video } from "lucide-react";

// --- Types ---
interface VideoItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  client: string;
  date: string; // Changé de year à date
}

interface PhotoItem {
  id: string;
  title: string;
  description: string;
  image: string;
  imagePublicId?: string;
  client: string;
  date: string; // Changé de year à date
}

interface RealisationData {
  videos: VideoItem[];
  photos: PhotoItem[];
}

interface PendingImage {
  file: File;
  previewUrl: string;
  itemId: string;
}

// --- Clients disponibles ---
const CLIENT_OPTIONS = [
  { value: "ARABE", label: "ARABE", color: "#616637" }, // Adapté au nouveau thème
  { value: "LOVIA", label: "LOVIA", color: "#EC4899" },
  { value: "SOSIALY", label: "SOSIALY", color: "#10B981" },
  { value: "TT MARKET PLACE", label: "TT MARKET PLACE", color: "#F59E0B" },
];

// --- Theme Colors ---
// ✅ MODIFICATION : Thème basé sur #616637
const THEME = {
  primary: {
    main: "#616637",
    light: "#8C915D", // Version plus claire calculée
    dark: "#3B3E21", // Version plus foncée calculée
    gradient: "linear-gradient(135deg, #616637 0%, #3B3E21 100%)",
  },
  secondary: {
    main: "#EC4899",
    light: "#F472B6",
    dark: "#DB2777",
    gradient: "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)",
  },
  youtube: {
    main: "#FF0000",
    gradient: "linear-gradient(135deg, #FF0000 0%, #CC0000 100%)",
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

// --- Options de compression ---
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp" as const,
};

// --- Helpers ---
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ✅ Helper pour formater la date en JJ/MM/AAAA pour l'affichage
const formatDateDisplay = (dateString: string) => {
  if (!dateString) return "";
  // Si c'est déjà une année simple (vieux format), on retourne tel quel
  if (dateString.length === 4) return dateString;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR"); // Affiche jour/mois/année
  } catch (e) {
    return dateString;
  }
};

const getClientColor = (client: string): string => {
  const found = CLIENT_OPTIONS.find((c) => c.value === client);
  return found?.color || THEME.neutral[500];
};

// --- Helper: Extraire l'ID YouTube et générer la thumbnail ---
const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const getYouTubeThumbnail = (url: string): string => {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return "";
};

const isValidYouTubeUrl = (url: string): boolean => {
  return getYouTubeVideoId(url) !== null;
};

// --- Valeurs par défaut ---
const DEFAULT_DATA: RealisationData = {
  videos: [
    {
      id: "v1",
      title: "Documentaire Impact Social",
      description:
        "Un documentaire sur les initiatives de développement communautaire.",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      client: "ARABE",
      date: new Date().toISOString().split("T")[0], // Format YYYY-MM-DD
    },
  ],
  photos: [
    {
      id: "p1",
      title: "Reportage Terrain Communautaire",
      description: "Documentation des activités de terrain.",
      image: "/madagascar-field-photography-community-work.jpg",
      imagePublicId: "",
      client: "LOVIA",
      date: new Date().toISOString().split("T")[0], // Format YYYY-MM-DD
    },
  ],
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function RealisationEditor() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // États
  const [data, setData] = useState<RealisationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [editorTab, setEditorTab] = useState<"videos" | "photos">("videos");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  // Pending images uniquement pour les photos
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  const [videoDialog, setVideoDialog] = useState<{
    open: boolean;
    mode: "add" | "edit";
    data: VideoItem | null;
  }>({ open: false, mode: "add", data: null });

  const [photoDialog, setPhotoDialog] = useState<{
    open: boolean;
    mode: "add" | "edit";
    data: PhotoItem | null;
  }>({ open: false, mode: "add", data: null });

  // ============================================
  // FIREBASE SYNC
  // ============================================
  useEffect(() => {
    const docRef = doc(db, "website_content", "realisation_section");

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = snapshot.data();
          const realisationData: RealisationData = {
            videos: Array.isArray(docData.videos)
              ? docData.videos.map((v: any) => ({
                  id: v.id || generateId(),
                  title: v.title || "",
                  description: v.description || "",
                  videoUrl: v.videoUrl || "",
                  client: v.client || "",
                  // Rétrocompatibilité : utilise v.date ou v.year ou la date du jour
                  date:
                    v.date || v.year || new Date().toISOString().split("T")[0],
                }))
              : DEFAULT_DATA.videos,
            photos: Array.isArray(docData.photos)
              ? docData.photos.map((p: any) => ({
                  id: p.id || generateId(),
                  title: p.title || "",
                  description: p.description || "",
                  image: p.image || "",
                  imagePublicId: p.imagePublicId || "",
                  client: p.client || "",
                  // Rétrocompatibilité
                  date:
                    p.date || p.year || new Date().toISOString().split("T")[0],
                }))
              : DEFAULT_DATA.photos,
          };
          setData(realisationData);
        } else {
          setDoc(docRef, DEFAULT_DATA);
          setData(DEFAULT_DATA);
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

  useEffect(() => {
    return () => {
      pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  // ============================================
  // HELPERS
  // ============================================
  const isPendingImage = useCallback(
    (url: string): boolean => pendingImages.some((p) => p.previewUrl === url),
    [pendingImages],
  );

  const pendingCount = pendingImages.length;

  // ============================================
  // SAUVEGARDE AVEC UPLOAD CLOUDINARY
  // ============================================
  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setUploading(pendingImages.length > 0);

    try {
      let finalData = { ...data };
      const uploadErrors: string[] = [];

      // Upload uniquement pour les photos
      for (const pending of pendingImages) {
        try {
          const compressedFile = await imageCompression(
            pending.file,
            COMPRESSION_OPTIONS,
          );

          const formData = new FormData();
          formData.append("file", compressedFile);

          const existingPhoto = data.photos.find(
            (p) => p.id === pending.itemId,
          );
          if (existingPhoto?.imagePublicId) {
            formData.append("publicId", existingPhoto.imagePublicId);
          }

          const res = await fetch(
            "/api/cloudinary/uploadweb/realisationimage",
            {
              method: "POST",
              body: formData,
            },
          );

          const resData = await res.json();

          if (!res.ok) {
            throw new Error(resData.error || "Erreur upload");
          }

          finalData.photos = finalData.photos.map((p) =>
            p.id === pending.itemId
              ? {
                  ...p,
                  image: resData.imageUrl,
                  imagePublicId: resData.imagePublicId,
                }
              : p,
          );

          URL.revokeObjectURL(pending.previewUrl);
        } catch (e: any) {
          console.error("❌ Erreur upload image:", e);
          uploadErrors.push(pending.file.name);
        }
      }

      setPendingImages([]);
      setData(finalData);

      await updateDoc(doc(db, "website_content", "realisation_section"), {
        videos: finalData.videos,
        photos: finalData.photos,
      });

      if (uploadErrors.length > 0) {
        setToast({
          msg: `${uploadErrors.length} image(s) non uploadée(s)`,
          type: "warning",
        });
      } else {
        setToast({ msg: "Sauvegarde réussie !", type: "success" });
      }
    } catch (e: any) {
      console.error("❌ Erreur sauvegarde:", e);
      setToast({ msg: e.message || "Erreur de sauvegarde", type: "error" });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  // ============================================
  // ACTIONS VIDEOS
  // ============================================
  const handleAddVideo = () => {
    setVideoDialog({
      open: true,
      mode: "add",
      data: {
        id: generateId(),
        title: "",
        description: "",
        videoUrl: "",
        client: "",
        date: new Date().toISOString().split("T")[0],
      },
    });
  };

  const handleEditVideo = (video: VideoItem) => {
    setVideoDialog({ open: true, mode: "edit", data: { ...video } });
  };

  const handleSaveVideoDialog = () => {
    if (!data || !videoDialog.data) return;

    if (videoDialog.mode === "add") {
      setData({ ...data, videos: [...data.videos, videoDialog.data] });
    } else {
      setData({
        ...data,
        videos: data.videos.map((v) =>
          v.id === videoDialog.data!.id ? videoDialog.data! : v,
        ),
      });
    }
    setVideoDialog({ open: false, mode: "add", data: null });
    setToast({ msg: "N'oubliez pas d'enregistrer", type: "info" });
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!data) return;

    setDeletingItem(videoId);
    try {
      setData({ ...data, videos: data.videos.filter((v) => v.id !== videoId) });
      setToast({ msg: "Vidéo supprimée", type: "success" });
    } catch (e) {
      setToast({ msg: "Erreur suppression", type: "error" });
    } finally {
      setDeletingItem(null);
    }
  };

  // ============================================
  // ACTIONS PHOTOS
  // ============================================
  const handleAddPhoto = () => {
    setPhotoDialog({
      open: true,
      mode: "add",
      data: {
        id: generateId(),
        title: "",
        description: "",
        image: "",
        imagePublicId: "",
        client: "",
        date: new Date().toISOString().split("T")[0],
      },
    });
  };

  const handleEditPhoto = (photo: PhotoItem) => {
    setPhotoDialog({ open: true, mode: "edit", data: { ...photo } });
  };

  const handleSavePhotoDialog = () => {
    if (!data || !photoDialog.data) return;

    if (photoDialog.mode === "add") {
      setData({ ...data, photos: [...data.photos, photoDialog.data] });
    } else {
      setData({
        ...data,
        photos: data.photos.map((p) =>
          p.id === photoDialog.data!.id ? photoDialog.data! : p,
        ),
      });
    }
    setPhotoDialog({ open: false, mode: "add", data: null });
    setToast({ msg: "N'oubliez pas d'enregistrer", type: "info" });
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!data) return;
    const photo = data.photos.find((p) => p.id === photoId);
    if (!photo) return;

    setDeletingItem(photoId);
    try {
      if (photo.imagePublicId && !isPendingImage(photo.image)) {
        try {
          await fetch("/api/cloudinary/deleteweb", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicId: photo.imagePublicId }),
          });
        } catch (e) {
          console.warn("⚠️ Erreur suppression Cloudinary:", e);
        }
      }

      const pendingToRemove = pendingImages.filter((p) => p.itemId === photoId);
      pendingToRemove.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPendingImages((prev) => prev.filter((p) => p.itemId !== photoId));

      setData({ ...data, photos: data.photos.filter((p) => p.id !== photoId) });
      setToast({ msg: "Photo supprimée", type: "success" });
    } catch (e) {
      console.error("❌ Erreur suppression:", e);
      setToast({ msg: "Erreur suppression", type: "error" });
    } finally {
      setDeletingItem(null);
    }
  };

  const handlePhotoImageSelect = (file: File) => {
    if (!photoDialog.data) return;

    const previewUrl = URL.createObjectURL(file);

    setPendingImages((prev) => [
      ...prev.filter((p) => p.itemId !== photoDialog.data!.id),
      { file, previewUrl, itemId: photoDialog.data!.id },
    ]);

    setPhotoDialog({
      ...photoDialog,
      data: { ...photoDialog.data!, image: previewUrl },
    });
  };

  const handleCancelPendingImages = () => {
    pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPendingImages([]);
    setToast({ msg: "Images annulées", type: "info" });
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
        <Stack alignItems="center" spacing={3}>
          <Box sx={{ position: "relative", width: 80, height: 80 }}>
            <CircularProgress
              size={80}
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
              <SparkleIcon sx={{ fontSize: 32, color: THEME.primary.main }} />
            </Box>
          </Box>
          <Typography
            variant="h6"
            sx={{
              background: THEME.primary.gradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 600,
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
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${THEME.neutral[50]} 0%, ${THEME.neutral[100]} 100%)`,
      }}
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.3)"
      borderRadius={3}
      overflow={"hidden"}
      // border={"red solid 2px"}
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
        <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, md: 4 } }}>
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
                "&.Mui-selected": { color: "white"},
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
                  badgeContent={pendingCount}
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
      </Paper>

      {/* ========== VUE APERÇU ========== */}
      {tabValue === 0 && (
        <Fade in timeout={500}>
          <Box component="section">
            <Realisation />
          </Box>
        </Fade>
      )}

      {/* ========== VUE ÉDITEUR ========== */}
      {tabValue === 1 && (
        <Fade in timeout={500}>
          <Box sx={{ maxWidth: 1600, mx: "auto", p: { xs: 2, md: 4 } }}>
            {/* TOP BAR */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 3 },
                mb: 4,
                borderRadius: 3,
                background: "white",
                border: `1px solid ${THEME.neutral[200]}`,
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "stretch", md: "center" },
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              {/* Tabs Vidéos/Photos */}
              <Box
                sx={{
                  display: "flex",
                  p: 0.5,
                  borderRadius: 2,
                  bgcolor: THEME.neutral[100],
                }}
                width={"40%"}
              >
                <Button
                  size="small"
                  onClick={() => setEditorTab("videos")}
                  startIcon={<YouTubeIcon />}
                  sx={{
                    flex: 1,
                    mr: 4,
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                    color: editorTab === "videos" ? "white" : "#616637",
                    background:
                      editorTab === "videos" ? "#616637" : "transparent",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    "&:hover": {
                      background:
                        editorTab === "videos" ? "#b69e86" : "#D9CBC0",
                    },
                  }}
                >
                  Vidéos ({data.videos.length})
                </Button>
                <Button
                  onClick={() => setEditorTab("photos")}
                  size="small"
                  startIcon={<GalleryIcon />}
                  sx={{
                    flex: 1,
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                    color: editorTab === "photos" ? "white" : "#616637",
                    background:
                      editorTab === "photos" ? "#616637" : "transparent",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    "&:hover": {
                      background:
                        editorTab === "photos" ? "#b69e86" : "#D9CBC0",
                    },
                  }}
                >
                  Photos ({data.photos.length})
                </Button>
              </Box>

              {/* Actions */}
              <Stack direction="row" spacing={2} alignItems="center">
                {pendingCount > 0 && (
                  <Chip
                    icon={<PendingIcon sx={{ fontSize: 16 }} />}
                    label={`${pendingCount} photo(s) en attente`}
                    onDelete={handleCancelPendingImages}
                    sx={{
                      bgcolor: alpha(THEME.accent.orange, 0.1),
                      color: THEME.accent.orange,
                      fontWeight: 600,
                      "& .MuiChip-deleteIcon": {
                        color: THEME.accent.orange,
                        "&:hover": { color: THEME.accent.orange },
                      },
                    }}
                  />
                )}
                <Button
                  variant="contained"
                  startIcon={
                    saving ? (
                      <CircularProgress size={18} sx={{ color: "white" }} />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  onClick={handleSave}
                  disabled={saving}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    background:
                      pendingCount > 0
                        ? `linear-gradient(135deg, ${THEME.accent.orange} 0%, #EA580C 100%)`
                        : THEME.primary.gradient,
                    boxShadow:
                      pendingCount > 0
                        ? "0 4px 14px rgba(245, 158, 11, 0.4)"
                        : "0 4px 14px rgba(99, 102, 241, 0.4)",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow:
                        pendingCount > 0
                          ? "0 6px 20px rgba(245, 158, 11, 0.5)"
                          : "0 6px 20px rgba(99, 102, 241, 0.5)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {saving
                    ? "Sauvegarde..."
                    : pendingCount > 0
                      ? `Enregistrer (${pendingCount})`
                      : "Enregistrer"}
                </Button>
              </Stack>
            </Paper>

            {/* ========== SECTION VIDEOS ========== */}
            {editorTab === "videos" && (
              <Box>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", sm: "center" }}
                  spacing={2}
                  mb={4}
                >
                  <Box>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      mb={0.5}
                    >
                      <div className="mb-8 flex items-center gap-3">
                        <Video className="h-6 w-6 text-tertiary" />
                        <h2 className="font-heading text-2xl font-bold text-foreground">
                          Vidéos
                        </h2>
                      </div>
                    </Stack>
                    <Typography variant="body2" color={THEME.neutral[500]}>
                      Ajoutez vos vidéos via leur lien YouTube
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddVideo}
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      background: "#616637",
                      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        background: "#b69e86",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    Nouvelle vidéo
                  </Button>
                </Stack>

                <Grid container spacing={3}>
                  {data.videos.map((video, index) => {
                    const thumbnail = getYouTubeThumbnail(video.videoUrl);
                    const isValidUrl = isValidYouTubeUrl(video.videoUrl);

                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={video.id}>
                        <Grow in timeout={300 + index * 100}>
                          <Card
                            sx={{
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              borderRadius: 3,
                              overflow: "hidden",
                              border: `1px solid ${THEME.neutral[200]}`,
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "translateY(-8px)",
                                boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                              },
                            }}
                          >
                            {/* Thumbnail from YouTube */}
                            <Box sx={{ position: "relative" }}>
                              <CardMedia
                                sx={{
                                  height: 180,
                                  bgcolor: THEME.neutral[900],
                                  position: "relative",
                                }}
                              >
                                {thumbnail ? (
                                  <Box
                                    component="img"
                                    src={thumbnail}
                                    alt={video.title}
                                    sx={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                    onError={(e: any) => {
                                      e.target.src = `https://img.youtube.com/vi/${getYouTubeVideoId(
                                        video.videoUrl,
                                      )}/hqdefault.jpg`;
                                    }}
                                  />
                                ) : (
                                  <Box
                                    sx={{
                                      height: "100%",
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <YouTubeIcon
                                      sx={{
                                        fontSize: 60,
                                        color: THEME.neutral[600],
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      sx={{ color: THEME.neutral[500] }}
                                    >
                                      Ajoutez un lien YouTube
                                    </Typography>
                                  </Box>
                                )}

                                {/* Play Button Overlay */}
                                {isValidUrl && (
                                  <Box
                                    sx={{
                                      position: "absolute",
                                      inset: 0,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      background:
                                        "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: 2,
                                        bgcolor: "#616637",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow:
                                          "0 4px 20px rgba(158, 134, 134, 0.4)",
                                        transition: "transform 0.3s ease",
                                        "&:hover": { transform: "scale(1.1)" },
                                      }}
                                    >
                                      <PlayIcon
                                        sx={{
                                          fontSize: 36,
                                          color: "white",
                                          ml: 0.5,
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                )}

                                {/* YouTube Badge */}

                                <YouTubeIcon
                                  sx={{
                                    position: "absolute",
                                    top: 12,
                                    right: 12,
                                    bgcolor: "#ffffff31",
                                    borderRadius: "50%",
                                    width: 30,
                                    height: 30,
                                    boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                  }}
                                />
                              </CardMedia>
                            </Box>

                            <CardContent sx={{ flex: 1, p: 2.5 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 700,
                                  color: THEME.neutral[800],
                                  mb: 1,
                                }}
                                noWrap
                              >
                                {video.title || "Sans titre"}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: THEME.neutral[500],
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  lineHeight: 1.5,
                                  mb: 2,
                                  minHeight: 42,
                                }}
                              >
                                {video.description || "Pas de description"}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                flexWrap="wrap"
                                gap={1}
                              >
                                {video.client && (
                                  <Chip
                                    size="small"
                                    label={video.client}
                                    sx={{
                                      bgcolor: alpha(
                                        getClientColor(video.client),
                                        0.1,
                                      ),
                                      color: getClientColor(video.client),
                                      fontWeight: 600,
                                      fontSize: "0.75rem",
                                    }}
                                  />
                                )}
                                {/* ✅ AFFICHAGE FORMATÉ DE LA DATE */}
                                <Chip
                                  size="small"
                                  label={formatDateDisplay(video.date)}
                                  variant="outlined"
                                  sx={{
                                    borderColor: THEME.neutral[300],
                                    color: THEME.neutral[600],
                                    fontSize: "0.75rem",
                                  }}
                                />
                              </Stack>
                            </CardContent>

                            <Divider />

                            <Stack
                              direction="row"
                              justifyContent="flex-end"
                              spacing={1}
                              sx={{ p: 1.5, bgcolor: THEME.neutral[50] }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleEditVideo(video)}
                                sx={{
                                  color: THEME.primary.main,
                                  bgcolor: alpha(THEME.primary.main, 0.1),
                                  "&:hover": {
                                    bgcolor: alpha(THEME.primary.main, 0.2),
                                  },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteVideo(video.id)}
                                disabled={deletingItem === video.id}
                                sx={{
                                  color: "#EF4444",
                                  bgcolor: alpha("#EF4444", 0.1),
                                  "&:hover": { bgcolor: alpha("#EF4444", 0.2) },
                                }}
                              >
                                {deletingItem === video.id ? (
                                  <CircularProgress
                                    size={16}
                                    sx={{ color: "#EF4444" }}
                                  />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Stack>
                          </Card>
                        </Grow>
                      </Grid>
                    );
                  })}

                  {data.videos.length === 0 && (
                    <Grid item xs={12}>
                      <Paper
                        sx={{
                          p: 6,
                          textAlign: "center",
                          borderRadius: 3,
                          bgcolor: "white",
                          border: `2px dashed ${THEME.neutral[300]}`,
                        }}
                      >
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: 2,
                            bgcolor: alpha(THEME.youtube.main, 0.1),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mx: "auto",
                            mb: 3,
                          }}
                        >
                          <YouTubeIcon
                            sx={{ fontSize: 40, color: THEME.youtube.main }}
                          />
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{ color: THEME.neutral[700], mb: 1 }}
                        >
                          Aucune vidéo
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: THEME.neutral[500], mb: 3 }}
                        >
                          Ajoutez votre première vidéo YouTube
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleAddVideo}
                          sx={{
                            background: THEME.youtube.gradient,
                            textTransform: "none",
                            fontWeight: 600,
                            px: 4,
                            py: 1.5,
                            borderRadius: 2,
                          }}
                        >
                          Ajouter une vidéo
                        </Button>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}

            {/* ========== SECTION PHOTOS ========== */}
            {editorTab === "photos" && (
              <Box>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", sm: "center" }}
                  spacing={2}
                  mb={4}
                >
                  <Box>
                    <div className=" flex items-center gap-3">
                      <Camera className="h-6 w-6 text-accent-warm" />
                      <h2 className="font-heading text-2xl font-bold text-foreground">
                        Photos
                      </h2>
                    </div>
                    <Typography variant="body2" color={THEME.neutral[500]}>
                      Gérez votre galerie photo
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddPhoto}
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      background: "#616637",
                      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        background: "#b69e86",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    Nouvelle photo
                  </Button>
                </Stack>

                <Grid container spacing={3}>
                  {data.photos.map((photo, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={photo.id}>
                      <Grow in timeout={300 + index * 100}>
                        <Card
                          sx={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            borderRadius: 3,
                            overflow: "hidden",
                            border: isPendingImage(photo.image)
                              ? `2px dashed ${THEME.accent.orange}`
                              : `1px solid ${THEME.neutral[200]}`,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              transform: "translateY(-8px)",
                              boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                              "& .photo-overlay": { opacity: 1 },
                            },
                          }}
                        >
                          <Box sx={{ position: "relative" }}>
                            {isPendingImage(photo.image) && (
                              <Chip
                                icon={<PendingIcon sx={{ fontSize: 14 }} />}
                                label="En attente"
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 12,
                                  left: 12,
                                  zIndex: 5,
                                  bgcolor: THEME.accent.orange,
                                  color: "white",
                                  fontWeight: 600,
                                }}
                              />
                            )}
                            <CardMedia
                              sx={{
                                height: 220,
                                bgcolor: THEME.neutral[100],
                                position: "relative",
                              }}
                            >
                              {photo.image ? (
                                <>
                                  <Box
                                    component="img"
                                    src={photo.image}
                                    alt={photo.title}
                                    sx={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                  <Box
                                    className="photo-overlay"
                                    sx={{
                                      position: "absolute",
                                      inset: 0,
                                      background:
                                        "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
                                      opacity: 0,
                                      transition: "opacity 0.3s ease",
                                    }}
                                  />
                                </>
                              ) : (
                                <Box
                                  sx={{
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <PhotoIcon
                                    sx={{
                                      fontSize: 60,
                                      color: THEME.neutral[300],
                                    }}
                                  />
                                </Box>
                              )}
                            </CardMedia>
                          </Box>

                          <CardContent sx={{ flex: 1, p: 2.5 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 700,
                                color: THEME.neutral[800],
                                mb: 1,
                              }}
                              noWrap
                            >
                              {photo.title || "Sans titre"}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: THEME.neutral[500],
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                lineHeight: 1.5,
                                mb: 2,
                                minHeight: 42,
                              }}
                            >
                              {photo.description || "Pas de description"}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              {photo.client && (
                                <Chip
                                  size="small"
                                  label={photo.client}
                                  sx={{
                                    bgcolor: alpha(
                                      getClientColor(photo.client),
                                      0.1,
                                    ),
                                    color: getClientColor(photo.client),
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                  }}
                                />
                              )}
                              {/* ✅ AFFICHAGE FORMATÉ DE LA DATE */}
                              <Chip
                                size="small"
                                label={formatDateDisplay(photo.date)}
                                variant="outlined"
                                sx={{
                                  borderColor: THEME.neutral[300],
                                  color: THEME.neutral[600],
                                  fontSize: "0.75rem",
                                }}
                              />
                            </Stack>
                          </CardContent>

                          <Divider />

                          <Stack
                            direction="row"
                            justifyContent="flex-end"
                            spacing={1}
                            sx={{ p: 1.5, bgcolor: THEME.neutral[50] }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => handleEditPhoto(photo)}
                              sx={{
                                color: THEME.secondary.main,
                                bgcolor: alpha(THEME.secondary.main, 0.1),
                                "&:hover": {
                                  bgcolor: alpha(THEME.secondary.main, 0.2),
                                },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeletePhoto(photo.id)}
                              disabled={deletingItem === photo.id}
                              sx={{
                                color: "#EF4444",
                                bgcolor: alpha("#EF4444", 0.1),
                                "&:hover": { bgcolor: alpha("#EF4444", 0.2) },
                              }}
                            >
                              {deletingItem === photo.id ? (
                                <CircularProgress
                                  size={16}
                                  sx={{ color: "#EF4444" }}
                                />
                              ) : (
                                <DeleteIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Stack>
                        </Card>
                      </Grow>
                    </Grid>
                  ))}

                  {data.photos.length === 0 && (
                    <Grid item xs={12}>
                      <Paper
                        sx={{
                          p: 6,
                          textAlign: "center",
                          borderRadius: 3,
                          bgcolor: "white",
                          border: `2px dashed ${THEME.neutral[300]}`,
                        }}
                      >
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            bgcolor: alpha(THEME.secondary.main, 0.1),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mx: "auto",
                            mb: 3,
                          }}
                        >
                          <PhotoIcon
                            sx={{ fontSize: 40, color: THEME.secondary.main }}
                          />
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{ color: THEME.neutral[700], mb: 1 }}
                        >
                          Aucune photo
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: THEME.neutral[500], mb: 3 }}
                        >
                          Commencez par ajouter votre première photo
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleAddPhoto}
                          sx={{
                            background: THEME.secondary.gradient,
                            textTransform: "none",
                            fontWeight: 600,
                            px: 4,
                            py: 1.5,
                            borderRadius: 2,
                          }}
                        >
                          Ajouter une photo
                        </Button>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </Box>
        </Fade>
      )}

      {/* ========== DIALOG VIDÉO ========== */}
      <Dialog
        open={videoDialog.open}
        onClose={() => setVideoDialog({ open: false, mode: "add", data: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <DialogTitle
          sx={{
            background: THEME.youtube.gradient,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <YouTubeIcon />
            <Typography variant="h6" fontWeight={600}>
              {videoDialog.mode === "add"
                ? "Nouvelle vidéo YouTube"
                : "Modifier la vidéo"}
            </Typography>
          </Stack>
          <IconButton
            onClick={() =>
              setVideoDialog({ open: false, mode: "add", data: null })
            }
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {videoDialog.data && (
            <Stack spacing={3}>
              {/* Preview YouTube Thumbnail */}
              {isValidYouTubeUrl(videoDialog.data.videoUrl) && (
                <Box
                  sx={{
                    width: "100%",
                    aspectRatio: "16/9",
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: THEME.neutral[900],
                    position: "relative",
                  }}
                >
                  <Box
                    component="img"
                    src={getYouTubeThumbnail(videoDialog.data.videoUrl)}
                    alt="Aperçu YouTube"
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e: any) => {
                      const videoId = getYouTubeVideoId(
                        videoDialog.data!.videoUrl,
                      );
                      if (videoId) {
                        e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                      }
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0,0,0,0.3)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 64,
                        height: 44,
                        borderRadius: 1.5,
                        bgcolor: THEME.youtube.main,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PlayIcon sx={{ fontSize: 32, color: "white" }} />
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Lien YouTube */}
              <TextField
                label="Lien YouTube"
                fullWidth
                value={videoDialog.data.videoUrl}
                onChange={(e) =>
                  setVideoDialog({
                    ...videoDialog,
                    data: { ...videoDialog.data!, videoUrl: e.target.value },
                  })
                }
                placeholder="https://www.youtube.com/watch?v=..."
                helperText={
                  videoDialog.data.videoUrl &&
                  !isValidYouTubeUrl(videoDialog.data.videoUrl)
                    ? "⚠️ Lien YouTube invalide"
                    : "Collez le lien de votre vidéo YouTube"
                }
                error={
                  videoDialog.data.videoUrl !== "" &&
                  !isValidYouTubeUrl(videoDialog.data.videoUrl)
                }
                InputProps={{
                  startAdornment: (
                    <YouTubeIcon sx={{ mr: 1, color: THEME.youtube.main }} />
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
              />

              <TextField
                label="Titre"
                fullWidth
                value={videoDialog.data.title}
                onChange={(e) =>
                  setVideoDialog({
                    ...videoDialog,
                    data: { ...videoDialog.data!, title: e.target.value },
                  })
                }
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />

              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={videoDialog.data.description}
                onChange={(e) =>
                  setVideoDialog({
                    ...videoDialog,
                    data: { ...videoDialog.data!, description: e.target.value },
                  })
                }
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    select
                    label="Client"
                    fullWidth
                    value={videoDialog.data.client}
                    onChange={(e) =>
                      setVideoDialog({
                        ...videoDialog,
                        data: { ...videoDialog.data!, client: e.target.value },
                      })
                    }
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  >
                    {CLIENT_OPTIONS.map((client) => (
                      <MenuItem key={client.value} value={client.value}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              bgcolor: client.color,
                            }}
                          />
                          <span>{client.label}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  {/* ✅ CHAMP DATE POUR VIDEO */}
                  <TextField
                    label="Date de réalisation"
                    type="date"
                    fullWidth
                    value={videoDialog.data.date}
                    onChange={(e) =>
                      setVideoDialog({
                        ...videoDialog,
                        data: { ...videoDialog.data!, date: e.target.value },
                      })
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      startAdornment: (
                        <CalendarIcon
                          sx={{ mr: 1, color: THEME.neutral[400] }}
                        />
                      ),
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions
          sx={{ p: 3, borderTop: `1px solid ${THEME.neutral[200]}` }}
        >
          <Button
            onClick={() =>
              setVideoDialog({ open: false, mode: "add", data: null })
            }
            sx={{ textTransform: "none", color: THEME.neutral[600], px: 3 }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveVideoDialog}
            disabled={
              !videoDialog.data?.title ||
              !isValidYouTubeUrl(videoDialog.data?.videoUrl || "")
            }
            sx={{
              background: THEME.youtube.gradient,
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              borderRadius: 2,
            }}
          >
            {videoDialog.mode === "add" ? "Ajouter" : "Enregistrer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== DIALOG PHOTO ========== */}
      <Dialog
        open={photoDialog.open}
        onClose={() => setPhotoDialog({ open: false, mode: "add", data: null })}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <DialogTitle
          sx={{
            background: THEME.secondary.gradient,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <GalleryIcon />
            <Typography variant="h6" fontWeight={600}>
              {photoDialog.mode === "add"
                ? "Nouvelle photo"
                : "Modifier la photo"}
            </Typography>
          </Stack>
          <IconButton
            onClick={() =>
              setPhotoDialog({ open: false, mode: "add", data: null })
            }
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {photoDialog.data && (
            <Grid container spacing={4}>
              {/* Image Upload */}
              <Grid item xs={12} md={5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Image
                </Typography>
                <Box
                  sx={{
                    width: "100%",
                    aspectRatio: "4/3",
                    bgcolor: THEME.neutral[100],
                    borderRadius: 3,
                    overflow: "hidden",
                    position: "relative",
                    border: isPendingImage(photoDialog.data.image)
                      ? `2px dashed ${THEME.accent.orange}`
                      : `2px dashed ${THEME.neutral[300]}`,
                    transition: "all 0.3s ease",
                    "&:hover": { borderColor: THEME.secondary.main },
                  }}
                >
                  {photoDialog.data.image ? (
                    <>
                      <Box
                        component="img"
                        src={photoDialog.data.image}
                        alt="Photo"
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      {isPendingImage(photoDialog.data.image) && (
                        <Chip
                          icon={<PendingIcon sx={{ fontSize: 14 }} />}
                          label="En attente"
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            bgcolor: THEME.accent.orange,
                            color: "white",
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      sx={{ height: "100%", gap: 1 }}
                    >
                      <CloudUploadIcon
                        sx={{ fontSize: 48, color: THEME.neutral[400] }}
                      />
                      <Typography variant="body2" color={THEME.neutral[500]}>
                        Glissez une image ici
                      </Typography>
                    </Stack>
                  )}
                </Box>
                <Button
                  component="label"
                  variant="outlined"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: THEME.secondary.main,
                    color: THEME.secondary.main,
                    "&:hover": {
                      bgcolor: alpha(THEME.secondary.main, 0.1),
                      borderColor: THEME.secondary.main,
                    },
                  }}
                >
                  Choisir une image
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      handlePhotoImageSelect(e.target.files[0])
                    }
                  />
                </Button>
              </Grid>

              {/* Form */}
              <Grid item xs={12} md={7}>
                <Stack spacing={3}>
                  <TextField
                    label="Titre"
                    fullWidth
                    value={photoDialog.data.title}
                    onChange={(e) =>
                      setPhotoDialog({
                        ...photoDialog,
                        data: { ...photoDialog.data!, title: e.target.value },
                      })
                    }
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />

                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    value={photoDialog.data.description}
                    onChange={(e) =>
                      setPhotoDialog({
                        ...photoDialog,
                        data: {
                          ...photoDialog.data!,
                          description: e.target.value,
                        },
                      })
                    }
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        select
                        label="Client"
                        fullWidth
                        value={photoDialog.data.client}
                        onChange={(e) =>
                          setPhotoDialog({
                            ...photoDialog,
                            data: {
                              ...photoDialog.data!,
                              client: e.target.value,
                            },
                          })
                        }
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      >
                        {CLIENT_OPTIONS.map((client) => (
                          <MenuItem key={client.value} value={client.value}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: "50%",
                                  bgcolor: client.color,
                                }}
                              />
                              <span>{client.label}</span>
                            </Stack>
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={6}>
                      {/* ✅ CHAMP DATE POUR PHOTO */}
                      <TextField
                        label="Date de réalisation"
                        type="date"
                        fullWidth
                        value={photoDialog.data.date}
                        onChange={(e) =>
                          setPhotoDialog({
                            ...photoDialog,
                            data: {
                              ...photoDialog.data!,
                              date: e.target.value,
                            },
                          })
                        }
                        InputLabelProps={{
                          shrink: true,
                        }}
                        InputProps={{
                          startAdornment: (
                            <CalendarIcon
                              sx={{ mr: 1, color: THEME.neutral[400] }}
                            />
                          ),
                        }}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions
          sx={{ p: 3, borderTop: `1px solid ${THEME.neutral[200]}` }}
        >
          <Button
            onClick={() =>
              setPhotoDialog({ open: false, mode: "add", data: null })
            }
            sx={{ textTransform: "none", color: THEME.neutral[600], px: 3 }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSavePhotoDialog}
            disabled={!photoDialog.data?.title}
            sx={{
              background: THEME.secondary.gradient,
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              borderRadius: 2,
            }}
          >
            {photoDialog.mode === "add" ? "Ajouter" : "Enregistrer"}
          </Button>
        </DialogActions>
      </Dialog>

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
            borderRadius: 2,
            fontWeight: 600,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
