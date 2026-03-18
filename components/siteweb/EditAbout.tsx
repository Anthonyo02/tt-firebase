// ============================================
// EDIT ABOUT SECTION - Section À Propos (inline accordion)
// Avec upload/delete Cloudinary
// ============================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import imageCompression from "browser-image-compression";
import {
  Box,
  Button,
  Stack,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Grid,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ImageIcon from "@mui/icons-material/Image";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import StyledTextField from "../about/StyledTextField";
import AccordionHeader from "../about/AccordionHeader";
import { safeAlpha } from "../ui/utils";
import { COMPRESSION_OPTIONS } from "@/types/constants";

// ============================================
// Types
// ============================================

interface FeatureData {
  icon: string;
  title: string;
  description: string;
}

interface ImageData {
  imageUrl: string;
  imageId: string;
}

interface AboutData {
  tagline: string;
  title: string;
  description: string;
  experienceYears: string;
  images: ImageData[];
  features: FeatureData[];
}

interface PendingImage {
  index: number;
  file: File;
  previewUrl: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

// ============================================
// Constantes
// ============================================

const DEFAULT_DATA: AboutData = {
  tagline: "",
  title: "",
  description: "",
  experienceYears: "",
  images: [],
  features: [],
};

const SECTION_COLOR = "#616637";

const SUB_SECTIONS = [
  {
    id: "general",
    label: "Informations générales",
    icon: InfoOutlinedIcon,
    color: "#616637",
    description: "Tagline, titre, description, expérience",
  },
  {
    id: "features",
    label: "Features",
    icon: AutoAwesomeIcon,
    color: "#2e7d32",
    description: "Caractéristiques et points forts",
  },
  {
    id: "images",
    label: "Images",
    icon: ImageIcon,
    color: "#1565c0",
    description: "Galerie d'images de la section",
  },
];

// ============================================
// Composant principal
// ============================================

export default function EditAboutSection({ open, onClose }: Props) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const [formData, setFormData] = useState<AboutData | null>(null);
  const [originalImages, setOriginalImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expanded, setExpanded] = useState<string | false>(false);
  const [subExpanded, setSubExpanded] = useState<string | false>("general");

  // Pending images
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const addFileInputRef = useRef<HTMLInputElement | null>(null);

  // Index de l'image en cours de suppression (pour le spinner)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  // ========================
  // Firebase Sync
  // ========================

  useEffect(() => {
    const ref = doc(db, "website_content", "about_section");

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();

          let images: ImageData[] = [];
          if (Array.isArray(data.images)) {
            images = data.images.map((img: any) => {
              if (typeof img === "string") {
                return { imageUrl: img, imageId: "" };
              }
              return {
                imageUrl: img.imageUrl || "",
                imageId: img.imageId || "",
              };
            });
          }

          setFormData({
            tagline: data.tagline || "",
            title: data.title || "",
            description: data.description || "",
            experienceYears: data.experienceYears || "",
            images,
            features: Array.isArray(data.features) ? data.features : [],
          });
          setOriginalImages(images);
        } else {
          setDoc(ref, DEFAULT_DATA);
          setFormData(DEFAULT_DATA);
          setOriginalImages([]);
        }
        setLoading(false);
        setHasChanges(false);

        setPendingImages((prev) => {
          prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
          return [];
        });
      },
      (error) => {
        console.error("Erreur Firebase:", error);
        setToast({ msg: "Erreur de connexion", type: "error" });
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  // ========================
  // Handlers généraux
  // ========================

  const handleChange = (field: keyof AboutData, value: any) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
    setHasChanges(true);
  };

  // --- Features ---
  const handleFeatureChange = (
    index: number,
    field: keyof FeatureData,
    value: string
  ) => {
    if (!formData) return;
    const updated = [...formData.features];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, features: updated });
    setHasChanges(true);
  };

  const addFeature = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      features: [
        ...formData.features,
        { icon: "Target", title: "", description: "" },
      ],
    });
    setHasChanges(true);
  };

  const removeFeature = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
    setHasChanges(true);
  };

  // ========================
  // Image Handlers
  // ========================

  const isPendingImage = (index: number): boolean => {
    return pendingImages.some((p) => p.index === index);
  };

  const handleImageFileSelect = (index: number, file: File) => {
    if (!formData) return;

    const existing = pendingImages.find((p) => p.index === index);
    if (existing) {
      URL.revokeObjectURL(existing.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);

    setPendingImages((prev) => [
      ...prev.filter((p) => p.index !== index),
      { index, file, previewUrl },
    ]);

    const updated = [...formData.images];
    updated[index] = { ...updated[index], imageUrl: previewUrl };
    setFormData({ ...formData, images: updated });
    setHasChanges(true);

    setToast({
      msg: "Image sélectionnée. Cliquez sur 'Sauvegarder' pour confirmer.",
      type: "info",
    });
  };

  const handleAddNewImage = (file: File) => {
    if (!formData) return;

    const previewUrl = URL.createObjectURL(file);
    const newIndex = formData.images.length;

    setPendingImages((prev) => [
      ...prev,
      { index: newIndex, file, previewUrl },
    ]);

    setFormData({
      ...formData,
      images: [...formData.images, { imageUrl: previewUrl, imageId: "" }],
    });
    setHasChanges(true);

    setToast({
      msg: "Image ajoutée. Cliquez sur 'Sauvegarder' pour confirmer.",
      type: "info",
    });
  };

  const cancelPendingImage = (index: number) => {
    const pending = pendingImages.find((p) => p.index === index);
    if (!pending || !formData) return;

    URL.revokeObjectURL(pending.previewUrl);
    setPendingImages((prev) => prev.filter((p) => p.index !== index));

    const updated = [...formData.images];

    if (index < originalImages.length) {
      updated[index] = { ...originalImages[index] };
      setFormData({ ...formData, images: updated });
    } else {
      const newImages = updated.filter((_, i) => i !== index);
      setFormData({ ...formData, images: newImages });

      setPendingImages((prev) =>
        prev.map((p) => ({
          ...p,
          index: p.index > index ? p.index - 1 : p.index,
        }))
      );
    }

    setToast({ msg: "Image en attente annulée", type: "info" });
  };

  // ========================
  // SUPPRESSION IMAGE (Cloudinary + Firestore)
  // Même logique que handleDeletePartenaire
  // ========================

  const removeImage = async (index: number) => {
    if (!formData) return;

    const imageToDelete = formData.images[index];
    const hasPending = isPendingImage(index);

    setDeletingIndex(index);

    try {
      // 1. Si l'image a un imageId Cloudinary ET n'est PAS une pending image
      //    → Supprimer de Cloudinary
      if (imageToDelete.imageId && !hasPending) {
        try {
          const res = await fetch("/api/cloudinary/deleteweb", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicId: imageToDelete.imageId }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            console.warn("⚠️ Erreur suppression Cloudinary:", errorData);
            // On continue quand même la suppression locale
          }
        } catch (cloudinaryError) {
          console.warn("⚠️ Erreur appel Cloudinary:", cloudinaryError);
          // On continue quand même
        }
      }

      // 2. Nettoyer la pending image si c'en est une
      if (hasPending) {
        const pending = pendingImages.find((p) => p.index === index);
        if (pending) {
          URL.revokeObjectURL(pending.previewUrl);
        }
      }

      // 3. Supprimer des pending et réindexer
      setPendingImages((prev) =>
        prev
          .filter((p) => p.index !== index)
          .map((p) => ({
            ...p,
            index: p.index > index ? p.index - 1 : p.index,
          }))
      );

      // 4. Supprimer du formData local
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData({ ...formData, images: newImages });

      // 5. Mettre à jour Firestore immédiatement
      //    (seulement si l'image existait déjà dans Firestore, pas une pending)
      if (!hasPending) {
        await updateDoc(doc(db, "website_content", "about_section"), {
          images: newImages,
        });
        setToast({ msg: "Image supprimée définitivement", type: "success" });
      } else {
        setToast({ msg: "Image en attente retirée", type: "info" });
        setHasChanges(true);
      }
    } catch (error: any) {
      console.error("❌ Erreur suppression:", error);
      setToast({
        msg: error.message || "Erreur lors de la suppression",
        type: "error",
      });
    } finally {
      setDeletingIndex(null);
    }
  };

  // ========================
  // Save (upload Cloudinary)
  // ========================

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);

    const hasPendingUploads = pendingImages.length > 0;
    setUploading(hasPendingUploads);

    try {
      let finalImages = [...formData.images];
      const uploadErrors: string[] = [];

      // Upload des pending images vers Cloudinary
      if (hasPendingUploads) {
        for (const pending of pendingImages) {
          try {
            const compressedFile = await imageCompression(
              pending.file,
              COMPRESSION_OPTIONS
            );

            const formDataUpload = new FormData();
            formDataUpload.append("file", compressedFile);

            const existingImageId = finalImages[pending.index]?.imageId;
            if (existingImageId) {
              formDataUpload.append("publicId", existingImageId);
            }

            const res = await fetch(
              "/api/cloudinary/uploadweb/about_section",
              {
                method: "POST",
                body: formDataUpload,
              }
            );

            const resData = await res.json();

            if (!res.ok) {
              throw new Error(resData.error || "Erreur upload");
            }

            finalImages[pending.index] = {
              imageUrl: resData.imageUrl,
              imageId: resData.imagePublicId || resData.publicId || "",
            };

            URL.revokeObjectURL(pending.previewUrl);
          } catch (uploadError: any) {
            console.error(
              `❌ Erreur upload image ${pending.index}:`,
              uploadError
            );
            uploadErrors.push(pending.file.name);
          }
        }

        setPendingImages([]);
      }

      // Sauvegarder dans Firestore
      await updateDoc(doc(db, "website_content", "about_section"), {
        tagline: formData.tagline,
        title: formData.title,
        description: formData.description,
        experienceYears: formData.experienceYears,
        features: formData.features,
        images: finalImages,
      });

      setFormData({ ...formData, images: finalImages });
      setOriginalImages(finalImages);

      if (uploadErrors.length > 0) {
        setToast({
          msg: `${uploadErrors.length} image(s) non uploadée(s)`,
          type: "warning",
        });
      } else {
        setToast({ msg: "Modifications enregistrées !", type: "success" });
      }

      setHasChanges(false);
    } catch (error: any) {
      console.error("Erreur sauvegarde:", error);
      setToast({
        msg: error.message || "Erreur de sauvegarde",
        type: "error",
      });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  // ========================
  // Panel handlers
  // ========================

  const handleMainPanel = (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? "about" : false);
  };

  const handleSubPanel =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setSubExpanded(isExpanded ? panel : false);
    };

  // ========================
  // Loading
  // ========================

  if (loading || !formData) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 6,
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress sx={{ color: SECTION_COLOR }} />
          <Typography variant="body2" color="text.secondary">
            Chargement...
          </Typography>
        </Stack>
      </Box>
    );
  }

  // ========================
  // Render
  // ========================

  return (
    <>
      <Accordion
        expanded={expanded === "about"}
        onChange={handleMainPanel}
        elevation={0}
        sx={{
          borderBottom: "1px solid #e2e8f0",
          "&::before": { display: "none" },
          "&.Mui-expanded": {
            bgcolor: safeAlpha(SECTION_COLOR, 0.02),
          },
        }}
      >
        <AccordionSummary
          expandIcon={
            <ExpandMoreIcon
              sx={{
                color: expanded === "about" ? SECTION_COLOR : "inherit",
                fontSize: { xs: 20, sm: 24 },
              }}
            />
          }
          sx={{ px: { xs: 2, sm: 3 }, py: 1 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              width: "100%",
            }}
          >
            <Box
              sx={{
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor:
                  expanded === "about"
                    ? safeAlpha(SECTION_COLOR, 0.15)
                    : "#f1f5f9",
                color: expanded === "about" ? SECTION_COLOR : "#94a3b8",
                transition: "all 0.3s",
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography
                fontWeight={700}
                sx={{
                  fontSize: { xs: "0.85rem", sm: "1rem" },
                  color: expanded === "about" ? SECTION_COLOR : "#334155",
                }}
              >
                Section &quot;À Propos&quot;
              </Typography>
              {!isSmall && (
                <Typography
                  variant="body2"
                  sx={{ color: "#94a3b8", fontSize: "0.75rem", mt: 0.25 }}
                >
                  Tagline, titre, features et images
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={0.5}>
              {pendingImages.length > 0 && (
                <Chip
                  icon={<HourglassEmptyIcon sx={{ fontSize: 12 }} />}
                  label={`${pendingImages.length} image(s)`}
                  size="small"
                  sx={{
                    bgcolor: "#ed6c02",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "0.6rem",
                    height: 22,
                  }}
                />
              )}
              {hasChanges && (
                <Chip
                  label="Modifié"
                  size="small"
                  sx={{
                    bgcolor: safeAlpha(SECTION_COLOR, 0.1),
                    color: SECTION_COLOR,
                    fontWeight: 600,
                    fontSize: "0.65rem",
                    height: 22,
                  }}
                />
              )}
            </Stack>
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 3, sm: 4 } }}>
          <Stack spacing={2}>
            {/* ========== GÉNÉRAL ========== */}
            <Accordion
              expanded={subExpanded === "general"}
              onChange={handleSubPanel("general")}
              elevation={0}
              sx={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px !important",
                overflow: "hidden",
                "&::before": { display: "none" },
                "&.Mui-expanded": {
                  bgcolor: safeAlpha(SUB_SECTIONS[0].color, 0.02),
                },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <InfoOutlinedIcon
                    sx={{ color: SUB_SECTIONS[0].color, fontSize: 20 }}
                  />
                  <Typography fontWeight={600} fontSize="0.9rem">
                    Informations générales
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pb: 3 }}>
                <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      isSmall={isSmall}
                      fullWidth
                      label="Tagline"
                      value={formData.tagline}
                      onChange={(e: any) =>
                        handleChange("tagline", e.target.value)
                      }
                      placeholder="Ex: Notre histoire"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      isSmall={isSmall}
                      fullWidth
                      label="Titre"
                      value={formData.title}
                      onChange={(e: any) =>
                        handleChange("title", e.target.value)
                      }
                      placeholder="Ex: Qui sommes-nous ?"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <StyledTextField
                      isSmall={isSmall}
                      fullWidth
                      multiline
                      rows={isSmall ? 3 : 4}
                      label="Description"
                      value={formData.description}
                      onChange={(e: any) =>
                        handleChange("description", e.target.value)
                      }
                      placeholder="Décrivez votre entreprise..."
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <StyledTextField
                      isSmall={isSmall}
                      fullWidth
                      label="Années d'expérience"
                      value={formData.experienceYears}
                      onChange={(e: any) =>
                        handleChange("experienceYears", e.target.value)
                      }
                      placeholder="Ex: 15+"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* ========== FEATURES ========== */}
            <Accordion
              expanded={subExpanded === "features"}
              onChange={handleSubPanel("features")}
              elevation={0}
              sx={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px !important",
                overflow: "hidden",
                "&::before": { display: "none" },
                "&.Mui-expanded": {
                  bgcolor: safeAlpha(SUB_SECTIONS[1].color, 0.02),
                },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    width: "100%",
                  }}
                >
                  <AutoAwesomeIcon
                    sx={{ color: SUB_SECTIONS[1].color, fontSize: 20 }}
                  />
                  <Typography fontWeight={600} fontSize="0.9rem">
                    Features
                  </Typography>
                  <Chip
                    label={formData.features.length}
                    size="small"
                    sx={{
                      ml: "auto",
                      bgcolor: safeAlpha(SUB_SECTIONS[1].color, 0.1),
                      color: SUB_SECTIONS[1].color,
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      height: 22,
                    }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pb: 3 }}>
                <Stack spacing={2}>
                  {formData.features.map((f, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 2,
                        border: "1px solid #e2e8f0",
                        bgcolor: "#fafafa",
                        position: "relative",
                        transition: "all 0.2s",
                        "&:hover": {
                          borderColor: SUB_SECTIONS[1].color,
                          bgcolor: "#fff",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1.5,
                        }}
                      >
                        <Chip
                          label={`Feature ${index + 1}`}
                          size="small"
                          sx={{
                            bgcolor: safeAlpha(SUB_SECTIONS[1].color, 0.1),
                            color: SUB_SECTIONS[1].color,
                            fontWeight: 600,
                            fontSize: "0.7rem",
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeFeature(index)}
                          sx={{
                            color: "#ef4444",
                            "&:hover": { bgcolor: "rgba(239,68,68,0.08)" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Grid container spacing={{ xs: 1, sm: 2 }}>
                        <Grid item xs={12} sm={3}>
                          <StyledTextField
                            isSmall={isSmall}
                            fullWidth
                            label="Icône"
                            value={f.icon}
                            onChange={(e: any) =>
                              handleFeatureChange(index, "icon", e.target.value)
                            }
                            placeholder="Ex: Target"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <StyledTextField
                            isSmall={isSmall}
                            fullWidth
                            label="Titre"
                            value={f.title}
                            onChange={(e: any) =>
                              handleFeatureChange(
                                index,
                                "title",
                                e.target.value
                              )
                            }
                            placeholder="Titre de la feature"
                          />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                          <StyledTextField
                            isSmall={isSmall}
                            fullWidth
                            label="Description"
                            value={f.description}
                            onChange={(e: any) =>
                              handleFeatureChange(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="Description courte"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                  <Button
                    onClick={addFeature}
                    startIcon={<AddIcon />}
                    variant="outlined"
                    fullWidth
                    sx={{
                      borderRadius: 2,
                      borderStyle: "dashed",
                      textTransform: "none",
                      fontWeight: 600,
                      color: SUB_SECTIONS[1].color,
                      borderColor: safeAlpha(SUB_SECTIONS[1].color, 0.4),
                      "&:hover": {
                        borderColor: SUB_SECTIONS[1].color,
                        bgcolor: safeAlpha(SUB_SECTIONS[1].color, 0.04),
                      },
                    }}
                  >
                    Ajouter une feature
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* ========== IMAGES ========== */}
            <Accordion
              expanded={subExpanded === "images"}
              onChange={handleSubPanel("images")}
              elevation={0}
              sx={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px !important",
                overflow: "hidden",
                "&::before": { display: "none" },
                "&.Mui-expanded": {
                  bgcolor: safeAlpha(SUB_SECTIONS[2].color, 0.02),
                },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    width: "100%",
                  }}
                >
                  <ImageIcon
                    sx={{ color: SUB_SECTIONS[2].color, fontSize: 20 }}
                  />
                  <Typography fontWeight={600} fontSize="0.9rem">
                    Images
                  </Typography>
                  <Chip
                    label={formData.images.length}
                    size="small"
                    sx={{
                      ml: "auto",
                      bgcolor: safeAlpha(SUB_SECTIONS[2].color, 0.1),
                      color: SUB_SECTIONS[2].color,
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      height: 22,
                    }}
                  />
                  {pendingImages.length > 0 && (
                    <Chip
                      icon={<HourglassEmptyIcon sx={{ fontSize: 12 }} />}
                      label={`${pendingImages.length} en attente`}
                      size="small"
                      sx={{
                        bgcolor: "#ed6c02",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "0.65rem",
                        height: 22,
                      }}
                    />
                  )}
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ px: 2, pb: 3 }}>
                <Stack spacing={2.5}>
                  {/* Barre de progression */}
                  {uploading && (
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.75rem",
                          color: "#ed6c02",
                          mb: 0.5,
                          fontWeight: 600,
                        }}
                      >
                        Upload des images vers Cloudinary...
                      </Typography>
                      <LinearProgress
                        sx={{
                          borderRadius: 2,
                          bgcolor: safeAlpha("#ed6c02", 0.1),
                          "& .MuiLinearProgress-bar": { bgcolor: "#ed6c02" },
                        }}
                      />
                    </Box>
                  )}

                  {/* Grille d'images */}
                  <Grid container spacing={2}>
                    {formData.images.map((img, index) => {
                      const hasPending = isPendingImage(index);
                      const isDeleting = deletingIndex === index;

                      return (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Box
                            sx={{
                              borderRadius: 3,
                              border: hasPending
                                ? "3px dashed #ed6c02"
                                : `2px dashed ${SUB_SECTIONS[2].color}`,
                              overflow: "hidden",
                              bgcolor: "#f8fafc",
                              transition: "all 0.3s ease",
                              position: "relative",
                              opacity: isDeleting ? 0.5 : 1,
                              "&:hover": {
                                borderColor: hasPending
                                  ? "#ed6c02"
                                  : SUB_SECTIONS[2].color,
                                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                                transform: isDeleting
                                  ? "none"
                                  : "translateY(-2px)",
                              },
                            }}
                          >
                            {/* Zone de prévisualisation */}
                            <Box
                              sx={{
                                width: "100%",
                                aspectRatio: "16/10",
                                bgcolor: "#f1f5f9",
                                position: "relative",
                                overflow: "hidden",
                              }}
                            >
                              {img.imageUrl ? (
                                <>
                                  <Box
                                    component="img"
                                    src={img.imageUrl}
                                    alt={`Image ${index + 1}`}
                                    sx={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      display: "block",
                                    }}
                                    onError={(e: any) => {
                                      e.target.style.display = "none";
                                    }}
                                  />

                                  {/* Badge "Non enregistrée" */}
                                  {hasPending && (
                                    <Chip
                                      icon={
                                        <HourglassEmptyIcon
                                          sx={{ fontSize: 13 }}
                                        />
                                      }
                                      label="Non enregistrée"
                                      size="small"
                                      onDelete={() =>
                                        cancelPendingImage(index)
                                      }
                                      sx={{
                                        position: "absolute",
                                        top: 8,
                                        left: 8,
                                        bgcolor: "#ed6c02",
                                        color: "#fff",
                                        fontWeight: 600,
                                        fontSize: "0.6rem",
                                        height: 24,
                                        "& .MuiChip-deleteIcon": {
                                          color: "#fff",
                                          fontSize: 14,
                                          "&:hover": { color: "#ffcdd2" },
                                        },
                                      }}
                                    />
                                  )}

                                  {/* Numéro */}
                                  <Chip
                                    label={`${index + 1}`}
                                    size="small"
                                    sx={{
                                      position: "absolute",
                                      top: 8,
                                      right: 8,
                                      bgcolor: "rgba(0,0,0,0.6)",
                                      color: "#fff",
                                      fontWeight: 700,
                                      fontSize: "0.7rem",
                                      height: 24,
                                      minWidth: 24,
                                    }}
                                  />
                                </>
                              ) : (
                                <Stack
                                  alignItems="center"
                                  justifyContent="center"
                                  sx={{ height: "100%", gap: 0.5 }}
                                >
                                  <ImageIcon
                                    sx={{ fontSize: 40, color: "#94a3b8" }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ fontSize: "0.75rem" }}
                                  >
                                    Aucune image
                                  </Typography>
                                </Stack>
                              )}
                            </Box>

                            {/* Barre d'actions */}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                p: 1,
                                bgcolor: "#fff",
                                borderTop: "1px solid #e2e8f0",
                              }}
                            >
                              <Button
                                component="label"
                                variant="outlined"
                                size="small"
                                fullWidth
                                disabled={saving || isDeleting}
                                startIcon={
                                  hasPending ? (
                                    <HourglassEmptyIcon
                                      sx={{ fontSize: 14 }}
                                    />
                                  ) : (
                                    <CloudUploadIcon sx={{ fontSize: 14 }} />
                                  )
                                }
                                sx={{
                                  minHeight: 32,
                                  px: 1.2,
                                  py: 0.5,
                                  fontSize: "0.7rem",
                                  borderRadius: 1.5,
                                  textTransform: "none",
                                  fontWeight: 600,
                                  borderColor: hasPending
                                    ? "#ed6c02"
                                    : SUB_SECTIONS[2].color,
                                  color: hasPending
                                    ? "#ed6c02"
                                    : SUB_SECTIONS[2].color,
                                  "& .MuiButton-startIcon": {
                                    marginRight: 0.5,
                                  },
                                  "&:hover": {
                                    bgcolor: hasPending
                                      ? "#ed6c02"
                                      : "#e3f2fd",
                                    color: hasPending
                                      ? "#ffffff"
                                      : SUB_SECTIONS[2].color,
                                    borderColor: hasPending
                                      ? "#ed6c02"
                                      : SUB_SECTIONS[2].color,
                                  },
                                }}
                              >
                                {hasPending
                                  ? "Changer"
                                  : img.imageUrl
                                  ? "Remplacer"
                                  : "Choisir"}
                                <input
                                  hidden
                                  accept="image/*"
                                  type="file"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleImageFileSelect(
                                        index,
                                        e.target.files[0]
                                      );
                                    }
                                    e.target.value = "";
                                  }}
                                />
                              </Button>

                              <IconButton
                                size="small"
                                onClick={() => removeImage(index)}
                                disabled={saving || isDeleting}
                                sx={{
                                  color: "#ef4444",
                                  flexShrink: 0,
                                  border: "1px solid",
                                  borderColor: "rgba(239,68,68,0.3)",
                                  borderRadius: 1.5,
                                  width: 32,
                                  height: 32,
                                  "&:hover": {
                                    bgcolor: "rgba(239,68,68,0.08)",
                                    borderColor: "#ef4444",
                                  },
                                }}
                              >
                                {isDeleting ? (
                                  <CircularProgress
                                    size={14}
                                    sx={{ color: "#ef4444" }}
                                  />
                                ) : (
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                )}
                              </IconButton>
                            </Box>
                          </Box>
                        </Grid>
                      );
                    })}

                    {/* Carte d'ajout */}
                    <Grid item xs={12} sm={6} md={4}>
                      <Button
                        component="label"
                        disabled={saving}
                        sx={{
                          width: "100%",
                          aspectRatio: "16/10",
                          borderRadius: 3,
                          border: `2px dashed ${safeAlpha(
                            SUB_SECTIONS[2].color,
                            0.4
                          )}`,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                          bgcolor: safeAlpha(SUB_SECTIONS[2].color, 0.02),
                          textTransform: "none",
                          transition: "all 0.3s ease",
                          cursor: "pointer",
                          "&:hover": {
                            borderColor: SUB_SECTIONS[2].color,
                            bgcolor: safeAlpha(SUB_SECTIONS[2].color, 0.06),
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                          },
                          "&:disabled": {
                            opacity: 0.5,
                            cursor: "not-allowed",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            bgcolor: safeAlpha(SUB_SECTIONS[2].color, 0.1),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <AddIcon
                            sx={{
                              fontSize: 24,
                              color: SUB_SECTIONS[2].color,
                            }}
                          />
                        </Box>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            color: SUB_SECTIONS[2].color,
                          }}
                        >
                          Ajouter une image
                        </Typography>
                        <Typography
                          sx={{ fontSize: "0.65rem", color: "#94a3b8" }}
                        >
                          Cliquez pour sélectionner
                        </Typography>
                        <input
                          hidden
                          accept="image/*"
                          type="file"
                          ref={addFileInputRef}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleAddNewImage(e.target.files[0]);
                            }
                            if (addFileInputRef.current) {
                              addFileInputRef.current.value = "";
                            }
                          }}
                        />
                      </Button>
                    </Grid>
                  </Grid>

                  {formData.images.length === 0 && (
                    <Typography
                      variant="body2"
                      textAlign="center"
                      sx={{ color: "#94a3b8", fontSize: "0.8rem", py: 2 }}
                    >
                      Aucune image ajoutée. Cliquez sur le bouton ci-dessus.
                    </Typography>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* ========== BOUTON SAUVEGARDER ========== */}
            {(hasChanges || pendingImages.length > 0) && (
              <Box
                sx={{ display: "flex", justifyContent: "flex-end", pt: 1 }}
              >
                <Button
                  onClick={handleSave}
                  variant="contained"
                  disabled={saving}
                  startIcon={
                    saving ? (
                      <CircularProgress size={16} sx={{ color: "white" }} />
                    ) : pendingImages.length > 0 ? (
                      <CloudUploadIcon />
                    ) : (
                      <CheckCircleIcon />
                    )
                  }
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: { xs: 3, sm: 4 },
                    background:
                      pendingImages.length > 0
                        ? "linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)"
                        : "linear-gradient(135deg, #818660 0%, rgb(168, 171, 149) 50%, #989e7a 100%)",
                    boxShadow:
                      pendingImages.length > 0
                        ? "0 4px 14px rgba(237, 108, 2, 0.4)"
                        : "0 4px 14px rgba(99, 102, 241, 0.4)",
                    "&:hover": {
                      boxShadow:
                        pendingImages.length > 0
                          ? "0 6px 20px rgba(237, 108, 2, 0.5)"
                          : "0 6px 20px rgba(99, 102, 241, 0.5)",
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
                    : pendingImages.length > 0
                    ? `Enregistrer (${pendingImages.length} image${
                        pendingImages.length > 1 ? "s" : ""
                      })`
                    : "Sauvegarder les modifications"}
                </Button>
              </Box>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

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
}