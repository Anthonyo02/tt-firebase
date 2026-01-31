// RealisationEditor.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Badge,
  Snackbar,
  Alert,
  Fade,
  alpha,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Edit as EditIcon,
  Visibility as PreviewIcon,
} from "@mui/icons-material";

// Types
import {
  VideoItem,
  PhotoItem,
  DigitalProjectItem,
  PendingImage,
  TempDialogImage,
  ToastState,
  VideoDialogState,
  PhotoDialogState,
  DigitalProjectDialogState,
} from "./types";

// Constants
import { THEME, COMPRESSION_OPTIONS } from "./constants";

// Utils
import { generateId } from "./utils";

// Hooks
import { useRealisationData } from "./hooks/useRealisationData";

// Components
import EditBannier from "../HeroImageEditor";
import LoadingState from "./LoadingState";
import Realisation from "../siteweb/preview/Realisation";
import EditorHeader from "./EditorTopBar";
import VideosSection from "./sections/VideosSection";
import PhotosSection from "./sections/PhotosSection";
import DigitalProjectsSection from "./sections/DigitalProjectsSection";
import VideoDialog from "./dialogs/VideoDialog";
import PhotoDialog from "./dialogs/PhotoDialog";
import DigitalProjectDialog from "./dialogs/DigitalProjectDialog";

