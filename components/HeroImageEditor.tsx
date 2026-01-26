// ============================================
// EDIT SERVICE BANNER MODAL - Modal d'édition bannière
// ============================================

"use client";
import React, { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import {
  Stack,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
} from "@mui/material";

import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import { COMPRESSION_OPTIONS } from "@/types/constants";
import {
  EditModalProps,
  HeroImage,
  PendingHeroImage,
  ToastState,
} from "@/types/types";
import HeroImageSection from "./about/HeroImageSection";

// Type simplifié pour la bannière service
interface BannerContent {
  image: HeroImage;
}

// Données par défaut pour la bannière
const DEFAULT_BANNER_DATA: BannerContent = {
  image: {
    imageUrl: "",
    imageId: "",
    title: "",
    subTitle: "",
    color: "#616637",
  },
};

const EditBannier: React.FC<EditModalProps > = ({ open, onClose ,url }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const [expanded, setExpanded] = useState<string | false>(false);

  // États
  const [formData, setFormData] = useState<BannerContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pendingHeroImage, setPendingHeroImage] = useState<PendingHeroImage | null>(null);

  // Firebase Sync
  useEffect(() => {
    if (!open) return;

    const docRef = doc(db, "website_content", `${url}`);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setFormData({
            image: {
              imageUrl: data.image?.imageUrl || DEFAULT_BANNER_DATA.image.imageUrl,
              imageId: data.image?.imageId || DEFAULT_BANNER_DATA.image.imageId,
              title: data.image?.title || DEFAULT_BANNER_DATA.image.title,
              subTitle: data.image?.subTitle || DEFAULT_BANNER_DATA.image.subTitle,
              color: data.image?.color || DEFAULT_BANNER_DATA.image.color,
            },
          });
        } else {
          // DEFAULT_BANNER_DATA only contains the banner image portion.
          // Cast to any to satisfy Firestore document typing that may
          // expect a fuller PageContent shape elsewhere in the app.
          setDoc(docRef, DEFAULT_BANNER_DATA as any);
          setFormData(DEFAULT_BANNER_DATA);
        }
        setLoading(false);
        setHasChanges(false);
      },
      (error) => {
        console.error("Erreur Firebase:", error);
        setToast({ msg: "Erreur de connexion", type: "error" });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [open]);

  // Cleanup des blob URLs
  useEffect(() => {
    return () => {
      if (pendingHeroImage) {
        URL.revokeObjectURL(pendingHeroImage.previewUrl);
      }
    };
  }, [pendingHeroImage]);

  const handleChangePanel = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  // --- Gestionnaires ---
  const handleHeroImageSelect = (file: File) => {
    if (!formData) return;
    if (pendingHeroImage) {
      URL.revokeObjectURL(pendingHeroImage.previewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setPendingHeroImage({ file, previewUrl });
    setFormData({
      ...formData,
      image: { ...formData.image, imageUrl: previewUrl },
    });
    setHasChanges(true);
    setToast({
      msg: "Image sélectionnée. Cliquez sur 'Sauvegarder' pour confirmer.",
      type: "info",
    });
  };

  const handleHeroImageChange = (field: keyof HeroImage, value: string) => {
    if (!formData) return;
    setFormData({
      ...formData,
      image: { ...formData.image, [field]: value },
    });
    setHasChanges(true);
  };

  const handleCancelPendingHeroImage = () => {
    if (!formData || !pendingHeroImage) return;
    URL.revokeObjectURL(pendingHeroImage.previewUrl);
    setFormData({
      ...formData,
      image: { ...formData.image, imageUrl: DEFAULT_BANNER_DATA.image.imageUrl },
    });
    setPendingHeroImage(null);
    setToast({ msg: "Image en attente annulée", type: "info" });
  };

  // --- Sauvegarde ---
  const handleSubmit = async () => {
    if (!formData) return;
    setSaving(true);
    setUploading(!!pendingHeroImage);

    try {
      let finalImageData = { ...formData.image };

      if (pendingHeroImage) {
        const compressedFile = await imageCompression(pendingHeroImage.file, COMPRESSION_OPTIONS);

        const formDataUpload = new FormData();
        formDataUpload.append("file", compressedFile);

        if (formData.image.imageId) {
          formDataUpload.append("publicId", formData.image.imageId);
        }

        const res = await fetch(`/api/cloudinary/uploadweb/${url}`, {
          method: "POST",
          body: formDataUpload,
        });

        const resData = await res.json();

        if (!res.ok) {
          throw new Error(resData.error || "Erreur upload");
        }

        finalImageData = {
          ...finalImageData,
          imageUrl: resData.imageUrl,
          imageId: resData.imagePublicId || resData.publicId || "",
        };

        URL.revokeObjectURL(pendingHeroImage.previewUrl);
        setPendingHeroImage(null);
      }

      // Sauvegarde uniquement l'image (pas les autres champs qui n'existent pas)
      await updateDoc(doc(db, "website_content", `${url}`), {
        image: finalImageData,
      });

      setFormData({ ...formData, image: finalImageData });
      setToast({ msg: "Sauvegarde réussie !", type: "success" });
      setHasChanges(false);
    } catch (error: any) {
      console.error("Erreur sauvegarde:", error);
      setToast({ msg: error.message || "Erreur de sauvegarde", type: "error" });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm("Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?")) {
        if (pendingHeroImage) {
          URL.revokeObjectURL(pendingHeroImage.previewUrl);
          setPendingHeroImage(null);
        }
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Loading state
  if (loading || !formData) {
    return (
      // <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress sx={{ color: "#616637" }} />
            <Typography>Chargement...</Typography>
          </Stack>
        </DialogContent>
      // </Dialog>
    );
  }

  return (
    <>
      <DialogContent sx={{ p: 0, bgcolor: "#f8fafc" }}>
        <HeroImageSection
          formData={formData as any}
          pendingHeroImage={pendingHeroImage}
          expanded={expanded}
          isSmall={isSmall}
          onChangePanel={handleChangePanel}
          onHeroImageSelect={handleHeroImageSelect}
          onHeroImageChange={handleHeroImageChange}
          onCancelPendingHeroImage={handleCancelPendingHeroImage}
        />

        {expanded && (
          <DialogActions
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              bgcolor: "#fff",
              borderTop: "1px solid #e2e8f0",
              gap: { xs: 1, sm: 1.5 },
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Button
              onClick={handleClose}
              variant="outlined"
              fullWidth={isSmall}
              size={isSmall ? "small" : "medium"}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: { xs: 2, sm: 3 },
                order: { xs: 2, sm: 1 },
                borderColor: "#e2e8f0",
                color: "#64748b",
                "&:hover": { bgcolor: "#f8fafc", borderColor: "#cbd5e1" },
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              fullWidth={isSmall}
              size={isSmall ? "small" : "medium"}
              disabled={saving || (!hasChanges && !pendingHeroImage)}
              startIcon={
                saving ? (
                  <CircularProgress size={16} sx={{ color: "white" }} />
                ) : pendingHeroImage ? (
                  <CloudUploadIcon />
                ) : (
                  <CheckCircleIcon />
                )
              }
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: { xs: 2, sm: 4 },
                order: { xs: 1, sm: 2 },
                background:
                  hasChanges || pendingHeroImage
                    ? pendingHeroImage
                      ? "linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)"
                      : "linear-gradient(135deg, #818660 0%, rgb(168, 171, 149) 50%, #989e7a 100%)"
                    : "#9ca3af",
                boxShadow:
                  hasChanges || pendingHeroImage
                    ? pendingHeroImage
                      ? "0 4px 14px rgba(237, 108, 2, 0.4)"
                      : "0 4px 14px rgba(99, 102, 241, 0.4)"
                    : "none",
                "&:hover": {
                  boxShadow:
                    hasChanges || pendingHeroImage
                      ? pendingHeroImage
                        ? "0 6px 20px rgba(237, 108, 2, 0.5)"
                        : "0 6px 20px rgba(99, 102, 241, 0.5)"
                      : "none",
                },
                "&:disabled": { background: "#d1d5db", color: "#9ca3af" },
              }}
            >
              {saving
                ? uploading
                  ? "Upload en cours..."
                  : "Sauvegarde..."
                : pendingHeroImage
                  ? "Enregistrer (1 image)"
                  : "Sauvegarder"}
            </Button>
          </DialogActions>
        )}
      </DialogContent>

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
    </>
  );
};

export default EditBannier;