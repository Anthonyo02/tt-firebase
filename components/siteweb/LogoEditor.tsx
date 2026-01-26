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
  Tooltip,
} from "@mui/material";

// Import du composant preview
import { Handshake } from "lucide-react";
import Partenaire from "./preview/Partners";
import LogoList from "../LogoList";

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
];

const DEFAULT_DATA: PartenaireData = {
  partenaires: DEFAULT_PARTENAIRES,
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function LogoEditor() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // État pour la modal principale
  const [modalOpen, setModalOpen] = useState(false);

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
    const docRef = doc(db, "website_content", "logo");

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
                  .sort(
                    (a: PartenaireItem, b: PartenaireItem) => a.order - b.order
                  )
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

          const res = await fetch("/api/cloudinary/uploadweb/logo", {
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

      await updateDoc(doc(db, "website_content", "logo"), {
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
      setToast({ msg: "logo supprimé", type: "success" });
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

  // Fermer la modal principale
  const handleCloseModal = () => {
    if (pendingCount > 0) {
      setToast({
        msg: "Attention: des images non sauvegardées seront perdues",
        type: "warning",
      });
    }
    setModalOpen(false);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      {/* ========== BOUTON DÉCLENCHEUR ========== */}
      <Tooltip title="Gérer les Logo" arrow>
        <Button
          variant="contained"
          startIcon={<Handshake style={{ width: 20, height: 20 }} />}
          onClick={() => setModalOpen(true)}
          sx={{
            background: THEME.primary.gradient,
            textTransform: "none",
            fontWeight: 600,
            // px: 3,
            // py: 1.5,
            borderRadius: 2,
            boxShadow: "0 4px 14px rgba(97, 102, 55, 0.3)",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 6px 20px rgba(97, 102, 55, 0.4)",
            },
            transition: "all 0.3s ease",
          }}
          size="small"
        >
          Gérer les logo
          {pendingCount > 0 && (
            <Chip
              size="small"
              label={pendingCount}
              sx={{
                ml: 1,
                bgcolor: THEME.accent.orange,
                color: "white",
                fontWeight: 700,
                // height: 22,
                // minWidth: 22,
              }}
            />
          )}
        </Button>
      </Tooltip>

      {/* ========== MODAL PRINCIPALE ========== */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        // maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            overflow: "hidden",
            maxHeight: isMobile ? "100%" : "90vh",
          },
        }}
      >
        {/* Header de la modal */}
        <DialogTitle
          sx={{
            p: 0,
            background: alpha("#616637", 0.95),
            borderBottom: `1px solid ${THEME.neutral[200]}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 3,
              py: 1,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: alpha("#fff", 0.15),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Handshake style={{ width: 24, height: 24, color: "white" }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} color="white">
                  Gestion des logo
                </Typography>
                <Typography variant="caption" sx={{ color: alpha("#fff", 0.7) }}>
                 <span style={{fontWeight:"bold"}}>{data?.partenaires.length || 0}</span>  logo disponible
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={handleCloseModal} sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Tabs */}
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{
              px: 3,
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: "3px 3px 0 0",
                background: "white",
              },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                minHeight: 48,
                color: alpha("#fff", 0.7),
                "&.Mui-selected": { color: "white" },
              },
            }}
          >
            <Tab
              icon={<PreviewIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Aperçu"
            />
            <Tab
              icon={
                <Badge
                  badgeContent={pendingCount}
                  sx={{
                    "& .MuiBadge-badge": {
                      background: THEME.accent.orange,
                      color: "white",
                      fontSize: "0.65rem",
                    },
                  }}
                >
                  <EditIcon sx={{ fontSize: 18 }} />
                </Badge>
              }
              iconPosition="start"
              label="Éditeur"
            />
          </Tabs>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 0,
            background: `linear-gradient(180deg, ${THEME.neutral[50]} 0%, ${THEME.neutral[100]} 100%)`,
          }}
        >
          {/* Loading State */}
          {loading || !data ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 400,
              }}
            >
              <Stack alignItems="center" spacing={3}>
                <Box sx={{ position: "relative", width: 60, height: 60 }}>
                  <CircularProgress
                    size={60}
                    thickness={2}
                    sx={{ color: THEME.primary.main }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <SparkleIcon
                      sx={{ fontSize: 24, color: THEME.primary.main }}
                    />
                  </Box>
                </Box>
                <Typography variant="body1" color={THEME.neutral[500]}>
                  Chargement...
                </Typography>
              </Stack>
            </Box>
          ) : (
            <>
              {/* ========== VUE APERÇU ========== */}
              {tabValue === 0 && (
                <Fade in timeout={500}>
                  <Box component="section">
                    <LogoList />
                  </Box>
                </Fade>
              )}

              {/* ========== VUE ÉDITEUR ========== */}
              {tabValue === 1 && (
                <Fade in timeout={500}>
                  <Box sx={{ p: { xs: 2, md: 3 } }}>
                    {/* TOP BAR */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: 2,
                        background: "white",
                        border: `1px solid ${THEME.neutral[200]}`,
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "stretch", sm: "center" },
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        color={THEME.neutral[600]}
                        fontWeight={500}
                      >
                        {data.partenaires.length} logo enregistré
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        flexWrap="wrap"
                      >
                        {pendingCount > 0 && (
                          <Chip
                            icon={<PendingIcon sx={{ fontSize: 14 }} />}
                            label={`${pendingCount} en attente`}
                            onDelete={handleCancelPendingImages}
                            size="small"
                            sx={{
                              bgcolor: alpha(THEME.accent.orange, 0.1),
                              color: THEME.accent.orange,
                              fontWeight: 600,
                              "& .MuiChip-deleteIcon": {
                                color: THEME.accent.orange,
                              },
                            }}
                          />
                        )}
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={handleAddPartenaire}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            borderColor: THEME.primary.main,
                            color: THEME.primary.main,
                          }}
                        >
                          Ajouter
                        </Button>
                      </Stack>
                    </Paper>

                    {/* ========== LISTE DES PARTENAIRES ========== */}
                    <Grid container spacing={2}>
                      {data.partenaires.map((partenaire, index) => (
                        <Grid
                          item
                          xs={6}
                          sm={4}
                          md={3}
                          lg={4}
                          key={partenaire.id}
                        >
                          <Grow in timeout={200 + index * 50}>
                            <Card
                              sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                borderRadius: 2,
                                overflow: "hidden",
                                border: isPendingImage(partenaire.image)
                                  ? `2px dashed ${THEME.accent.orange}`
                                  : `1px solid ${THEME.neutral[200]}`,
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  transform: "translateY(-4px)",
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                                },
                              }}
                            >
                              {/* Image */}
                              <Box sx={{ position: "relative" }}>
                                {isPendingImage(partenaire.image) && (
                                  <Chip
                                    label="⏳"
                                    size="small"
                                    sx={{
                                      position: "absolute",
                                      top: 6,
                                      left: 6,
                                      zIndex: 5,
                                      bgcolor: THEME.accent.orange,
                                      color: "white",
                                      height: 20,
                                      fontSize: "0.7rem",
                                    }}
                                  />
                                )}
                                <Chip
                                  label={`#${partenaire.order}`}
                                  size="small"
                                  sx={{
                                    position: "absolute",
                                    top: 6,
                                    right: 6,
                                    zIndex: 5,
                                    bgcolor: alpha(THEME.primary.main, 0.9),
                                    color: "white",
                                    fontWeight: 700,
                                    fontSize: "0.65rem",
                                    height: 20,
                                  }}
                                />
                                <CardMedia
                                  sx={{
                                    height: 100,
                                    bgcolor: THEME.neutral[100],
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    p: 2,
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
                                      sx={{
                                        fontSize: 40,
                                        color: THEME.neutral[300],
                                      }}
                                    />
                                  )}
                                </CardMedia>
                              </Box>

                              <CardContent sx={{ flex: 1, p: 1.5, pb: 1 }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    color: THEME.neutral[700],
                                    textAlign: "center",
                                    display: "block",
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
                                spacing={0.5}
                                sx={{ p: 1, bgcolor: THEME.neutral[50] }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleEditPartenaire(partenaire)
                                  }
                                  sx={{
                                    color: THEME.primary.main,
                                    p: 0.5,
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleDeletePartenaire(partenaire.id)
                                  }
                                  disabled={deletingItem === partenaire.id}
                                  sx={{
                                    color: "#EF4444",
                                    p: 0.5,
                                  }}
                                >
                                  {deletingItem === partenaire.id ? (
                                    <CircularProgress
                                      size={14}
                                      sx={{ color: "#EF4444" }}
                                    />
                                  ) : (
                                    <DeleteIcon sx={{ fontSize: 16 }} />
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
                              p: 4,
                              textAlign: "center",
                              borderRadius: 2,
                              bgcolor: "white",
                              border: `2px dashed ${THEME.neutral[300]}`,
                            }}
                          >
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: "50%",
                                bgcolor: alpha(THEME.primary.main, 0.1),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mx: "auto",
                                mb: 2,
                              }}
                            >
                              <Handshake
                                style={{
                                  width: 30,
                                  height: 30,
                                  color: THEME.primary.main,
                                }}
                              />
                            </Box>
                            <Typography
                              variant="body1"
                              sx={{ color: THEME.neutral[700], mb: 1 }}
                            >
                              Aucun partenaire
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={handleAddPartenaire}
                              sx={{
                                mt: 1,
                                background: THEME.primary.gradient,
                                textTransform: "none",
                                fontWeight: 600,
                                borderRadius: 2,
                              }}
                            >
                              Ajouter
                            </Button>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Fade>
              )}
            </>
          )}
        </DialogContent>

        {/* Footer avec bouton de sauvegarde */}
        <DialogActions
          sx={{
            p: 2,
            borderTop: `1px solid ${THEME.neutral[200]}`,
            bgcolor: "white",
            justifyContent: "space-between",
          }}
        >
          <Button
            onClick={handleCloseModal}
            sx={{
              textTransform: "none",
              color: THEME.neutral[600],
            }}
          >
            Fermer
          </Button>
          <Button
            variant="contained"
            startIcon={
              saving ? (
                <CircularProgress size={16} sx={{ color: "white" }} />
              ) : (
                <SaveIcon />
              )
            }
            onClick={handleSave}
            disabled={saving || loading}
            sx={{
              px: 3,
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
            }}
          >
            {saving
              ? "Sauvegarde..."
              : pendingCount > 0
              ? `Enregistrer (${pendingCount})`
              : "Enregistrer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== DIALOG PARTENAIRE (édition/ajout) ========== */}
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
                ? "Nouveau Logo"
                : "Modifier le logo"}
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
        <DialogContent sx={{ p: 3 }}>
          {partenaireDialog.data && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Image Upload */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 1.5 }}
                >
                  Logo / Image
                </Typography>
                <Box
                  sx={{
                    width: "100%",
                    height: 140,
                    bgcolor: THEME.neutral[100],
                    borderRadius: 2,
                    overflow: "hidden",
                    position: "relative",
                    border: isPendingImage(partenaireDialog.data.image)
                      ? `2px dashed ${THEME.accent.orange}`
                      : `2px dashed ${THEME.neutral[300]}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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
                          icon={<PendingIcon sx={{ fontSize: 12 }} />}
                          label="En attente"
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            bgcolor: THEME.accent.orange,
                            color: "white",
                            height: 22,
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <Stack alignItems="center" gap={0.5}>
                      <CloudUploadIcon
                        sx={{ fontSize: 36, color: THEME.neutral[400] }}
                      />
                      <Typography variant="caption" color={THEME.neutral[500]}>
                        Glissez un logo ici
                      </Typography>
                    </Stack>
                  )}
                </Box>
                <Button
                  component="label"
                  variant="outlined"
                  fullWidth
                  size="small"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    mt: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: THEME.primary.main,
                    color: THEME.primary.main,
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
                label="Nom "
                fullWidth
                size="small"
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
                size="small"
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
                helperText="Ordre croissant d'affichage"
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
          sx={{ p: 2, borderTop: `1px solid ${THEME.neutral[200]}` }}
        >
          <Button
            onClick={() =>
              setPartenaireDialog({ open: false, mode: "add", data: null })
            }
            sx={{ textTransform: "none", color: THEME.neutral[600] }}
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
              px: 3,
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
    </>
  );
}