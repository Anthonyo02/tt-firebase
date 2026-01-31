// components/realisation/hooks/usePendingItems.ts

import { useState, useCallback, useMemo } from "react";
import { PendingImage } from "../types";

interface UsePendingItemsReturn {
  pendingImages: PendingImage[];
  pendingNewVideoIds: Set<string>;
  pendingNewPhotoIds: Set<string>;
  pendingNewDigitalProjectIds: Set<string>;
  
  // Actions
  addPendingImage: (image: PendingImage) => void;
  addPendingImages: (images: PendingImage[]) => void;
  removePendingImage: (itemId: string, type?: "photo" | "digitalProject") => void;
  addPendingVideoId: (id: string) => void;
  removePendingVideoId: (id: string) => void;
  addPendingPhotoId: (id: string) => void;
  removePendingPhotoId: (id: string) => void;
  addPendingDigitalProjectId: (id: string) => void;
  removePendingDigitalProjectId: (id: string) => void;
  clearAllPending: () => void;
  
  // Checks
  isPendingVideo: (id: string) => boolean;
  isPendingPhoto: (id: string) => boolean;
  isPendingDigitalProject: (id: string) => boolean;
  
  // Counts
  totalPendingVideos: number;
  totalPendingPhotos: number;
  totalPendingDigitalProjects: number;
  totalPendingCount: number;
  hasChangesToSave: boolean;
  
  // Labels
  getPendingLabel: () => string;
}

export const usePendingItems = (): UsePendingItemsReturn => {
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [pendingNewVideoIds, setPendingNewVideoIds] = useState<Set<string>>(new Set());
  const [pendingNewPhotoIds, setPendingNewPhotoIds] = useState<Set<string>>(new Set());
  const [pendingNewDigitalProjectIds, setPendingNewDigitalProjectIds] = useState<Set<string>>(new Set());

  // Actions pour les images
  const addPendingImage = useCallback((image: PendingImage) => {
    setPendingImages((prev) => [...prev, image]);
  }, []);

  const addPendingImages = useCallback((images: PendingImage[]) => {
    setPendingImages((prev) => [...prev, ...images]);
  }, []);

  const removePendingImage = useCallback((itemId: string, type?: "photo" | "digitalProject") => {
    setPendingImages((prev) => {
      const toRemove = prev.filter((p) => 
        p.itemId === itemId && (type ? p.type === type : true)
      );
      toRemove.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return prev.filter((p) => 
        !(p.itemId === itemId && (type ? p.type === type : true))
      );
    });
  }, []);

  // Actions pour les vidéos
  const addPendingVideoId = useCallback((id: string) => {
    setPendingNewVideoIds((prev) => new Set([...prev, id]));
  }, []);

  const removePendingVideoId = useCallback((id: string) => {
    setPendingNewVideoIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  // Actions pour les photos
  const addPendingPhotoId = useCallback((id: string) => {
    setPendingNewPhotoIds((prev) => new Set([...prev, id]));
  }, []);

  const removePendingPhotoId = useCallback((id: string) => {
    setPendingNewPhotoIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  // Actions pour les projets digitaux
  const addPendingDigitalProjectId = useCallback((id: string) => {
    setPendingNewDigitalProjectIds((prev) => new Set([...prev, id]));
  }, []);

  const removePendingDigitalProjectId = useCallback((id: string) => {
    setPendingNewDigitalProjectIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  // Clear all
  const clearAllPending = useCallback(() => {
    pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPendingImages([]);
    setPendingNewVideoIds(new Set());
    setPendingNewPhotoIds(new Set());
    setPendingNewDigitalProjectIds(new Set());
  }, [pendingImages]);

  // Checks
  const isPendingVideo = useCallback(
    (id: string) => pendingNewVideoIds.has(id),
    [pendingNewVideoIds]
  );

  const isPendingPhoto = useCallback(
    (id: string) => {
      return (
        pendingNewPhotoIds.has(id) ||
        pendingImages.some((p) => p.itemId === id && p.type === "photo")
      );
    },
    [pendingNewPhotoIds, pendingImages]
  );

  const isPendingDigitalProject = useCallback(
    (id: string) => {
      return (
        pendingNewDigitalProjectIds.has(id) ||
        pendingImages.some((p) => p.itemId === id && p.type === "digitalProject")
      );
    },
    [pendingNewDigitalProjectIds, pendingImages]
  );

  // Counts
  const totalPendingVideos = pendingNewVideoIds.size;

  const totalPendingPhotos = useMemo(() => {
    return new Set([
      ...pendingImages.filter((p) => p.type === "photo").map((p) => p.itemId),
      ...Array.from(pendingNewPhotoIds),
    ]).size;
  }, [pendingImages, pendingNewPhotoIds]);

  const totalPendingDigitalProjects = useMemo(() => {
    return new Set([
      ...pendingImages.filter((p) => p.type === "digitalProject").map((p) => p.itemId),
      ...Array.from(pendingNewDigitalProjectIds),
    ]).size;
  }, [pendingImages, pendingNewDigitalProjectIds]);

  const totalPendingCount = totalPendingVideos + totalPendingPhotos + totalPendingDigitalProjects;
  const hasChangesToSave = totalPendingCount > 0;

  // Label
  const getPendingLabel = useCallback((): string => {
    const parts: string[] = [];

    if (totalPendingVideos > 0) {
      parts.push(`${totalPendingVideos} vidéo${totalPendingVideos > 1 ? "s" : ""}`);
    }

    if (totalPendingPhotos > 0) {
      parts.push(`${totalPendingPhotos} photo${totalPendingPhotos > 1 ? "s" : ""}`);
    }

    if (totalPendingDigitalProjects > 0) {
      parts.push(`${totalPendingDigitalProjects} projet${totalPendingDigitalProjects > 1 ? "s" : ""}`);
    }

    if (parts.length === 0) return "";

    return `${parts.join(", ")} en attente`;
  }, [totalPendingVideos, totalPendingPhotos, totalPendingDigitalProjects]);

  return {
    pendingImages,
    pendingNewVideoIds,
    pendingNewPhotoIds,
    pendingNewDigitalProjectIds,
    addPendingImage,
    addPendingImages,
    removePendingImage,
    addPendingVideoId,
    removePendingVideoId,
    addPendingPhotoId,
    removePendingPhotoId,
    addPendingDigitalProjectId,
    removePendingDigitalProjectId,
    clearAllPending,
    isPendingVideo,
    isPendingPhoto,
    isPendingDigitalProject,
    totalPendingVideos,
    totalPendingPhotos,
    totalPendingDigitalProjects,
    totalPendingCount,
    hasChangesToSave,
    getPendingLabel,
  };
};