export default function RealisationEditor() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  // Data Hook
  const { data, setData, loading } = useRealisationData();

  // UI States
  const [tabValue, setTabValue] = useState(0);
  const [editorTab, setEditorTab] = useState<"videos" | "photos" | "digitalProjects">("videos");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [open, setOpen] = useState(true);

  // Pending States
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [pendingNewVideoIds, setPendingNewVideoIds] = useState<Set<string>>(new Set());
  const [pendingNewPhotoIds, setPendingNewPhotoIds] = useState<Set<string>>(new Set());
  const [pendingNewDigitalProjectIds, setPendingNewDigitalProjectIds] = useState<Set<string>>(new Set());

  // Temp Dialog Images
  const [tempDialogImages, setTempDialogImages] = useState<TempDialogImage[]>([]);
  const [tempDialogImage, setTempDialogImage] = useState<TempDialogImage | null>(null);

  // Dialog States
  const [videoDialog, setVideoDialog] = useState<VideoDialogState>({
    open: false,
    mode: "add",
    data: null,
  });
  const [photoDialog, setPhotoDialog] = useState<PhotoDialogState>({
    open: false,
    mode: "add",
    data: null,
  });
  const [digitalProjectDialog, setDigitalProjectDialog] = useState<DigitalProjectDialogState>({
    open: false,
    mode: "add",
    data: null,
  });

  // Cleanup
  useEffect(() => {
    return () => {
      pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      tempDialogImages.forEach((t) => URL.revokeObjectURL(t.previewUrl));
      if (tempDialogImage) URL.revokeObjectURL(tempDialogImage.previewUrl);
    };
  }, []);

  // === HELPERS ===
  const isPendingVideo = useCallback(
    (videoId: string) => pendingNewVideoIds.has(videoId),
    [pendingNewVideoIds]
  );

  const isPendingPhoto = useCallback(
    (photoId: string) =>
      pendingNewPhotoIds.has(photoId) ||
      pendingImages.some((p) => p.itemId === photoId && p.type === "photo"),
    [pendingNewPhotoIds, pendingImages]
  );

  const isPendingDigitalProject = useCallback(
    (projectId: string) =>
      pendingNewDigitalProjectIds.has(projectId) ||
      pendingImages.some((p) => p.itemId === projectId && p.type === "digitalProject"),
    [pendingNewDigitalProjectIds, pendingImages]
  );

  const totalPendingVideos = pendingNewVideoIds.size;
  const totalPendingPhotos = new Set([
    ...pendingImages.filter((p) => p.type === "photo").map((p) => p.itemId),
    ...Array.from(pendingNewPhotoIds),
  ]).size;
  const totalPendingDigitalProjects = new Set([
    ...pendingImages.filter((p) => p.type === "digitalProject").map((p) => p.itemId),
    ...Array.from(pendingNewDigitalProjectIds),
  ]).size;

  const hasChangesToSave = totalPendingVideos > 0 || totalPendingPhotos > 0 || totalPendingDigitalProjects > 0;
  const totalPendingCount = totalPendingVideos + totalPendingPhotos + totalPendingDigitalProjects;

  const getPendingLabel = (): string => {
    const parts: string[] = [];
    if (totalPendingVideos > 0) parts.push(`${totalPendingVideos} vidéo${totalPendingVideos > 1 ? "s" : ""}`);
    if (totalPendingPhotos > 0) parts.push(`${totalPendingPhotos} photo${totalPendingPhotos > 1 ? "s" : ""}`);
    if (totalPendingDigitalProjects > 0) parts.push(`${totalPendingDigitalProjects} projet${totalPendingDigitalProjects > 1 ? "s" : ""}`);
    return parts.length === 0 ? "" : `${parts.join(", ")} en attente`;
  };

  // === SAVE HANDLER ===
  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setUploading(pendingImages.length > 0);

    try {
      let finalData = { ...data };
      const uploadErrors: string[] = [];

      // Upload photos
      const pendingByPhotoId = new Map<string, PendingImage[]>();
      for (const pending of pendingImages.filter((p) => p.type === "photo")) {
        const existing = pendingByPhotoId.get(pending.itemId) || [];
        existing.push(pending);
        pendingByPhotoId.set(pending.itemId, existing);
      }

      for (const [photoId, pendingList] of pendingByPhotoId) {
        const photoIndex = finalData.photos.findIndex((p) => p.id === photoId);
        if (photoIndex === -1) continue;

        const photo = finalData.photos[photoIndex];
        const newImages = [];

        for (const img of photo.images) {
          const pending = pendingList.find((p) => p.previewUrl === img.imageUrl);
          if (pending) {
            try {
              const compressedFile = await imageCompression(pending.file, COMPRESSION_OPTIONS);
              const formData = new FormData();
              formData.append("file", compressedFile);

              const res = await fetch("/api/cloudinary/uploadweb/realisationimage", {
                method: "POST",
                body: formData,
              });
              const resData = await res.json();

              if (!res.ok) throw new Error(resData.error || "Erreur upload");

              newImages.push({ imageUrl: resData.imageUrl, imagePublicId: resData.imagePublicId });
              URL.revokeObjectURL(pending.previewUrl);
            } catch (e: any) {
              uploadErrors.push(pending.file.name);
              newImages.push(img);
            }
          } else {
            newImages.push(img);
          }
        }

        finalData.photos[photoIndex] = { ...photo, images: newImages };
      }

      // Upload digital projects
      for (const pending of pendingImages.filter((p) => p.type === "digitalProject")) {
        try {
          const compressedFile = await imageCompression(pending.file, COMPRESSION_OPTIONS);
          const formData = new FormData();
          formData.append("file", compressedFile);

          const res = await fetch("/api/cloudinary/uploadweb/realisationimage", {
            method: "POST",
            body: formData,
          });
          const resData = await res.json();

          if (!res.ok) throw new Error(resData.error || "Erreur upload");

          finalData.digitalProjects = finalData.digitalProjects.map((dp) =>
            dp.id === pending.itemId
              ? { ...dp, image: resData.imageUrl, imagePublicId: resData.imagePublicId }
              : dp
          );

          URL.revokeObjectURL(pending.previewUrl);
        } catch (e: any) {
          uploadErrors.push(pending.file.name);
        }
      }

      // Reset pending states
      setPendingImages([]);
      setPendingNewVideoIds(new Set());
      setPendingNewPhotoIds(new Set());
      setPendingNewDigitalProjectIds(new Set());

      setData(finalData);

      // Save to Firebase
      await updateDoc(doc(db, "website_content", "realisation_section"), {
        videos: finalData.videos,
        photos: finalData.photos,
        digitalProjects: finalData.digitalProjects,
      });

      setToast({
        msg: uploadErrors.length > 0 ? `${uploadErrors.length} image(s) non uploadée(s)` : "Sauvegarde réussie !",
        type: uploadErrors.length > 0 ? "warning" : "success",
      });
    } catch (e: any) {
      setToast({ msg: e.message || "Erreur de sauvegarde", type: "error" });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  // === VIDEO HANDLERS ===
  const handleAddVideo = () => {
    setVideoDialog({
      open: true,
      mode: "add",
      data: {
        id: generateId(),
        title: "",
        description: "",
        videoUrl: "",
        client: "autre",
        date: new Date().toISOString().split("T")[0],
      },
    });
  };

  const handleEditVideo = (video: VideoItem) => {
    setVideoDialog({ open: true, mode: "edit", data: { ...video } });
  };

  const handleCloseVideoDialog = () => {
    setVideoDialog({ open: false, mode: "add", data: null });
  };

  const handleVideoDialogChange = (videoData: VideoItem) => {
    setVideoDialog({ ...videoDialog, data: videoData });
  };

  const handleSaveVideoDialog = async () => {
    if (!data || !videoDialog.data) return;

    const videoId = videoDialog.data.id;

    if (videoDialog.mode === "add") {
      setData({ ...data, videos: [...data.videos, videoDialog.data] });
      setPendingNewVideoIds((prev) => new Set([...prev, videoId]));
      setToast({ msg: "Vidéo ajoutée - N'oubliez pas d'enregistrer", type: "info" });
    } else {
      setUpdatingItem(videoId);
      try {
        const updatedVideos = data.videos.map((v) => (v.id === videoId ? videoDialog.data! : v));
        await updateDoc(doc(db, "website_content", "realisation_section"), { videos: updatedVideos });
        setData({ ...data, videos: updatedVideos });
        setToast({ msg: "Vidéo mise à jour !", type: "success" });
      } catch (e: any) {
        setToast({ msg: "Erreur de mise à jour", type: "error" });
      } finally {
        setUpdatingItem(null);
      }
    }

    handleCloseVideoDialog();
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!data) return;

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

    setDeletingItem(videoId);
    try {
      const updatedVideos = data.videos.filter((v) => v.id !== videoId);
      await updateDoc(doc(db, "website_content", "realisation_section"), { videos: updatedVideos });
      setData({ ...data, videos: updatedVideos });
      setToast({ msg: "Vidéo supprimée !", type: "success" });
    } catch (e: any) {
      setToast({ msg: "Erreur de suppression", type: "error" });
    } finally {
      setDeletingItem(null);
    }
  };

  // === PHOTO HANDLERS ===
  const handleAddPhoto = () => {
    tempDialogImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setTempDialogImages([]);

    setPhotoDialog({
      open: true,
      mode: "add",
      data: {
        id: generateId(),
        title: "",
        description: "",
        driveLink: "",
        images: [],
        client: "autre",
        date: new Date().toISOString().split("T")[0],
      },
    });
  };

  const handleEditPhoto = (photo: PhotoItem) => {
    tempDialogImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setTempDialogImages([]);
    setPhotoDialog({ open: true, mode: "edit", data: { ...photo } });
  };

  const handleClosePhotoDialog = () => {
    tempDialogImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setTempDialogImages([]);
    setPhotoDialog({ open: false, mode: "add", data: null });
  };

  const handlePhotoDialogChange = (photoData: PhotoItem) => {
    setPhotoDialog({ ...photoDialog, data: photoData });
  };

  const handlePhotoImagesSelect = (files: FileList) => {
    if (!photoDialog.data) return;

    const newTempImages: TempDialogImage[] = [];
    const newPreviewImages = [...(photoDialog.data.images || [])];

    Array.from(files).forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      newTempImages.push({ file, previewUrl });
      newPreviewImages.push({ imageUrl: previewUrl, imagePublicId: "" });
    });

    setTempDialogImages([...tempDialogImages, ...newTempImages]);
    setPhotoDialog({ ...photoDialog, data: { ...photoDialog.data, images: newPreviewImages } });
  };

  const handleRemovePhotoImage = (index: number) => {
    if (!photoDialog.data) return;

    const imageToRemove = photoDialog.data.images[index];
    const tempIndex = tempDialogImages.findIndex((t) => t.previewUrl === imageToRemove.imageUrl);

    if (tempIndex !== -1) {
      URL.revokeObjectURL(tempDialogImages[tempIndex].previewUrl);
      setTempDialogImages(tempDialogImages.filter((_, i) => i !== tempIndex));
    }

    const newImages = photoDialog.data.images.filter((_, i) => i !== index);
    setPhotoDialog({ ...photoDialog, data: { ...photoDialog.data, images: newImages } });
  };

  const handleSavePhotoDialog = async () => {
    if (!data || !photoDialog.data) return;

    const photoId = photoDialog.data.id;

    if (photoDialog.mode === "add") {
      setData({ ...data, photos: [...data.photos, photoDialog.data] });

      if (tempDialogImages.length > 0) {
        const newPendingImages: PendingImage[] = tempDialogImages.map((temp, index) => ({
          file: temp.file,
          previewUrl: temp.previewUrl,
          itemId: photoId,
          type: "photo" as const,
          imageIndex: photoDialog.data!.images.length - tempDialogImages.length + index,
        }));

        setPendingImages((prev) => [...prev, ...newPendingImages]);
        setTempDialogImages([]);
      } else {
        setPendingNewPhotoIds((prev) => new Set([...prev, photoId]));
      }

      setToast({ msg: "Photo ajoutée - N'oubliez pas d'enregistrer", type: "info" });
    } else {
      setUpdatingItem(photoId);
      try {
        let updatedPhoto = { ...photoDialog.data };
        const uploadedImages = [];

        for (const img of updatedPhoto.images) {
          const tempImg = tempDialogImages.find((t) => t.previewUrl === img.imageUrl);

          if (tempImg) {
            const compressedFile = await imageCompression(tempImg.file, COMPRESSION_OPTIONS);
            const formData = new FormData();
            formData.append("file", compressedFile);

            const res = await fetch("/api/cloudinary/uploadweb/realisationimage", {
              method: "POST",
              body: formData,
            });
            const resData = await res.json();

            if (!res.ok) throw new Error(resData.error || "Erreur upload");

            uploadedImages.push({ imageUrl: resData.imageUrl, imagePublicId: resData.imagePublicId });
            URL.revokeObjectURL(tempImg.previewUrl);
          } else {
            uploadedImages.push(img);
          }
        }

        updatedPhoto.images = uploadedImages;
        setTempDialogImages([]);

        const updatedPhotos = data.photos.map((p) => (p.id === photoId ? updatedPhoto : p));
        await updateDoc(doc(db, "website_content", "realisation_section"), { photos: updatedPhotos });

        setData({ ...data, photos: updatedPhotos });
        setToast({ msg: "Photo mise à jour !", type: "success" });
      } catch (e: any) {
        setToast({ msg: "Erreur de mise à jour", type: "error" });
      } finally {
        setUpdatingItem(null);
      }
    }

    setPhotoDialog({ open: false, mode: "add", data: null });
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!data) return;
    const photo = data.photos.find((p) => p.id === photoId);
    if (!photo) return;

    if (isPendingPhoto(photoId)) {
      const pendingForPhoto = pendingImages.filter((p) => p.itemId === photoId && p.type === "photo");
      pendingForPhoto.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPendingImages((prev) => prev.filter((p) => p.itemId !== photoId));

      setPendingNewPhotoIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(photoId);
        return newSet;
      });

      setData({ ...data, photos: data.photos.filter((p) => p.id !== photoId) });
      setToast({ msg: "Photo retirée", type: "success" });
      return;
    }

    setDeletingItem(photoId);
    try {
      for (const img of photo.images) {
        if (img.imagePublicId) {
          try {
            await fetch("/api/cloudinary/deleteweb", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ publicId: img.imagePublicId }),
            });
          } catch (e) {
            console.warn("⚠️ Erreur suppression Cloudinary:", e);
          }
        }
      }

      const updatedPhotos = data.photos.filter((p) => p.id !== photoId);
      await updateDoc(doc(db, "website_content", "realisation_section"), { photos: updatedPhotos });

      setData({ ...data, photos: updatedPhotos });
      setToast({ msg: "Photo supprimée !", type: "success" });
    } catch (e: any) {
      setToast({ msg: "Erreur de suppression", type: "error" });
    } finally {
      setDeletingItem(null);
    }
  };

  // === DIGITAL PROJECT HANDLERS ===
  const handleAddDigitalProject = () => {
    if (tempDialogImage) {
      URL.revokeObjectURL(tempDialogImage.previewUrl);
      setTempDialogImage(null);
    }

    setDigitalProjectDialog({
      open: true,
      mode: "add",
      data: {
        id: generateId(),
        title: "",
        description: "",
        projectUrl: "",
        image: "",
        imagePublicId: "",
        client: "autre",
        date: new Date().toISOString().split("T")[0],
        technologies: [],
      },
    });
  };

  const handleEditDigitalProject = (project: DigitalProjectItem) => {
    if (tempDialogImage) {
      URL.revokeObjectURL(tempDialogImage.previewUrl);
      setTempDialogImage(null);
    }
    setDigitalProjectDialog({ open: true, mode: "edit", data: { ...project } });
  };

  const handleCloseDigitalProjectDialog = () => {
    if (tempDialogImage) {
      URL.revokeObjectURL(tempDialogImage.previewUrl);
      setTempDialogImage(null);
    }
    setDigitalProjectDialog({ open: false, mode: "add", data: null });
  };

  const handleDigitalProjectDialogChange = (projectData: DigitalProjectItem) => {
    setDigitalProjectDialog({ ...digitalProjectDialog, data: projectData });
  };

  const handleDigitalProjectImageSelect = (file: File) => {
    if (!digitalProjectDialog.data) return;

    if (tempDialogImage) {
      URL.revokeObjectURL(tempDialogImage.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setTempDialogImage({ file, previewUrl });
    setDigitalProjectDialog({
      ...digitalProjectDialog,
      data: { ...digitalProjectDialog.data, image: previewUrl },
    });
  };

  const handleSaveDigitalProjectDialog = async () => {
    if (!data || !digitalProjectDialog.data) return;

    const projectId = digitalProjectDialog.data.id;

    if (digitalProjectDialog.mode === "add") {
      setData({ ...data, digitalProjects: [...data.digitalProjects, digitalProjectDialog.data] });

      if (tempDialogImage) {
        setPendingImages((prev) => [
          ...prev,
          {
            file: tempDialogImage.file,
            previewUrl: tempDialogImage.previewUrl,
            itemId: projectId,
            type: "digitalProject",
          },
        ]);
        setTempDialogImage(null);
      } else {
        setPendingNewDigitalProjectIds((prev) => new Set([...prev, projectId]));
      }

      setToast({ msg: "Projet ajouté - N'oubliez pas d'enregistrer", type: "info" });
    } else {
      setUpdatingItem(projectId);
      try {
        let updatedProject = { ...digitalProjectDialog.data };

        if (tempDialogImage) {
          const compressedFile = await imageCompression(tempDialogImage.file, COMPRESSION_OPTIONS);
          const formData = new FormData();
          formData.append("file", compressedFile);

          const existingProject = data.digitalProjects.find((p) => p.id === projectId);
          if (existingProject?.imagePublicId) {
            formData.append("publicId", existingProject.imagePublicId);
          }

          const res = await fetch("/api/cloudinary/uploadweb/realisationimage", {
            method: "POST",
            body: formData,
          });
          const resData = await res.json();

          if (!res.ok) throw new Error(resData.error || "Erreur upload");

          updatedProject = {
            ...updatedProject,
            image: resData.imageUrl,
            imagePublicId: resData.imagePublicId,
          };

          URL.revokeObjectURL(tempDialogImage.previewUrl);
          setTempDialogImage(null);
        }

        const updatedProjects = data.digitalProjects.map((p) => (p.id === projectId ? updatedProject : p));
        await updateDoc(doc(db, "website_content", "realisation_section"), { digitalProjects: updatedProjects });

        setData({ ...data, digitalProjects: updatedProjects });
        setToast({ msg: "Projet mis à jour !", type: "success" });
      } catch (e: any) {
        setToast({ msg: "Erreur de mise à jour", type: "error" });
      } finally {
        setUpdatingItem(null);
      }
    }

    setDigitalProjectDialog({ open: false, mode: "add", data: null });
  };

  const handleDeleteDigitalProject = async (projectId: string) => {
    if (!data) return;
    const project = data.digitalProjects.find((p) => p.id === projectId);
    if (!project) return;

    if (isPendingDigitalProject(projectId)) {
      const pendingImage = pendingImages.find((p) => p.itemId === projectId && p.type === "digitalProject");
      if (pendingImage) {
        URL.revokeObjectURL(pendingImage.previewUrl);
        setPendingImages((prev) => prev.filter((p) => p.itemId !== projectId));
      }

      setPendingNewDigitalProjectIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });

      setData({ ...data, digitalProjects: data.digitalProjects.filter((p) => p.id !== projectId) });
      setToast({ msg: "Projet retiré", type: "success" });
      return;
    }

    setDeletingItem(projectId);
    try {
      if (project.imagePublicId) {
        try {
          await fetch("/api/cloudinary/deleteweb", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicId: project.imagePublicId }),
          });
        } catch (e) {
          console.warn("⚠️ Erreur suppression Cloudinary:", e);
        }
      }

      const updatedProjects = data.digitalProjects.filter((p) => p.id !== projectId);
      await updateDoc(doc(db, "website_content", "realisation_section"), { digitalProjects: updatedProjects });

      setData({ ...data, digitalProjects: updatedProjects });
      setToast({ msg: "Projet supprimé !", type: "success" });
    } catch (e: any) {
      setToast({ msg: "Erreur de suppression", type: "error" });
    } finally {
      setDeletingItem(null);
    }
  };

  // === CANCEL ALL CHANGES ===
  const handleCancelAllChanges = () => {
    pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPendingImages([]);

    if (data) {
      const newData = {
        ...data,
        videos: data.videos.filter((v) => !pendingNewVideoIds.has(v.id)),
        photos: data.photos.filter(
          (p) => !pendingNewPhotoIds.has(p.id) && !pendingImages.some((pi) => pi.itemId === p.id && pi.type === "photo")
        ),
        digitalProjects: data.digitalProjects.filter(
          (dp) => !pendingNewDigitalProjectIds.has(dp.id) && !pendingImages.some((pi) => pi.itemId === dp.id && pi.type === "digitalProject")
        ),
      };
      setData(newData);
    }

    setPendingNewVideoIds(new Set());
    setPendingNewPhotoIds(new Set());
    setPendingNewDigitalProjectIds(new Set());

    setToast({ msg: "Modifications annulées", type: "info" });
  };

  // === LOADING ===
  if (loading || !data) {
    return <LoadingState />;
  }

  // === RENDER ===
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${THEME.neutral[50]} 0%, ${THEME.neutral[100]} 100%)`,
      }}
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.3)"
      borderRadius={3}
      overflow="hidden"
    >
      {/* Tabs Header */}
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

      {/* Preview Tab */}
      {tabValue === 0 && (
        <Fade in timeout={500}>
          <Box component="section">
            <Realisation />
          </Box>
        </Fade>
      )}

      {/* Editor Tab */}
      {tabValue === 1 && (
        <Fade in timeout={500}>
          <Box sx={{ maxWidth: 1600, mx: "auto", p: { xs: 1, sm: 2, md: 4 } }}>
            <EditBannier open={open} onClose={() => setOpen(false)} url="bannier_realisation" />

            <EditorHeader
              editorTab={editorTab}
              videosCount={data.videos.length}
              photosCount={data.photos.length}
              digitalProjectsCount={data.digitalProjects.length}
              totalPendingVideos={totalPendingVideos}
              totalPendingPhotos={totalPendingPhotos}
              totalPendingDigitalProjects={totalPendingDigitalProjects}
              hasChangesToSave={hasChangesToSave}
              totalPendingCount={totalPendingCount}
              pendingLabel={getPendingLabel()}
              saving={saving}
              isSmall={isSmall}
              onTabChange={setEditorTab}
              onSave={handleSave}
              onCancelChanges={handleCancelAllChanges}
            />

            {/* Videos Section */}
            {editorTab === "videos" && (
              <VideosSection
                videos={data.videos}
                totalPending={totalPendingVideos}
                isSmall={isSmall}
                isPendingVideo={isPendingVideo}
                updatingItem={updatingItem}
                deletingItem={deletingItem}
                onAdd={handleAddVideo}
                onEdit={handleEditVideo}
                onDelete={handleDeleteVideo}
              />
            )}

            {/* Photos Section */}
            {editorTab === "photos" && (
              <PhotosSection
                photos={data.photos}
                totalPending={totalPendingPhotos}
                isSmall={isSmall}
                isPendingPhoto={isPendingPhoto}
                updatingItem={updatingItem}
                deletingItem={deletingItem}
                onAdd={handleAddPhoto}
                onEdit={handleEditPhoto}
                onDelete={handleDeletePhoto}
              />
            )}

            {/* Digital Projects Section */}
            {editorTab === "digitalProjects" && (
              <DigitalProjectsSection
                projects={data.digitalProjects}
                totalPending={totalPendingDigitalProjects}
                isSmall={isSmall}
                isPendingProject={isPendingDigitalProject}
                updatingItem={updatingItem}
                deletingItem={deletingItem}
                onAdd={handleAddDigitalProject}
                onEdit={handleEditDigitalProject}
                onDelete={handleDeleteDigitalProject}
              />
            )}
          </Box>
        </Fade>
      )}

      {/* Dialogs */}
      <VideoDialog
        dialogState={videoDialog}
        isSmall={isSmall}
        isUpdating={updatingItem === videoDialog.data?.id}
        onClose={handleCloseVideoDialog}
        onSave={handleSaveVideoDialog}
        onChange={handleVideoDialogChange}
      />

      <PhotoDialog
        dialogState={photoDialog}
        tempImages={tempDialogImages}
        isSmall={isSmall}
        isUpdating={updatingItem === photoDialog.data?.id}
        onClose={handleClosePhotoDialog}
        onSave={handleSavePhotoDialog}
        onChange={handlePhotoDialogChange}
        onImagesSelect={handlePhotoImagesSelect}
        onRemoveImage={handleRemovePhotoImage}
      />

      <DigitalProjectDialog
        dialogState={digitalProjectDialog}
        tempImage={tempDialogImage}
        isSmall={isSmall}
        isUpdating={updatingItem === digitalProjectDialog.data?.id}
        onClose={handleCloseDigitalProjectDialog}
        onSave={handleSaveDigitalProjectDialog}
        onChange={handleDigitalProjectDialogChange}
        onImageSelect={handleDigitalProjectImageSelect}
      />

      {/* Toast */}
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