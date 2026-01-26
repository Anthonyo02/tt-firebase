// ============================================
// EDIT ABOUT MODAL - Modal principal d'édition
// ============================================

"use client";
import React, { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  useTheme,
  useMediaQuery,
  Avatar,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";

import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import CloseIcon from "@mui/icons-material/Close";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import {
  PageContent,
  PendingHeroImage,
  HeroImage,
  CardItem,
  ValueItem,
  CtaButton,
  EditAboutModalProps,
  ToastState,
} from "../../types/types";

import HeroImageSection from "./HeroImageSection";
import HistorySection from "./HistorySection";
import CardsSection from "./CardsSection";
import ValuesSection from "./ValuesSection";
import ApproachSection from "./ApproachSection";
import CtaSection from "./CtaSection";
import { COMPRESSION_OPTIONS, DEFAULT_DATA } from "@/types/constants";

const EditAboutModal: React.FC<EditAboutModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const [expanded, setExpanded] = useState<string | false>("panel0");

  // États
  const [formData, setFormData] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pendingHeroImage, setPendingHeroImage] = useState<PendingHeroImage | null>(null);

  // Firebase Sync
  useEffect(() => {
    if (!open) return;

    const docRef = doc(db, "website_content", "full_about");

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as PageContent;
          setFormData({
            image: {
              imageUrl: data.image?.imageUrl || DEFAULT_DATA.image.imageUrl,
              imageId: data.image?.imageId || DEFAULT_DATA.image.imageId,
              title: data.image?.title || DEFAULT_DATA.image.title,
              subTitle: data.image?.subTitle || DEFAULT_DATA.image.subTitle,
              color: data.image?.color || DEFAULT_DATA.image.color,
            },
            history: {
              subTitle: data.history?.subTitle || DEFAULT_DATA.history.subTitle,
              title: data.history?.title || DEFAULT_DATA.history.title,
              description: data.history?.description || DEFAULT_DATA.history.description,
              color: data.history?.color || DEFAULT_DATA.history.color,
            },
            cards: Array.isArray(data.cards)
              ? data.cards.map((c: any) => ({
                  title: c.title || "",
                  description: c.description || "",
                  color: c.color || "#616637",
                }))
              : DEFAULT_DATA.cards,
            values: {
              subTitle: data.values?.subTitle || DEFAULT_DATA.values.subTitle,
              title: data.values?.title || DEFAULT_DATA.values.title,
              color: data.values?.color || DEFAULT_DATA.values.color,
              items: Array.isArray(data.values?.items)
                ? data.values.items.map((v: any) => ({
                    title: v.title || "",
                    description: v.description || "",
                    color: v.color || "#616637",
                  }))
                : DEFAULT_DATA.values.items,
            },
            approach: {
              subTitle: data.approach?.subTitle || DEFAULT_DATA.approach.subTitle,
              title: data.approach?.title || DEFAULT_DATA.approach.title,
              description: data.approach?.description || DEFAULT_DATA.approach.description,
              color: data.approach?.color || DEFAULT_DATA.approach.color,
            },
            cta: {
              title: data.cta?.title || DEFAULT_DATA.cta.title,
              subTitle: data.cta?.subTitle || DEFAULT_DATA.cta.subTitle,
              color: data.cta?.color || DEFAULT_DATA.cta.color,
              buttons: Array.isArray(data.cta?.buttons)
                ? data.cta.buttons.map((b: any) => ({
                    label: b.label || "",
                    href: b.href || "#",
                    bgColor: b.bgColor || "#616637",
                    textColor: b.textColor || "#ffffff",
                  }))
                : DEFAULT_DATA.cta.buttons,
            },
          });
        } else {
          setDoc(docRef, DEFAULT_DATA);
          setFormData(DEFAULT_DATA);
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
  }, []);

  const handleChangePanel =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
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
      image: { ...formData.image, imageUrl: DEFAULT_DATA.image.imageUrl },
    });
    setPendingHeroImage(null);
    setToast({ msg: "Image en attente annulée", type: "info" });
  };

  const handleSimpleSectionChange = (
    section: "history" | "approach" | "cta",
    field: string,
    value: string
  ) => {
    if (!formData) return;
    setFormData({
      ...formData,
      [section]: { ...(formData[section] as object), [field]: value },
    });
    setHasChanges(true);
  };

  const handleCardChange = (
    index: number,
    field: keyof CardItem,
    value: string
  ) => {
    if (!formData) return;
    const newCards = [...formData.cards];
    newCards[index] = { ...newCards[index], [field]: value };
    setFormData({ ...formData, cards: newCards });
    setHasChanges(true);
  };

  const handleAddCard = () => {
    if (!formData) return;
    const newCard: CardItem = { title: "", description: "", color: "#616637" };
    setFormData({ ...formData, cards: [...formData.cards, newCard] });
    setHasChanges(true);
  };

  const handleRemoveCard = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      cards: formData.cards.filter((_, i) => i !== index),
    });
    setHasChanges(true);
  };

  const handleValuesHeaderChange = (field: string, value: string) => {
    if (!formData) return;
    setFormData({
      ...formData,
      values: { ...formData.values, [field]: value },
    });
    setHasChanges(true);
  };

  const handleValueItemChange = (
    index: number,
    field: keyof ValueItem,
    value: string
  ) => {
    if (!formData) return;
    const newItems = [...formData.values.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({
      ...formData,
      values: { ...formData.values, items: newItems },
    });
    setHasChanges(true);
  };

  const handleAddValueItem = () => {
    if (!formData) return;
    const newItem: ValueItem = { title: "", description: "", color: "#616637" };
    setFormData({
      ...formData,
      values: { ...formData.values, items: [...formData.values.items, newItem] },
    });
    setHasChanges(true);
  };

  const handleRemoveValueItem = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      values: {
        ...formData.values,
        items: formData.values.items.filter((_, i) => i !== index),
      },
    });
    setHasChanges(true);
  };

  const handleCtaButtonChange = (
    index: number,
    field: keyof CtaButton,
    value: string
  ) => {
    if (!formData) return;
    const newButtons = [...formData.cta.buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setFormData({ ...formData, cta: { ...formData.cta, buttons: newButtons } });
    setHasChanges(true);
  };

  const handleAddCtaButton = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      cta: {
        ...formData.cta,
        buttons: [
          ...formData.cta.buttons,
          { label: "Action", href: "#", bgColor: "#616637", textColor: "#ffffff" },
        ],
      },
    });
    setHasChanges(true);
  };

  const handleRemoveCtaButton = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      cta: {
        ...formData.cta,
        buttons: formData.cta.buttons.filter((_, i) => i !== index),
      },
    });
    setHasChanges(true);
  };

  // --- Sauvegarde ---
  const handleSubmit = async () => {
    if (!formData) return;
    setSaving(true);
    setUploading(!!pendingHeroImage);

    try {
      let finalImageData = { ...formData.image };

      if (pendingHeroImage) {
        try {
          const compressedFile = await imageCompression(
            pendingHeroImage.file,
            COMPRESSION_OPTIONS
          );

          const formDataUpload = new FormData();
          formDataUpload.append("file", compressedFile);

          if (formData.image.imageId) {
            formDataUpload.append("publicId", formData.image.imageId);
          }

          const res = await fetch("/api/cloudinary/uploadweb/fullabout", {
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
        } catch (uploadError: any) {
          console.error("Erreur upload image hero:", uploadError);
          setToast({ msg: "Erreur lors de l'upload de l'image", type: "error" });
          setSaving(false);
          setUploading(false);
          return;
        }
      }

      await updateDoc(doc(db, "website_content", "full_about"), {
        image: finalImageData,
        history: formData.history,
        cards: formData.cards,
        values: formData.values,
        approach: formData.approach,
        cta: formData.cta,
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
      if (
        window.confirm(
          "Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?"
        )
      ) {
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
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 300,
          }}
        >
          <Stack alignItems="center" spacing={2}>
            <CircularProgress sx={{ color: "#616637" }} />
            <Typography>Chargement...</Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        fullScreen={fullScreen}
        PaperProps={{
          sx: {
            borderRadius: fullScreen ? 0 : 4,
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          },
        }}
      >
        {/* --- HEADER --- */}
        <DialogTitle
          sx={{
            background:
              "linear-gradient(135deg, #818660 0%, #cdd1b3ff 50%, #6b7052 100%)",
            color: "#fff",
            py: { xs: 2, sm: 3 },
            px: { xs: 2, sm: 3 },
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 } }}>
              <Avatar
                sx={{
                  width: { xs: 40, sm: 50 },
                  height: { xs: 40, sm: 50 },
                  bgcolor: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <EditNoteIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
              </Avatar>
              <Box>
                <Typography
                  variant="h5"
                  fontWeight={800}
                  sx={{ fontSize: { xs: "1.1rem", sm: "1.5rem" } }}
                >
                  Éditer "À Propos"
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    mt: 0.5,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  Personnalisez le contenu de votre page
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              {(hasChanges || pendingHeroImage) && (
                <Chip
                  label={
                    isSmall
                      ? pendingHeroImage
                        ? "📷"
                        : "!"
                      : pendingHeroImage
                        ? "Image en attente"
                        : "Non sauvegardé"
                  }
                  size="small"
                  sx={{
                    bgcolor: pendingHeroImage ? "#ed6c02" : "rgba(255,255,255,0.2)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                  }}
                />
              )}
              <IconButton
                onClick={handleClose}
                sx={{
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,0.15)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
                }}
                size={isSmall ? "small" : "medium"}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>
        </DialogTitle>

        {/* --- CONTENT --- */}
        <DialogContent sx={{ p: 0, bgcolor: "#f8fafc" }}>
          <HeroImageSection
            formData={formData}
            pendingHeroImage={pendingHeroImage}
            expanded={expanded}
            isSmall={isSmall}
            onChangePanel={handleChangePanel}
            onHeroImageSelect={handleHeroImageSelect}
            onHeroImageChange={handleHeroImageChange}
            onCancelPendingHeroImage={handleCancelPendingHeroImage}
          />

          <HistorySection
            formData={formData}
            expanded={expanded}
            isSmall={isSmall}
            onChangePanel={handleChangePanel}
            onSectionChange={handleSimpleSectionChange}
          />

          <CardsSection
            formData={formData}
            expanded={expanded}
            isSmall={isSmall}
            onChangePanel={handleChangePanel}
            onCardChange={handleCardChange}
            onAddCard={handleAddCard}
            onRemoveCard={handleRemoveCard}
          />

          <ValuesSection
            formData={formData}
            expanded={expanded}
            isSmall={isSmall}
            onChangePanel={handleChangePanel}
            onValuesHeaderChange={handleValuesHeaderChange}
            onValueItemChange={handleValueItemChange}
            onAddValueItem={handleAddValueItem}
            onRemoveValueItem={handleRemoveValueItem}
          />

          <ApproachSection
            formData={formData}
            expanded={expanded}
            isSmall={isSmall}
            onChangePanel={handleChangePanel}
            onSectionChange={handleSimpleSectionChange}
          />

          <CtaSection
            formData={formData}
            expanded={expanded}
            isSmall={isSmall}
            onChangePanel={handleChangePanel}
            onCtaHeaderChange={handleSimpleSectionChange}
            onCtaButtonChange={handleCtaButtonChange}
            onAddCtaButton={handleAddCtaButton}
            onRemoveCtaButton={handleRemoveCtaButton}
          />
        </DialogContent>

        {/* --- FOOTER --- */}
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
              "&:disabled": {
                background: "#d1d5db",
                color: "#9ca3af",
              },
            }}
          >
            {saving
              ? uploading
                ? "Upload en cours..."
                : "Sauvegarde..."
              : pendingHeroImage
                ? "Enregistrer (1 image à uploader)"
                : "Sauvegarder"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- TOAST --- */}
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

export default EditAboutModal;