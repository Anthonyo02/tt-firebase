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
  CloudUpload as CloudUploadIcon,
  HourglassEmpty as PendingIcon,
  Close as CloseIcon,
  AutoAwesome as SparkleIcon,
  DragIndicator as DragIcon,
  Business as BusinessIcon,
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
import { Handshake } from "lucide-react";
import Partenaire from "./preview/Partners";

// --- Types ---
interface PartenaireItem {
  id: string;
  name: string;
  image: string;
  imagePublicId?: string;
  order: number;
}

interface PartenaireData {
  partenaires: PartenaireItem[];
}

interface PendingImage {
  file: File;
  previewUrl: string;
  itemId: string;
}

// --- Theme Colors ---
const THEME = {
  primary: {
    main: "#616637",
    light: "#8C915D",
    dark: "#3B3E21",
    gradient: "linear-gradient(135deg, #616637 0%, #3B3E21 100%)",
  },
  secondary: {
    main: "#EC4899",
    light: "#F472B6",
    dark: "#DB2777",
    gradient: "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)",
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
  maxSizeMB: 0.3,
  maxWidthOrHeight: 800,
  useWebWorker: true,
  fileType: "image/webp" as const,
};

// --- Helpers ---
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// --- Données statiques par défaut ---
const DEFAULT_PARTENAIRES: PartenaireItem[] = [
  {
    id: "p1",
    name: "Partenaire Alpha",
    image: "/logos/partner-1.png",
    imagePublicId: "",
    order: 1,
  },
  {
    id: "p2",
    name: "Partenaire Beta",
    image: "/logos/partner-2.png",
    imagePublicId: "",
    order: 2,
  },
  {
    id: "p3",
    name: "Partenaire Gamma",
    image: "/logos/partner-3.png",
    imagePublicId: "",
    order: 3,
  },
  {
    id: "p4",
    name: "Partenaire Delta",
    image: "/logos/partner-4.png",
    imagePublicId: "",
    order: 4,
  },
  {
    id: "p5",
    name: "Partenaire Epsilon",
    image: "/logos/partner-5.png",
    imagePublicId: "",
    order: 5,
  },
  {
    id: "p6",
    name: "Partenaire Zeta",
    image: "/logos/partner-6.png",
    imagePublicId: "",
    order: 6,
  },
];

const DEFAULT_DATA: PartenaireData = {
  partenaires: DEFAULT_PARTENAIRES,
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function PartenaireEditor() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // États
  const [data, setData] = useState<PartenaireData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  // Pending images
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  // Dialog pour ajout/édition
  const [partenaireDialog, setPartenaireDialog] = useState<{
    open: boolean;
    mode: "add" | "edit";
    data: PartenaireItem | null;
  }>({ open: false, mode: "add", data: null });

  // ============================================
  // FIREBASE SYNC
  // ============================================
  useEffect(() => {
    const docRef = doc(db, "website_content", "partenaire_section");

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = snapshot.data();
          const partenaireData: PartenaireData = {
            partenaires: Array.isArray(docData.partenaires)
              ? docData.partenaires
                  .map((p: any) => ({
                    id: p.id || generateId(),
                    name: p.name || "",
                    image: p.image || "",
                    imagePublicId: p.imagePublicId || "",
                    order: p.order || 0,
                  }))
                  .sort((a: PartenaireItem, b: PartenaireItem) => a.order - b.order)
              : DEFAULT_PARTENAIRES,
          };
          setData(partenaireData);
        } else {
          setDoc(docRef, DEFAULT_DATA);
          setData(DEFAULT_DATA);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Erreur Firebase:", error);
        setToast({ msg: "Erreur de connexion", type: "error" });
        setData(DEFAULT_DATA);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Cleanup des URLs blob
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
    [pendingImages]
  );

  const pendingCount = pendingImages.length;

  // ============================================
  // SAUVEGARDE AVEC UPLOAD CLOUDINARY
  // ============================================
  const handleSave = async () => {
    if (!data) return;
    setSaving(true);

    try {
      let finalData = { ...data };
      const uploadErrors: string[] = [];

      // Upload des images en attente
      for (const pending of pendingImages) {
        try {
          const compressedFile = await imageCompression(
            pending.file,
            COMPRESSION_OPTIONS
          );

          const formData = new FormData();
          formData.append("file", compressedFile);

          const existingPartenaire = data.partenaires.find(
            (p) => p.id === pending.itemId
          );
          if (existingPartenaire?.imagePublicId) {
            formData.append("publicId", existingPartenaire.imagePublicId);
          }

          const res = await fetch("/api/cloudinary/uploadweb/partners", {
            method: "POST",
            body: formData,
          });

          const resData = await res.json();

          if (!res.ok) {
            throw new Error(resData.error || "Erreur upload");
          }

          finalData.partenaires = finalData.partenaires.map((p) =>
            p.id === pending.itemId
              ? {
                  ...p,
                  image: resData.imageUrl,
                  imagePublicId: resData.imagePublicId,
                }
              : p
          );

          URL.revokeObjectURL(pending.previewUrl);
        } catch (e: any) {
          console.error("❌ Erreur upload image:", e);
          uploadErrors.push(pending.file.name);
        }
      }

      setPendingImages([]);
      setData(finalData);

      await updateDoc(doc(db, "website_content", "partenaire_section"), {
        partenaires: finalData.partenaires,
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
    }
  };

  // ============================================
  // ACTIONS PARTENAIRES
  // ============================================
  const handleAddPartenaire = () => {
    const maxOrder = data?.partenaires.length
      ? Math.max(...data.partenaires.map((p) => p.order))
      : 0;

    setPartenaireDialog({
      open: true,
      mode: "add",
      data: {
        id: generateId(),
        name: "",
        image: "",
        imagePublicId: "",
        order: maxOrder + 1,
      },
    });
  };

  const handleEditPartenaire = (partenaire: PartenaireItem) => {
    setPartenaireDialog({ open: true, mode: "edit", data: { ...partenaire } });
  };

  const handleSavePartenaireDialog = () => {
    if (!data || !partenaireDialog.data) return;

    if (partenaireDialog.mode === "add") {
      setData({
        ...data,
        partenaires: [...data.partenaires, partenaireDialog.data].sort(
          (a, b) => a.order - b.order
        ),
      });
    } else {
      setData({
        ...data,
        partenaires: data.partenaires
          .map((p) =>
            p.id === partenaireDialog.data!.id ? partenaireDialog.data! : p
          )
          .sort((a, b) => a.order - b.order),
      });
    }
    setPartenaireDialog({ open: false, mode: "add", data: null });
    setToast({ msg: "N'oubliez pas d'enregistrer", type: "info" });
  };

  const handleDeletePartenaire = async (partenaireId: string) => {
    if (!data) return;
    const partenaire = data.partenaires.find((p) => p.id === partenaireId);
    if (!partenaire) return;

    setDeletingItem(partenaireId);
    try {
      // Supprimer l'image de Cloudinary si elle existe
      if (partenaire.imagePublicId && !isPendingImage(partenaire.image)) {
        try {
          await fetch("/api/cloudinary/deleteweb", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicId: partenaire.imagePublicId }),
          });
        } catch (e) {
          console.warn("⚠️ Erreur suppression Cloudinary:", e);
        }
      }

      // Nettoyer les pending images
      const pendingToRemove = pendingImages.filter(
        (p) => p.itemId === partenaireId
      );
      pendingToRemove.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPendingImages((prev) => prev.filter((p) => p.itemId !== partenaireId));

      setData({
        ...data,
        partenaires: data.partenaires.filter((p) => p.id !== partenaireId),
      });
      setToast({ msg: "Partenaire supprimé", type: "success" });
    } catch (e) {
      console.error("❌ Erreur suppression:", e);
      setToast({ msg: "Erreur suppression", type: "error" });
    } finally {
      setDeletingItem(null);
    }
  };

  const handlePartenaireImageSelect = (file: File) => {
    if (!partenaireDialog.data) return;

    const previewUrl = URL.createObjectURL(file);

    setPendingImages((prev) => [
      ...prev.filter((p) => p.itemId !== partenaireDialog.data!.id),
      { file, previewUrl, itemId: partenaireDialog.data!.id },
    ]);

    setPartenaireDialog({
      ...partenaireDialog,
      data: { ...partenaireDialog.data!, image: previewUrl },
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
        // minHeight: "100vh",
        background: `linear-gradient(180deg, ${THEME.neutral[50]} 0%, ${THEME.neutral[100]} 100%)`,
      }}
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.3)"
      borderRadius={3}
      overflow="hidden"
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
                  badgeContent={pendingCount}
                  sx={{
                    "& .MuiBadge-badge": {
                      background: THEME.accent.orange,
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
            <Partenaire />
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
              {/* Titre */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Handshake
                  style={{ width: 28, height: 28, color: THEME.primary.main }}
                />
                <Box>
                  <Typography variant="h6" fontWeight={700} color={THEME.neutral[800]}>
                    Gestion des Partenaires
                  </Typography>
                  <Typography variant="body2" color={THEME.neutral[500]}>
                    {data.partenaires.length} partenaire(s) enregistré(s)
                  </Typography>
                </Box>
              </Box>

              {/* Actions */}
              <Stack direction="row" spacing={2} alignItems="center">
                {pendingCount > 0 && (
                  <Chip
                    icon={<PendingIcon sx={{ fontSize: 16 }} />}
                    label={`${pendingCount} image(s) en attente`}
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
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddPartenaire}
                  sx={{
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: THEME.primary.main,
                    color: THEME.primary.main,
                    "&:hover": {
                      borderColor: THEME.primary.dark,
                      bgcolor: alpha(THEME.primary.main, 0.05),
                    },
                  }}
                >
                  Ajouter
                </Button>
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
                        : "0 4px 14px rgba(97, 102, 55, 0.4)",
                    "&:hover": {
                      transform: "translateY(-2px)",
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

            {/* ========== LISTE DES PARTENAIRES ========== */}
            <Grid container spacing={3}>
              {data.partenaires.map((partenaire, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={partenaire.id}>
                  <Grow in timeout={300 + index * 100}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 3,
                        overflow: "hidden",
                        border: isPendingImage(partenaire.image)
                          ? `2px dashed ${THEME.accent.orange}`
                          : `1px solid ${THEME.neutral[200]}`,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-8px)",
                          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                        },
                      }}
                    >
                      {/* Image */}
                      <Box sx={{ position: "relative" }}>
                        {isPendingImage(partenaire.image) && (
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
                        {/* Badge Ordre */}
                        <Chip
                          label={`#${partenaire.order}`}
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            zIndex: 5,
                            bgcolor: alpha(THEME.primary.main, 0.9),
                            color: "white",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                          }}
                        />
                        <CardMedia
                          sx={{
                            height: 160,
                            bgcolor: THEME.neutral[100],
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            p: 3,
                          }}
                        >
                          {partenaire.image ? (
                            <Box
                              component="img"
                              src={partenaire.image}
                              alt={partenaire.name}
                              sx={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                              }}
                            />
                          ) : (
                            <BusinessIcon
                              sx={{ fontSize: 60, color: THEME.neutral[300] }}
                            />
                          )}
                        </CardMedia>
                      </Box>

                      <CardContent sx={{ flex: 1, p: 2.5 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            color: THEME.neutral[800],
                            textAlign: "center",
                          }}
                          noWrap
                        >
                          {partenaire.name || "Sans nom"}
                        </Typography>
                      </CardContent>

                      <Divider />

                      <Stack
                        direction="row"
                        justifyContent="center"
                        spacing={1}
                        sx={{ p: 1.5, bgcolor: THEME.neutral[50] }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleEditPartenaire(partenaire)}
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
                          onClick={() => handleDeletePartenaire(partenaire.id)}
                          disabled={deletingItem === partenaire.id}
                          sx={{
                            color: "#EF4444",
                            bgcolor: alpha("#EF4444", 0.1),
                            "&:hover": { bgcolor: alpha("#EF4444", 0.2) },
                          }}
                        >
                          {deletingItem === partenaire.id ? (
                            <CircularProgress size={16} sx={{ color: "#EF4444" }} />
                          ) : (
                            <DeleteIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Stack>
                    </Card>
                  </Grow>
                </Grid>
              ))}

              {/* Empty State */}
              {data.partenaires.length === 0 && (
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
                        bgcolor: alpha(THEME.primary.main, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 3,
                      }}
                    >
                      <Handshake
                        style={{ width: 40, height: 40, color: THEME.primary.main }}
                      />
                    </Box>
                    <Typography variant="h6" sx={{ color: THEME.neutral[700], mb: 1 }}>
                      Aucun partenaire
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: THEME.neutral[500], mb: 3 }}
                    >
                      Commencez par ajouter votre premier partenaire
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddPartenaire}
                      sx={{
                        background: THEME.primary.gradient,
                        textTransform: "none",
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                      }}
                    >
                      Ajouter un partenaire
                    </Button>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        </Fade>
      )}

      {/* ========== DIALOG PARTENAIRE ========== */}
      <Dialog
        open={partenaireDialog.open}
        onClose={() =>
          setPartenaireDialog({ open: false, mode: "add", data: null })
        }
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <DialogTitle
          sx={{
            background: THEME.primary.gradient,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Handshake style={{ width: 24, height: 24 }} />
            <Typography variant="h6" fontWeight={600}>
              {partenaireDialog.mode === "add"
                ? "Nouveau partenaire"
                : "Modifier le partenaire"}
            </Typography>
          </Stack>
          <IconButton
            onClick={() =>
              setPartenaireDialog({ open: false, mode: "add", data: null })
            }
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {partenaireDialog.data && (
            <Stack spacing={3}>
              {/* Image Upload */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Logo / Image
                </Typography>
                <Box
                  sx={{
                    width: "100%",
                    height: 180,
                    bgcolor: THEME.neutral[100],
                    borderRadius: 3,
                    overflow: "hidden",
                    position: "relative",
                    border: isPendingImage(partenaireDialog.data.image)
                      ? `2px dashed ${THEME.accent.orange}`
                      : `2px dashed ${THEME.neutral[300]}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    "&:hover": { borderColor: THEME.primary.main },
                  }}
                >
                  {partenaireDialog.data.image ? (
                    <>
                      <Box
                        component="img"
                        src={partenaireDialog.data.image}
                        alt="Logo"
                        sx={{
                          maxWidth: "80%",
                          maxHeight: "80%",
                          objectFit: "contain",
                        }}
                      />
                      {isPendingImage(partenaireDialog.data.image) && (
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
                    <Stack alignItems="center" gap={1}>
                      <CloudUploadIcon
                        sx={{ fontSize: 48, color: THEME.neutral[400] }}
                      />
                      <Typography variant="body2" color={THEME.neutral[500]}>
                        Glissez un logo ici
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
                    borderColor: THEME.primary.main,
                    color: THEME.primary.main,
                    "&:hover": {
                      bgcolor: alpha(THEME.primary.main, 0.1),
                      borderColor: THEME.primary.main,
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
                      handlePartenaireImageSelect(e.target.files[0])
                    }
                  />
                </Button>
              </Box>

              {/* Nom */}
              <TextField
                label="Nom du partenaire"
                fullWidth
                value={partenaireDialog.data.name}
                onChange={(e) =>
                  setPartenaireDialog({
                    ...partenaireDialog,
                    data: { ...partenaireDialog.data!, name: e.target.value },
                  })
                }
                placeholder="Ex: Entreprise XYZ"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />

              {/* Ordre */}
              <TextField
                label="Ordre d'affichage"
                type="number"
                fullWidth
                value={partenaireDialog.data.order}
                onChange={(e) =>
                  setPartenaireDialog({
                    ...partenaireDialog,
                    data: {
                      ...partenaireDialog.data!,
                      order: parseInt(e.target.value) || 0,
                    },
                  })
                }
                helperText="Les partenaires sont affichés par ordre croissant"
                InputProps={{
                  startAdornment: (
                    <DragIcon sx={{ mr: 1, color: THEME.neutral[400] }} />
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions
          sx={{ p: 3, borderTop: `1px solid ${THEME.neutral[200]}` }}
        >
          <Button
            onClick={() =>
              setPartenaireDialog({ open: false, mode: "add", data: null })
            }
            sx={{ textTransform: "none", color: THEME.neutral[600], px: 3 }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSavePartenaireDialog}
            disabled={!partenaireDialog.data?.name}
            sx={{
              background: THEME.primary.gradient,
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              borderRadius: 2,
            }}
          >
            {partenaireDialog.mode === "add" ? "Ajouter" : "Enregistrer"}
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