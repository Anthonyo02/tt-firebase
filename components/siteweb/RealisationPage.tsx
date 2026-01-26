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
  Warning as WarningIcon,
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
import EditServiceBannerModal from "../HeroImageEditor";
import EditBannier from "../HeroImageEditor";

// --- Types ---
interface VideoItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  client: string;
  date: string;
}

interface PhotoItem {
  id: string;
  title: string;
  description: string;
  image: string;
  imagePublicId?: string;
  client: string;
  date: string;
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

// ✅ Type pour l'image temporaire dans le dialog
interface TempDialogImage {
  file: File;
  previewUrl: string;
}

// --- Clients disponibles ---
const CLIENT_OPTIONS = [
  { value: "arabe", label: "ARABE", color: "#616637" },
  { value: "lovia", label: "LOVIA", color: "#EC4899" },
  { value: "sosialy", label: "SOSIALY", color: "#10B981" },
  { value: "market", label: "TT MARKET PLACE", color: "#F59E0B" },
  { value: "autre", label: "AUTRE", color: "#7f7f7f" },
];

// --- Theme Colors ---
const THEME = {
  primary: {
    main: "#616637",
    light: "#8C915D",
    dark: "#3B3E21",
    gradient: "linear-gradient(135deg, #616637 0%, #3B3E21 100%)",
  },
  secondary: {
    main: "#616637",
    light: "#8C915D",
    dark: "#3B3E21",
    gradient: "linear-gradient(135deg, #616637 0%, #8C915D 100%)",
  },
  youtube: {
    main: "#616637",
    gradient: "linear-gradient(135deg, #3B3E21 0%, #8C915D 100%)",
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

const formatDateDisplay = (dateString: string) => {
  if (!dateString) return "";
  if (dateString.length === 4) return dateString;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR");
  } catch (e) {
    return dateString;
  }
};

const getClientColor = (client: string): string => {
  const found = CLIENT_OPTIONS.find((c) => c.value === client);
  return found?.color || THEME.neutral[500];
};

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
      date: new Date().toISOString().split("T")[0],
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
      date: new Date().toISOString().split("T")[0],
    },
  ],
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function RealisationEditor() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  // États
  const [data, setData] = useState<RealisationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [editorTab, setEditorTab] = useState<"videos" | "photos">("videos");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  // ✅ Pending images pour les NOUVELLES photos uniquement
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  // ✅ IDs des nouvelles vidéos en attente (ADD uniquement)
  const [pendingNewVideoIds, setPendingNewVideoIds] = useState<Set<string>>(
    new Set(),
  );

  // ✅ IDs des nouvelles photos en attente (ADD uniquement, sans image)
  const [pendingNewPhotoIds, setPendingNewPhotoIds] = useState<Set<string>>(
    new Set(),
  );

  // ✅ Image temporaire dans le dialog photo (pas encore confirmée)
  const [tempDialogImage, setTempDialogImage] =
    useState<TempDialogImage | null>(null);

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

  // Cleanup des URLs au démontage
  useEffect(() => {
    return () => {
      pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      if (tempDialogImage) {
        URL.revokeObjectURL(tempDialogImage.previewUrl);
      }
    };
  }, []);

  // ============================================
  // HELPERS
  // ============================================
  const isPendingImage = useCallback(
    (url: string): boolean => pendingImages.some((p) => p.previewUrl === url),
    [pendingImages],
  );

  // ✅ Vérifier si une vidéo est en attente (nouvelle uniquement)
  const isPendingVideo = useCallback(
    (videoId: string): boolean => pendingNewVideoIds.has(videoId),
    [pendingNewVideoIds],
  );

  // ✅ Vérifier si une photo est en attente (nouvelle uniquement)
  const isPendingPhoto = useCallback(
    (photoId: string): boolean => {
      return (
        pendingNewPhotoIds.has(photoId) ||
        pendingImages.some((p) => p.itemId === photoId)
      );
    },
    [pendingNewPhotoIds, pendingImages],
  );

  // ✅ Compteurs
  const totalPendingPhotos = new Set([
    ...pendingImages.map((p) => p.itemId),
    ...Array.from(pendingNewPhotoIds),
  ]).size;

  const totalPendingVideos = pendingNewVideoIds.size;

  // ✅ Générer le label du Chip
  const getPendingLabel = (): string => {
    const parts: string[] = [];

    if (totalPendingVideos > 0) {
      parts.push(
        `${totalPendingVideos} vidéo${totalPendingVideos > 1 ? "s" : ""}`,
      );
    }

    if (totalPendingPhotos > 0) {
      parts.push(
        `${totalPendingPhotos} photo${totalPendingPhotos > 1 ? "s" : ""}`,
      );
    }

    if (parts.length === 0) return "";

    return `${parts.join(" et ")} en attente`;
  };

  // ✅ Vérifie s'il y a des modifications à sauvegarder
  const hasChangesToSave = totalPendingVideos > 0 || totalPendingPhotos > 0;
  const totalPendingCount = totalPendingVideos + totalPendingPhotos;

  // ============================================
  // SAUVEGARDE DES NOUVEAUX ÉLÉMENTS UNIQUEMENT
  // ============================================
  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setUploading(pendingImages.length > 0);

    try {
      let finalData = { ...data };
      const uploadErrors: string[] = [];

      // Upload des images pour les nouvelles photos
      for (const pending of pendingImages) {
        try {
          const compressedFile = await imageCompression(
            pending.file,
            COMPRESSION_OPTIONS,
          );

          const formData = new FormData();
          formData.append("file", compressedFile);

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

      // ✅ Réinitialiser tous les pending
      setPendingImages([]);
      setPendingNewVideoIds(new Set());
      setPendingNewPhotoIds(new Set());

      setData(finalData);

      // ✅ Sauvegarde Firebase
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

  // ✅ Fermer le dialog vidéo
  const handleCloseVideoDialog = () => {
    setVideoDialog({ open: false, mode: "add", data: null });
  };

  // ✅ ADD = en attente, EDIT = direct Firebase
  const handleSaveVideoDialog = async () => {
    if (!data || !videoDialog.data) return;

    const videoId = videoDialog.data.id;

    if (videoDialog.mode === "add") {
      // ✅ ADD : Ajouter localement et mettre en attente
      setData({ ...data, videos: [...data.videos, videoDialog.data] });
      setPendingNewVideoIds((prev) => new Set([...prev, videoId]));
      setToast({
        msg: "Vidéo ajoutée - N'oubliez pas d'enregistrer",
        type: "info",
      });
    } else {
      // ✅ EDIT : Envoyer directement à Firebase
      setUpdatingItem(videoId);
      try {
        const updatedVideos = data.videos.map((v) =>
          v.id === videoId ? videoDialog.data! : v,
        );

        await updateDoc(doc(db, "website_content", "realisation_section"), {
          videos: updatedVideos,
        });

        setData({ ...data, videos: updatedVideos });
        setToast({ msg: "Vidéo mise à jour !", type: "success" });
      } catch (e: any) {
        console.error("❌ Erreur mise à jour vidéo:", e);
        setToast({ msg: "Erreur de mise à jour", type: "error" });
      } finally {
        setUpdatingItem(null);
      }
    }

    handleCloseVideoDialog();
  };

  // ✅ DELETE : Direct Firebase
  const handleDeleteVideo = async (videoId: string) => {
    if (!data) return;

    // Si c'est une vidéo en attente (non encore sauvegardée), juste la retirer localement
    if (pendingNewVideoIds.has(videoId)) {
      setPendingNewVideoIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
      setData({ ...data, videos: data.videos.filter((v) => v.id !== videoId) });
      setToast({ msg: "Vidéo retirée", type: "success" });
      return;
    }

    // Sinon, supprimer directement de Firebase
    setDeletingItem(videoId);
    try {
      const updatedVideos = data.videos.filter((v) => v.id !== videoId);

      await updateDoc(doc(db, "website_content", "realisation_section"), {
        videos: updatedVideos,
      });

      setData({ ...data, videos: updatedVideos });
      setToast({ msg: "Vidéo supprimée !", type: "success" });
    } catch (e: any) {
      console.error("❌ Erreur suppression vidéo:", e);
      setToast({ msg: "Erreur de suppression", type: "error" });
    } finally {
      setDeletingItem(null);
    }
  };

  // ============================================
  // ACTIONS PHOTOS
  // ============================================
  const handleAddPhoto = () => {
    // Nettoyer l'image temporaire précédente si elle existe
    if (tempDialogImage) {
      URL.revokeObjectURL(tempDialogImage.previewUrl);
      setTempDialogImage(null);
    }

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
    // Nettoyer l'image temporaire précédente si elle existe
    if (tempDialogImage) {
      URL.revokeObjectURL(tempDialogImage.previewUrl);
      setTempDialogImage(null);
    }

    setPhotoDialog({ open: true, mode: "edit", data: { ...photo } });
  };

  // ✅ Fermer le dialog photo et nettoyer l'image temporaire
  const handleClosePhotoDialog = () => {
    // ✅ Nettoyer l'image temporaire (non confirmée)
    if (tempDialogImage) {
      URL.revokeObjectURL(tempDialogImage.previewUrl);
      setTempDialogImage(null);
    }

    setPhotoDialog({ open: false, mode: "add", data: null });
  };

  // ✅ Sélection d'image dans le dialog (temporaire, pas encore en attente)
  const handlePhotoImageSelect = (file: File) => {
    if (!photoDialog.data) return;

    // Nettoyer l'ancienne image temporaire si elle existe
    if (tempDialogImage) {
      URL.revokeObjectURL(tempDialogImage.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);

    // ✅ Stocker dans l'état temporaire (pas dans pendingImages)
    setTempDialogImage({ file, previewUrl });

    // Mettre à jour le dialog pour l'aperçu
    setPhotoDialog({
      ...photoDialog,
      data: { ...photoDialog.data, image: previewUrl },
    });
  };

  // ✅ ADD = en attente avec image, EDIT = direct Firebase
  const handleSavePhotoDialog = async () => {
    if (!data || !photoDialog.data) return;

    const photoId = photoDialog.data.id;

    if (photoDialog.mode === "add") {
      // ✅ ADD : Ajouter localement et mettre en attente
      setData({ ...data, photos: [...data.photos, photoDialog.data] });

      // ✅ Si une image a été sélectionnée, l'ajouter à pendingImages
      if (tempDialogImage) {
        setPendingImages((prev) => [
          ...prev,
          {
            file: tempDialogImage.file,
            previewUrl: tempDialogImage.previewUrl,
            itemId: photoId,
          },
        ]);
        // Ne pas nettoyer tempDialogImage ici car l'URL est maintenant dans pendingImages
        setTempDialogImage(null);
      } else {
        // Pas d'image, juste les métadonnées
        setPendingNewPhotoIds((prev) => new Set([...prev, photoId]));
      }

      setToast({
        msg: "Photo ajoutée - N'oubliez pas d'enregistrer",
        type: "info",
      });
    } else {
      // ✅ EDIT : Envoyer directement à Firebase
      setUpdatingItem(photoId);
      try {
        let updatedPhoto = { ...photoDialog.data };

        // Si une nouvelle image a été sélectionnée, l'uploader
        if (tempDialogImage) {
          const compressedFile = await imageCompression(
            tempDialogImage.file,
            COMPRESSION_OPTIONS,
          );

          const formData = new FormData();
          formData.append("file", compressedFile);

          // Si l'ancienne photo avait un publicId, l'envoyer pour remplacement
          const existingPhoto = data.photos.find((p) => p.id === photoId);
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

          updatedPhoto = {
            ...updatedPhoto,
            image: resData.imageUrl,
            imagePublicId: resData.imagePublicId,
          };

          // Nettoyer l'URL temporaire
          URL.revokeObjectURL(tempDialogImage.previewUrl);
          setTempDialogImage(null);
        }

        const updatedPhotos = data.photos.map((p) =>
          p.id === photoId ? updatedPhoto : p,
        );

        await updateDoc(doc(db, "website_content", "realisation_section"), {
          photos: updatedPhotos,
        });

        setData({ ...data, photos: updatedPhotos });
        setToast({ msg: "Photo mise à jour !", type: "success" });
      } catch (e: any) {
        console.error("❌ Erreur mise à jour photo:", e);
        setToast({ msg: "Erreur de mise à jour", type: "error" });
      } finally {
        setUpdatingItem(null);
      }
    }

    // Fermer le dialog (sans nettoyer tempDialogImage car déjà géré)
    setPhotoDialog({ open: false, mode: "add", data: null });
  };

  // ✅ DELETE : Direct Firebase ou local si en attente
  const handleDeletePhoto = async (photoId: string) => {
    if (!data) return;
    const photo = data.photos.find((p) => p.id === photoId);
    if (!photo) return;

    // Si c'est une photo en attente (non encore sauvegardée), juste la retirer localement
    if (isPendingPhoto(photoId)) {
      // Nettoyer l'image pending si elle existe
      const pendingImage = pendingImages.find((p) => p.itemId === photoId);
      if (pendingImage) {
        URL.revokeObjectURL(pendingImage.previewUrl);
        setPendingImages((prev) => prev.filter((p) => p.itemId !== photoId));
      }

      setPendingNewPhotoIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(photoId);
        return newSet;
      });

      setData({ ...data, photos: data.photos.filter((p) => p.id !== photoId) });
      setToast({ msg: "Photo retirée", type: "success" });
      return;
    }

    // Sinon, supprimer directement de Firebase + Cloudinary
    setDeletingItem(photoId);
    try {
      // Supprimer l'image de Cloudinary si elle existe
      if (photo.imagePublicId) {
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

      const updatedPhotos = data.photos.filter((p) => p.id !== photoId);

      await updateDoc(doc(db, "website_content", "realisation_section"), {
        photos: updatedPhotos,
      });

      setData({ ...data, photos: updatedPhotos });
      setToast({ msg: "Photo supprimée !", type: "success" });
    } catch (e: any) {
      console.error("❌ Erreur suppression photo:", e);
      setToast({ msg: "Erreur de suppression", type: "error" });
    } finally {
      setDeletingItem(null);
    }
  };

  // ✅ Annuler tous les éléments en attente
  const handleCancelAllChanges = () => {
    // Nettoyer les images pending
    pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPendingImages([]);

    // Retirer les nouvelles vidéos du state local
    if (data) {
      const newData = {
        ...data,
        videos: data.videos.filter((v) => !pendingNewVideoIds.has(v.id)),
        photos: data.photos.filter(
          (p) =>
            !pendingNewPhotoIds.has(p.id) &&
            !pendingImages.some((pi) => pi.itemId === p.id),
        ),
      };
      setData(newData);
    }

    setPendingNewVideoIds(new Set());
    setPendingNewPhotoIds(new Set());

    setToast({ msg: "Modifications annulées", type: "info" });
  };
  const [open, setOpen] = useState(true);

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
        <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 1, sm: 2, md: 4 } }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{
              "& .MuiTabs-indicator": {
                height: 4,
                borderRadius: "3px 3px 0 0",
                background: "white",
              },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
                minHeight: { xs: 48, md: 64 },
                px: { xs: 1, sm: 2 },
                color: "white",
                "&.Mui-selected": { color: "white" },
              },
            }}
          >
            <Tab
              icon={<PreviewIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
              iconPosition="start"
              label={isSmall ? "" : isMobile ? "Aperçu" : "Aperçu du site"}
            />
            <Tab
              icon={
                <Badge
                  badgeContent={hasChangesToSave ? totalPendingCount : 0}
                  sx={{
                    "& .MuiBadge-badge": {
                      background: THEME.accent.orange,
                      color: "white",
                      fontSize: "0.65rem",
                      minWidth: 16,
                      height: 16,
                    },
                  }}
                >
                  <EditIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
                </Badge>
              }
              iconPosition="start"
              label={isSmall ? "" : isMobile ? "Éditeur" : "Éditeur Visuel"}
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
          <Box sx={{ maxWidth: 1600, mx: "auto", p: { xs: 1, sm: 2, md: 4 } }}>
            {/* TOP BAR */}
            <EditBannier
              open={open}
              onClose={() => setOpen(false)}
              url="bannier_realisation"
            />
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2, md: 3 },
                mb: { xs: 2, md: 4 },
                borderRadius: { xs: 2, md: 3 },
                background: "white",
                border: `1px solid ${THEME.neutral[200]}`,
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "stretch", md: "center" },
                justifyContent: "space-between",
                gap: { xs: 1.5, md: 2 },
              }}
            >
              {/* Tabs Vidéos/Photos */}
              <Box
                sx={{
                  display: "flex",
                  p: 0.5,
                  borderRadius: 2,
                  bgcolor: THEME.neutral[100],
                  width: { xs: "100%", md: "auto" },
                  minWidth: { md: 320 },
                }}
              >
                <Button
                  size="small"
                  onClick={() => setEditorTab("videos")}
                  startIcon={
                    !isSmall && (
                      <Badge
                        badgeContent={totalPendingVideos}
                        sx={{
                          "& .MuiBadge-badge": {
                            background: THEME.accent.orange,
                            color: "white",
                            fontSize: "0.6rem",
                            minWidth: 14,
                            height: 14,
                          },
                        }}
                      >
                        <YouTubeIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                      </Badge>
                    )
                  }
                  sx={{
                    flex: 1,
                    mr: { xs: 0.5, sm: 1 },
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
                    py: { xs: 0.75, sm: 1 },
                    color: editorTab === "videos" ? "white" : "#616637",
                    background:
                      editorTab === "videos" ? "#616637" : "transparent",
                    boxShadow:
                      editorTab === "videos"
                        ? "0 2px 8px rgba(0, 0, 0, 0.2)"
                        : "none",
                    "&:hover": {
                      background:
                        editorTab === "videos" ? "#4a4f2a" : "#D9CBC0",
                    },
                  }}
                >
                  {isSmall
                    ? `Vidéos (${data.videos.length})`
                    : `Vidéos (${data.videos.length})`}
                </Button>
                <Button
                  onClick={() => setEditorTab("photos")}
                  size="small"
                  startIcon={
                    !isSmall && (
                      <Badge
                        badgeContent={totalPendingPhotos}
                        sx={{
                          "& .MuiBadge-badge": {
                            background: THEME.accent.orange,
                            color: "white",
                            fontSize: "0.6rem",
                            minWidth: 14,
                            height: 14,
                          },
                        }}
                      >
                        <GalleryIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                      </Badge>
                    )
                  }
                  sx={{
                    flex: 1,
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
                    py: { xs: 0.75, sm: 1 },
                    color: editorTab === "photos" ? "white" : "#616637",
                    background:
                      editorTab === "photos" ? "#616637" : "transparent",
                    boxShadow:
                      editorTab === "photos"
                        ? "0 2px 8px rgba(0, 0, 0, 0.2)"
                        : "none",
                    "&:hover": {
                      background:
                        editorTab === "photos" ? "#4a4f2a" : "#D9CBC0",
                    },
                  }}
                >
                  {isSmall
                    ? `Photos (${data.photos.length})`
                    : `Photos (${data.photos.length})`}
                </Button>
              </Box>

              {/* Actions */}
              <Stack
                direction="row"
                spacing={{ xs: 1, sm: 2 }}
                alignItems="center"
                justifyContent={{ xs: "space-between", md: "flex-end" }}
                sx={{ width: { xs: "100%", md: "auto" } }}
              >
                {/* Chip d'information */}
                {hasChangesToSave && (
                  <Chip
                    icon={<PendingIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                    label={
                      isSmall
                        ? `${totalPendingCount} en attente`
                        : getPendingLabel()
                    }
                    onDelete={handleCancelAllChanges}
                    size={isSmall ? "small" : "medium"}
                    sx={{
                      bgcolor: alpha(THEME.accent.orange, 0.1),
                      color: THEME.accent.orange,
                      fontWeight: 600,
                      fontSize: { xs: "0.65rem", sm: "0.75rem" },
                      maxWidth: { xs: 150, sm: "none" },
                      "& .MuiChip-label": {
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      },
                      "& .MuiChip-deleteIcon": {
                        color: THEME.accent.orange,
                        fontSize: { xs: 16, sm: 18 },
                        "&:hover": { color: "#EA580C" },
                      },
                    }}
                  />
                )}

                {/* Bouton Enregistrer */}
                <Button
                  variant="contained"
                  startIcon={
                    saving ? (
                      <CircularProgress
                        size={isSmall ? 14 : 18}
                        sx={{ color: "white" }}
                      />
                    ) : (
                      <SaveIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                    )
                  }
                  onClick={handleSave}
                  size="small"
                  disabled={saving || !hasChangesToSave}
                  sx={{
                    px: { xs: 1.5, sm: 2, md: 3 },
                    py: { xs: 1, sm: 1.5 },
                    borderRadius: { xs: 1.5, sm: 2 },
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
                    minWidth: { xs: "auto", sm: 120 },
                    background: hasChangesToSave
                      ? `linear-gradient(135deg, ${THEME.accent.orange} 0%, #EA580C 100%)`
                      : THEME.primary.gradient,
                    boxShadow: hasChangesToSave
                      ? "0 4px 14px rgba(245, 158, 11, 0.4)"
                      : "0 4px 14px rgba(99, 102, 241, 0.4)",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: hasChangesToSave
                        ? "0 6px 20px rgba(245, 158, 11, 0.5)"
                        : "0 6px 20px rgba(99, 102, 241, 0.5)",
                    },
                    "&:disabled": {
                      background: THEME.neutral[300],
                      color: THEME.neutral[500],
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {saving
                    ? isSmall
                      ? "..."
                      : "Sauvegarde..."
                    : hasChangesToSave
                      ? isSmall
                        ? `(${totalPendingCount})`
                        : `Enregistrer (${totalPendingCount})`
                      : isSmall
                        ? "OK"
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
                  spacing={{ xs: 1.5, sm: 2 }}
                  mb={{ xs: 2, md: 4 }}
                >
                  <Box>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      mb={0.5}
                      flexWrap="wrap"
                    >
                      <Video className="h-5 w-5 sm:h-6 sm:w-6 text-tertiary" />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontSize: {
                            xs: "1.1rem",
                            sm: "1.25rem",
                            md: "1.5rem",
                          },
                        }}
                      >
                        Vidéos
                      </Typography>
                      {totalPendingVideos > 0 && (
                        <Chip
                          size="small"
                          label={`${totalPendingVideos} en attente`}
                          sx={{
                            bgcolor: THEME.accent.orange,
                            color: "white",
                            fontWeight: 600,
                            fontSize: "0.65rem",
                            height: 22,
                          }}
                        />
                      )}
                    </Stack>
                    <Typography
                      variant="body2"
                      color={THEME.neutral[500]}
                      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                    >
                      Ajoutez vos vidéos via leur lien YouTube
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={
                      <AddIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                    }
                    onClick={handleAddVideo}
                    size={isSmall ? "small" : "medium"}
                    sx={{
                      px: { xs: 2, sm: 3 },
                      py: { xs: 1, sm: 1.5 },
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: { xs: "0.8rem", sm: "0.875rem" },
                      background: "#616637",
                      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        background: "#4a4f2a",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isSmall ? "Ajouter" : "Nouvelle vidéo"}
                  </Button>
                </Stack>

                <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
                  {data.videos.map((video, index) => {
                    const thumbnail = getYouTubeThumbnail(video.videoUrl);
                    const isValidUrl = isValidYouTubeUrl(video.videoUrl);
                    const isVideoPending = isPendingVideo(video.id);

                    return (
                      <Grid item xs={6} sm={6} md={4} lg={3} key={video.id}>
                        <Grow in timeout={300 + index * 100}>
                          <Card
                            sx={{
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              borderRadius: { xs: 2, md: 3 },
                              overflow: "hidden",
                              border: isVideoPending
                                ? `2px dashed ${THEME.accent.orange}`
                                : `1px solid ${THEME.neutral[200]}`,
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: {
                                  xs: "none",
                                  md: "translateY(-8px)",
                                },
                                boxShadow: {
                                  xs: "0 4px 12px rgba(0,0,0,0.1)",
                                  md: "0 20px 40px rgba(0,0,0,0.1)",
                                },
                              },
                            }}
                          >
                            <Box sx={{ position: "relative" }}>
                              {isVideoPending && (
                                <Chip
                                  icon={<PendingIcon sx={{ fontSize: 12 }} />}
                                  label="En attente"
                                  size="small"
                                  sx={{
                                    position: "absolute",
                                    top: 8,
                                    left: 8,
                                    zIndex: 5,
                                    bgcolor: THEME.accent.orange,
                                    color: "white",
                                    fontWeight: 600,
                                    fontSize: "0.6rem",
                                    height: 20,
                                    "& .MuiChip-icon": { fontSize: 12 },
                                  }}
                                />
                              )}

                              <CardMedia
                                sx={{
                                  height: { xs: 100, sm: 140, md: 180 },
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
                                      gap: 0.5,
                                    }}
                                  >
                                    <YouTubeIcon
                                      sx={{
                                        fontSize: { xs: 32, sm: 48, md: 60 },
                                        color: THEME.neutral[600],
                                      }}
                                    />
                                    {!isSmall && (
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: THEME.neutral[500],
                                          fontSize: "0.65rem",
                                        }}
                                      >
                                        Ajoutez un lien YouTube
                                      </Typography>
                                    )}
                                  </Box>
                                )}

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
                                        width: { xs: 36, sm: 48, md: 64 },
                                        height: { xs: 36, sm: 48, md: 64 },
                                        borderRadius: 2,
                                        bgcolor: "#616637",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow:
                                          "0 4px 20px rgba(158, 134, 134, 0.4)",
                                      }}
                                    >
                                      <PlayIcon
                                        sx={{
                                          fontSize: { xs: 20, sm: 28, md: 36 },
                                          color: "white",
                                          ml: 0.5,
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                )}

                                <YouTubeIcon
                                  sx={{
                                    position: "absolute",
                                    top: { xs: 4, sm: 8, md: 12 },
                                    right: { xs: 4, sm: 8, md: 12 },
                                    bgcolor: "#ffffff31",
                                    borderRadius: "50%",
                                    width: { xs: 20, sm: 24, md: 30 },
                                    height: { xs: 20, sm: 24, md: 30 },
                                    boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
                                    color: "white",
                                    p: { xs: 0.25, sm: 0.5 },
                                  }}
                                />
                              </CardMedia>
                            </Box>

                            <CardContent
                              sx={{
                                flex: 1,
                                p: { xs: 1, sm: 1.5, md: 2.5 },
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 700,
                                  color: THEME.neutral[800],
                                  mb: 0.5,
                                  fontSize: {
                                    xs: "0.75rem",
                                    sm: "0.875rem",
                                    md: "1rem",
                                  },
                                  lineHeight: 1.3,
                                }}
                                noWrap
                              >
                                {video.title || "Sans titre"}
                              </Typography>
                              {!isSmall && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: THEME.neutral[500],
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    lineHeight: 1.4,
                                    mb: 1.5,
                                    minHeight: { sm: 36, md: 42 },
                                    fontSize: { sm: "0.75rem", md: "0.875rem" },
                                  }}
                                >
                                  {video.description || "Pas de description"}
                                </Typography>
                              )}
                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                flexWrap="wrap"
                                gap={0.5}
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
                                      fontSize: {
                                        xs: "0.55rem",
                                        sm: "0.65rem",
                                        md: "0.75rem",
                                      },
                                      height: { xs: 18, sm: 22, md: 24 },
                                    }}
                                  />
                                )}
                                <Chip
                                  size="small"
                                  label={formatDateDisplay(video.date)}
                                  variant="outlined"
                                  sx={{
                                    borderColor: THEME.neutral[300],
                                    color: THEME.neutral[600],
                                    fontSize: {
                                      xs: "0.55rem",
                                      sm: "0.65rem",
                                      md: "0.75rem",
                                    },
                                    height: { xs: 18, sm: 22, md: 24 },
                                  }}
                                />
                              </Stack>
                            </CardContent>

                            <Divider />

                            <Stack
                              direction="row"
                              justifyContent="flex-end"
                              spacing={0.5}
                              sx={{
                                p: { xs: 0.5, sm: 1, md: 1.5 },
                                bgcolor: THEME.neutral[50],
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleEditVideo(video)}
                                disabled={updatingItem === video.id}
                                sx={{
                                  color: THEME.primary.main,
                                  bgcolor: alpha(THEME.primary.main, 0.1),
                                  width: { xs: 28, sm: 32, md: 36 },
                                  height: { xs: 28, sm: 32, md: 36 },
                                  "&:hover": {
                                    bgcolor: alpha(THEME.primary.main, 0.2),
                                  },
                                }}
                              >
                                {updatingItem === video.id ? (
                                  <CircularProgress
                                    size={14}
                                    sx={{ color: THEME.primary.main }}
                                  />
                                ) : (
                                  <EditIcon
                                    sx={{
                                      fontSize: { xs: 14, sm: 16, md: 18 },
                                    }}
                                  />
                                )}
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteVideo(video.id)}
                                disabled={deletingItem === video.id}
                                sx={{
                                  color: "#EF4444",
                                  bgcolor: alpha("#EF4444", 0.1),
                                  width: { xs: 28, sm: 32, md: 36 },
                                  height: { xs: 28, sm: 32, md: 36 },
                                  "&:hover": { bgcolor: alpha("#EF4444", 0.2) },
                                }}
                              >
                                {deletingItem === video.id ? (
                                  <CircularProgress
                                    size={14}
                                    sx={{ color: "#EF4444" }}
                                  />
                                ) : (
                                  <DeleteIcon
                                    sx={{
                                      fontSize: { xs: 14, sm: 16, md: 18 },
                                    }}
                                  />
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
                          p: { xs: 3, sm: 4, md: 6 },
                          textAlign: "center",
                          borderRadius: { xs: 2, md: 3 },
                          bgcolor: "white",
                          border: `2px dashed ${THEME.neutral[300]}`,
                        }}
                      >
                        <Box
                          sx={{
                            width: { xs: 50, sm: 60, md: 80 },
                            height: { xs: 50, sm: 60, md: 80 },
                            borderRadius: 2,
                            bgcolor: alpha(THEME.youtube.main, 0.1),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mx: "auto",
                            mb: { xs: 2, md: 3 },
                          }}
                        >
                          <YouTubeIcon
                            sx={{
                              fontSize: { xs: 28, sm: 32, md: 40 },
                              color: THEME.youtube.main,
                            }}
                          />
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{
                            color: THEME.neutral[700],
                            mb: 1,
                            fontSize: { xs: "1rem", md: "1.25rem" },
                          }}
                        >
                          Aucune vidéo
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: THEME.neutral[500],
                            mb: { xs: 2, md: 3 },
                            fontSize: { xs: "0.75rem", md: "0.875rem" },
                          }}
                        >
                          Ajoutez votre première vidéo YouTube
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleAddVideo}
                          size={isSmall ? "small" : "medium"}
                          sx={{
                            background: THEME.youtube.gradient,
                            textTransform: "none",
                            fontWeight: 600,
                            px: { xs: 2, md: 4 },
                            py: { xs: 1, md: 1.5 },
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
                  spacing={{ xs: 1.5, sm: 2 }}
                  mb={{ xs: 2, md: 4 }}
                >
                  <Box>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      mb={0.5}
                      flexWrap="wrap"
                    >
                      <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-accent-warm" />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontSize: {
                            xs: "1.1rem",
                            sm: "1.25rem",
                            md: "1.5rem",
                          },
                        }}
                      >
                        Photos
                      </Typography>
                      {totalPendingPhotos > 0 && (
                        <Chip
                          size="small"
                          label={`${totalPendingPhotos} en attente`}
                          sx={{
                            bgcolor: THEME.accent.orange,
                            color: "white",
                            fontWeight: 600,
                            fontSize: "0.65rem",
                            height: 22,
                          }}
                        />
                      )}
                    </Stack>
                    <Typography
                      variant="body2"
                      color={THEME.neutral[500]}
                      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                    >
                      Gérez votre galerie photo
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={
                      <AddIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                    }
                    onClick={handleAddPhoto}
                    size={isSmall ? "small" : "medium"}
                    sx={{
                      px: { xs: 2, sm: 3 },
                      py: { xs: 1, sm: 1.5 },
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: { xs: "0.8rem", sm: "0.875rem" },
                      background: "#616637",
                      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        background: "#4a4f2a",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isSmall ? "Ajouter" : "Nouvelle photo"}
                  </Button>
                </Stack>

                <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
                  {data.photos.map((photo, index) => {
                    const isPhotoPending = isPendingPhoto(photo.id);

                    return (
                      <Grid item xs={6} sm={6} md={4} lg={3} key={photo.id}>
                        <Grow in timeout={300 + index * 100}>
                          <Card
                            sx={{
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              borderRadius: { xs: 2, md: 3 },
                              overflow: "hidden",
                              border: isPhotoPending
                                ? `2px dashed ${THEME.accent.orange}`
                                : `1px solid ${THEME.neutral[200]}`,
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: {
                                  xs: "none",
                                  md: "translateY(-8px)",
                                },
                                boxShadow: {
                                  xs: "0 4px 12px rgba(0,0,0,0.1)",
                                  md: "0 20px 40px rgba(0,0,0,0.1)",
                                },
                                "& .photo-overlay": { opacity: 1 },
                              },
                            }}
                          >
                            <Box sx={{ position: "relative" }}>
                              {isPhotoPending && (
                                <Chip
                                  icon={<PendingIcon sx={{ fontSize: 12 }} />}
                                  label="En attente"
                                  size="small"
                                  sx={{
                                    position: "absolute",
                                    top: 8,
                                    left: 8,
                                    zIndex: 5,
                                    bgcolor: THEME.accent.orange,
                                    color: "white",
                                    fontWeight: 600,
                                    fontSize: "0.6rem",
                                    height: 20,
                                    "& .MuiChip-icon": { fontSize: 12 },
                                  }}
                                />
                              )}
                              <CardMedia
                                sx={{
                                  height: { xs: 120, sm: 160, md: 220 },
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
                                        fontSize: { xs: 32, sm: 48, md: 60 },
                                        color: THEME.neutral[300],
                                      }}
                                    />
                                  </Box>
                                )}
                              </CardMedia>
                            </Box>

                            <CardContent
                              sx={{
                                flex: 1,
                                p: { xs: 1, sm: 1.5, md: 2.5 },
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 700,
                                  color: THEME.neutral[800],
                                  mb: 0.5,
                                  fontSize: {
                                    xs: "0.75rem",
                                    sm: "0.875rem",
                                    md: "1rem",
                                  },
                                  lineHeight: 1.3,
                                }}
                                noWrap
                              >
                                {photo.title || "Sans titre"}
                              </Typography>
                              {!isSmall && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: THEME.neutral[500],
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    lineHeight: 1.4,
                                    mb: 1.5,
                                    minHeight: { sm: 36, md: 42 },
                                    fontSize: { sm: "0.75rem", md: "0.875rem" },
                                  }}
                                >
                                  {photo.description || "Pas de description"}
                                </Typography>
                              )}
                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                flexWrap="wrap"
                                gap={0.5}
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
                                      fontSize: {
                                        xs: "0.55rem",
                                        sm: "0.65rem",
                                        md: "0.75rem",
                                      },
                                      height: { xs: 18, sm: 22, md: 24 },
                                    }}
                                  />
                                )}
                                <Chip
                                  size="small"
                                  label={formatDateDisplay(photo.date)}
                                  variant="outlined"
                                  sx={{
                                    borderColor: THEME.neutral[300],
                                    color: THEME.neutral[600],
                                    fontSize: {
                                      xs: "0.55rem",
                                      sm: "0.65rem",
                                      md: "0.75rem",
                                    },
                                    height: { xs: 18, sm: 22, md: 24 },
                                  }}
                                />
                              </Stack>
                            </CardContent>

                            <Divider />

                            <Stack
                              direction="row"
                              justifyContent="flex-end"
                              spacing={0.5}
                              sx={{
                                p: { xs: 0.5, sm: 1, md: 1.5 },
                                bgcolor: THEME.neutral[50],
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleEditPhoto(photo)}
                                disabled={updatingItem === photo.id}
                                sx={{
                                  color: THEME.secondary.main,
                                  bgcolor: alpha(THEME.secondary.main, 0.1),
                                  width: { xs: 28, sm: 32, md: 36 },
                                  height: { xs: 28, sm: 32, md: 36 },
                                  "&:hover": {
                                    bgcolor: alpha(THEME.secondary.main, 0.2),
                                  },
                                }}
                              >
                                {updatingItem === photo.id ? (
                                  <CircularProgress
                                    size={14}
                                    sx={{ color: THEME.secondary.main }}
                                  />
                                ) : (
                                  <EditIcon
                                    sx={{
                                      fontSize: { xs: 14, sm: 16, md: 18 },
                                    }}
                                  />
                                )}
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeletePhoto(photo.id)}
                                disabled={deletingItem === photo.id}
                                sx={{
                                  color: "#EF4444",
                                  bgcolor: alpha("#EF4444", 0.1),
                                  width: { xs: 28, sm: 32, md: 36 },
                                  height: { xs: 28, sm: 32, md: 36 },
                                  "&:hover": { bgcolor: alpha("#EF4444", 0.2) },
                                }}
                              >
                                {deletingItem === photo.id ? (
                                  <CircularProgress
                                    size={14}
                                    sx={{ color: "#EF4444" }}
                                  />
                                ) : (
                                  <DeleteIcon
                                    sx={{
                                      fontSize: { xs: 14, sm: 16, md: 18 },
                                    }}
                                  />
                                )}
                              </IconButton>
                            </Stack>
                          </Card>
                        </Grow>
                      </Grid>
                    );
                  })}

                  {data.photos.length === 0 && (
                    <Grid item xs={12}>
                      <Paper
                        sx={{
                          p: { xs: 3, sm: 4, md: 6 },
                          textAlign: "center",
                          borderRadius: { xs: 2, md: 3 },
                          bgcolor: "white",
                          border: `2px dashed ${THEME.neutral[300]}`,
                        }}
                      >
                        <Box
                          sx={{
                            width: { xs: 50, sm: 60, md: 80 },
                            height: { xs: 50, sm: 60, md: 80 },
                            borderRadius: "50%",
                            bgcolor: alpha(THEME.secondary.main, 0.1),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mx: "auto",
                            mb: { xs: 2, md: 3 },
                          }}
                        >
                          <PhotoIcon
                            sx={{
                              fontSize: { xs: 28, sm: 32, md: 40 },
                              color: THEME.secondary.main,
                            }}
                          />
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{
                            color: THEME.neutral[700],
                            mb: 1,
                            fontSize: { xs: "1rem", md: "1.25rem" },
                          }}
                        >
                          Aucune photo
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: THEME.neutral[500],
                            mb: { xs: 2, md: 3 },
                            fontSize: { xs: "0.75rem", md: "0.875rem" },
                          }}
                        >
                          Commencez par ajouter votre première photo
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleAddPhoto}
                          size={isSmall ? "small" : "medium"}
                          sx={{
                            background: THEME.secondary.gradient,
                            textTransform: "none",
                            fontWeight: 600,
                            px: { xs: 2, md: 4 },
                            py: { xs: 1, md: 1.5 },
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
        onClose={handleCloseVideoDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isSmall}
        PaperProps={{
          sx: {
            borderRadius: isSmall ? 0 : 3,
            overflow: "hidden",
            m: isSmall ? 0 : 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: THEME.youtube.gradient,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <YouTubeIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
            >
              {videoDialog.mode === "add"
                ? "Nouvelle vidéo"
                : "Modifier la vidéo"}
            </Typography>
          </Stack>
          <IconButton
            onClick={handleCloseVideoDialog}
            sx={{ color: "white" }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          {videoDialog.data && (
            <Stack spacing={{ xs: 2, sm: 3 }} pt={{ xs: 1, sm: 2 }}>
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
                        width: { xs: 48, sm: 64 },
                        height: { xs: 34, sm: 44 },
                        borderRadius: 1.5,
                        bgcolor: THEME.youtube.main,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PlayIcon
                        sx={{ fontSize: { xs: 24, sm: 32 }, color: "white" }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}

              <TextField
                label="Lien YouTube"
                fullWidth
                size={isSmall ? "small" : "medium"}
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
                    <YouTubeIcon
                      sx={{
                        mr: 1,
                        color: THEME.youtube.main,
                        fontSize: { xs: 18, sm: 24 },
                      }}
                    />
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />

              <TextField
                label="Titre"
                fullWidth
                size={isSmall ? "small" : "medium"}
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
                size={isSmall ? "small" : "medium"}
                multiline
                rows={isSmall ? 2 : 3}
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Client"
                    fullWidth
                    size={isSmall ? "small" : "medium"}
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
                          <span
                            style={{ fontSize: isSmall ? "0.875rem" : "1rem" }}
                          >
                            {client.label}
                          </span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date de réalisation"
                    type="date"
                    fullWidth
                    size={isSmall ? "small" : "medium"}
                    value={videoDialog.data.date}
                    onChange={(e) =>
                      setVideoDialog({
                        ...videoDialog,
                        data: { ...videoDialog.data!, date: e.target.value },
                      })
                    }
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <CalendarIcon
                          sx={{
                            mr: 1,
                            color: THEME.neutral[400],
                            fontSize: { xs: 18, sm: 24 },
                          }}
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
          sx={{
            p: { xs: 2, sm: 3 },
            borderTop: `1px solid ${THEME.neutral[200]}`,
            flexDirection: { xs: "column", sm: "row" },
            gap: 1,
          }}
        >
          <Button
            onClick={handleCloseVideoDialog}
            fullWidth={isSmall}
            sx={{
              textTransform: "none",
              color: THEME.neutral[600],
              px: 3,
              order: { xs: 2, sm: 1 },
            }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveVideoDialog}
            fullWidth={isSmall}
            disabled={
              !videoDialog.data?.title ||
              !isValidYouTubeUrl(videoDialog.data?.videoUrl || "") ||
              updatingItem === videoDialog.data?.id
            }
            sx={{
              background: THEME.youtube.gradient,
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              borderRadius: 2,
              color: "white",
              order: { xs: 1, sm: 2 },
            }}
          >
            {updatingItem === videoDialog.data?.id ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : videoDialog.mode === "add" ? (
              "Ajouter"
            ) : (
              "Mettre à jour"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== DIALOG PHOTO ========== */}
      <Dialog
        open={photoDialog.open}
        onClose={handleClosePhotoDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isSmall}
        PaperProps={{
          sx: {
            borderRadius: isSmall ? 0 : 3,
            overflow: "hidden",
            m: isSmall ? 0 : 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: THEME.secondary.gradient,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <GalleryIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
            >
              {photoDialog.mode === "add"
                ? "Nouvelle photo"
                : "Modifier la photo"}
            </Typography>
          </Stack>
          <IconButton
            onClick={handleClosePhotoDialog}
            sx={{ color: "white" }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          {photoDialog.data && (
            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
              {/* Image Upload */}
              <Grid item xs={12} md={5}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    mb: 1.5,
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                  }}
                >
                  Image
                </Typography>
                <Box
                  sx={{
                    width: "100%",
                    aspectRatio: { xs: "16/9", md: "4/3" },
                    bgcolor: THEME.neutral[100],
                    borderRadius: { xs: 2, md: 3 },
                    overflow: "hidden",
                    position: "relative",
                    border: tempDialogImage
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
                      {tempDialogImage && (
                        <Chip
                          icon={<PendingIcon sx={{ fontSize: 12 }} />}
                          label="Non confirmée"
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            bgcolor: THEME.accent.orange,
                            color: "white",
                            fontSize: "0.65rem",
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
                        sx={{
                          fontSize: { xs: 36, sm: 48 },
                          color: THEME.neutral[400],
                        }}
                      />
                      <Typography
                        variant="body2"
                        color={THEME.neutral[500]}
                        sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                      >
                        {isSmall
                          ? "Cliquez pour ajouter"
                          : "Glissez une image ici"}
                      </Typography>
                    </Stack>
                  )}
                </Box>
                <Button
                  component="label"
                  variant="outlined"
                  fullWidth
                  size={isSmall ? "small" : "medium"}
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    mt: 2,
                    py: { xs: 1, sm: 1.5 },
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
                {tempDialogImage && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 1,
                      color: THEME.accent.orange,
                      textAlign: "center",
                    }}
                  >
                    ⚠️ L'image sera ajoutée seulement après avoir cliqué sur
                    "Ajouter"
                  </Typography>
                )}
              </Grid>

              {/* Form */}
              <Grid item xs={12} md={7}>
                <Stack spacing={{ xs: 2, sm: 3 }}>
                  <TextField
                    label="Titre"
                    fullWidth
                    size={isSmall ? "small" : "medium"}
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
                    size={isSmall ? "small" : "medium"}
                    multiline
                    rows={isSmall ? 2 : 3}
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
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        label="Libellé"
                        fullWidth
                        size={isSmall ? "small" : "medium"}
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
                              <span
                                style={{
                                  fontSize: isSmall ? "0.875rem" : "1rem",
                                }}
                              >
                                {client.label}
                              </span>
                            </Stack>
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Date de réalisation"
                        type="date"
                        fullWidth
                        size={isSmall ? "small" : "medium"}
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
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: (
                            <CalendarIcon
                              sx={{
                                mr: 1,
                                color: THEME.neutral[400],
                                fontSize: { xs: 18, sm: 24 },
                              }}
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
          sx={{
            p: { xs: 2, sm: 3 },
            borderTop: `1px solid ${THEME.neutral[200]}`,
            flexDirection: { xs: "column", sm: "row" },
            gap: 1,
          }}
        >
          <Button
            onClick={handleClosePhotoDialog}
            fullWidth={isSmall}
            sx={{
              textTransform: "none",
              color: THEME.neutral[600],
              px: 3,
              order: { xs: 2, sm: 1 },
            }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSavePhotoDialog}
            fullWidth={isSmall}
            disabled={
              !photoDialog.data?.title || updatingItem === photoDialog.data?.id
            }
            sx={{
              background: THEME.secondary.gradient,
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              borderRadius: 2,
              color: "white",
              order: { xs: 1, sm: 2 },
            }}
          >
            {updatingItem === photoDialog.data?.id ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : photoDialog.mode === "add" ? (
              "Ajouter"
            ) : (
              "Mettre à jour"
            )}
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
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
