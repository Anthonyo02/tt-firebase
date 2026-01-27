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
import { ImageIcon } from "lucide-react";
import LogoList from "../LogoList";

// --- Types ---
interface LogoItem {
  id: string;
  name: string;
  image: string;
  imagePublicId?: string;
}

interface LogoData {
  logos: LogoItem[];
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
const DEFAULT_LOGOS: LogoItem[] = [
  {
    id: "l1",
    name: "Logo Alpha",
    image: "/logos/logo-1.png",
    imagePublicId: "",
  },
  {
    id: "l2",
    name: "Logo Beta",
    image: "/logos/logo-2.png",
    imagePublicId: "",
  },
  {
    id: "l3",
    name: "Logo Gamma",
    image: "/logos/logo-3.png",
    imagePublicId: "",
  },
  {
    id: "l4",
    name: "Logo Delta",
    image: "/logos/logo-4.png",
    imagePublicId: "",
  },
];

const DEFAULT_DATA: LogoData = {
  logos: DEFAULT_LOGOS,
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
  const [data, setData] = useState<LogoData | null>(null);
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
  const [logoDialog, setLogoDialog] = useState<{
    open: boolean;
    mode: "add" | "edit";
    data: LogoItem | null;
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
          const logoData: LogoData = {
            logos: Array.isArray(docData.logos)
              ? docData.logos.map((l: any) => ({
                  id: l.id || generateId(),
                  name: l.name || "",
                  image: l.image || "",
                  imagePublicId: l.imagePublicId || "",
                }))
              : DEFAULT_LOGOS,
          };
          setData(logoData);
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

          const existingLogo = data.logos.find((l) => l.id === pending.itemId);
          if (existingLogo?.imagePublicId) {
            formData.append("publicId", existingLogo.imagePublicId);
          }

          const res = await fetch("/api/cloudinary/uploadweb/logo", {
            method: "POST",
            body: formData,
          });

          const resData = await res.json();

          if (!res.ok) {
            throw new Error(resData.error || "Erreur upload");
          }

          finalData.logos = finalData.logos.map((l) =>
            l.id === pending.itemId
              ? {
                  ...l,
                  image: resData.imageUrl,
                  imagePublicId: resData.imagePublicId,
                }
              : l
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
        logos: finalData.logos,
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
  // ACTIONS LOGOS
  // ============================================
  const handleAddLogo = () => {
    setLogoDialog({
      open: true,
      mode: "add",
      data: {
        id: generateId(),
        name: "",
        image: "",
        imagePublicId: "",
      },
    });
  };

  const handleEditLogo = (logo: LogoItem) => {
    setLogoDialog({ open: true, mode: "edit", data: { ...logo } });
  };

  const handleSaveLogoDialog = () => {
    if (!data || !logoDialog.data) return;

    if (logoDialog.mode === "add") {
      setData({
        ...data,
        logos: [...data.logos, logoDialog.data],
      });
    } else {
      setData({
        ...data,
        logos: data.logos.map((l) =>
          l.id === logoDialog.data!.id ? logoDialog.data! : l
        ),
      });
    }
    setLogoDialog({ open: false, mode: "add", data: null });
    setToast({ msg: "N'oubliez pas d'enregistrer", type: "info" });
  };

  const handleDeleteLogo = async (logoId: string) => {
    if (!data) return;
    const logo = data.logos.find((l) => l.id === logoId);
    if (!logo) return;

    setDeletingItem(logoId);
    try {
      // Supprimer l'image de Cloudinary si elle existe
      if (logo.imagePublicId && !isPendingImage(logo.image)) {
        try {
          await fetch("/api/cloudinary/deleteweb", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicId: logo.imagePublicId }),
          });
        } catch (e) {
          console.warn("⚠️ Erreur suppression Cloudinary:", e);
        }
      }

      // Nettoyer les pending images
      const pendingToRemove = pendingImages.filter(
        (p) => p.itemId === logoId
      );
      pendingToRemove.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPendingImages((prev) => prev.filter((p) => p.itemId !== logoId));

      setData({
        ...data,
        logos: data.logos.filter((l) => l.id !== logoId),
      });
      setToast({ msg: "Logo supprimé", type: "success" });
    } catch (e) {
      console.error("❌ Erreur suppression:", e);
      setToast({ msg: "Erreur suppression", type: "error" });
    } finally {
      setDeletingItem(null);
    }
  };

  const handleLogoImageSelect = (file: File) => {
    if (!logoDialog.data) return;

    const previewUrl = URL.createObjectURL(file);

    setPendingImages((prev) => [
      ...prev.filter((p) => p.itemId !== logoDialog.data!.id),
      { file, previewUrl, itemId: logoDialog.data!.id },
    ]);

    setLogoDialog({
      ...logoDialog,
      data: { ...logoDialog.data!, image: previewUrl },
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
      <Tooltip title="Gérer les logos" arrow>
        <Button
          variant="contained"
          startIcon={<ImageIcon style={{ width: 20, height: 20 }} />}
          onClick={() => setModalOpen(true)}
          sx={{
            background: THEME.primary.gradient,
            textTransform: "none",
            fontWeight: 600,
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
          Gérer les logos
          {pendingCount > 0 && (
            <Chip
              size="small"
              label={pendingCount}
              sx={{
                ml: 1,
                bgcolor: THEME.accent.orange,
                color: "white",
                fontWeight: 700,
              }}
            />
          )}
        </Button>
      </Tooltip>

      {/* ========== MODAL PRINCIPALE ========== */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
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
                <ImageIcon style={{ width: 24, height: 24, color: "white" }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} color="white">
                  Gestion des logos
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: alpha("#fff", 0.7) }}
                >
                  <span style={{ fontWeight: "bold" }}>
                    {data?.logos.length || 0}
                  </span>{" "}
                  logo{(data?.logos.length || 0) > 1 ? "s" : ""} disponible{(data?.logos.length || 0) > 1 ? "s" : ""}
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
                        {data.logos.length} logo{data.logos.length > 1 ? "s" : ""} enregistré{data.logos.length > 1 ? "s" : ""}
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
                          onClick={handleAddLogo}
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

                    {/* ========== LISTE DES LOGOS ========== */}
                    <Grid container spacing={2}>
                      {data.logos.map((logo, index) => (
                        <Grid
                          item
                          xs={6}
                          sm={4}
                          md={3}
                          lg={4}
                          key={logo.id}
                        >
                          <Grow in timeout={200 + index * 50}>
                            <Card
                              sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                borderRadius: 2,
                                overflow: "hidden",
                                border: isPendingImage(logo.image)
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
                                {isPendingImage(logo.image) && (
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
                                  {logo.image ? (
                                    <Box
                                      component="img"
                                      src={logo.image}
                                      alt={logo.name}
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
                                  {logo.name || "Sans nom"}
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
                                  onClick={() => handleEditLogo(logo)}
                                  sx={{
                                    color: THEME.primary.main,
                                    p: 0.5,
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteLogo(logo.id)}
                                  disabled={deletingItem === logo.id}
                                  sx={{
                                    color: "#EF4444",
                                    p: 0.5,
                                  }}
                                >
                                  {deletingItem === logo.id ? (
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
                      {data.logos.length === 0 && (
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
                              <ImageIcon
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
                              Aucun logo
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={handleAddLogo}
                              sx={{
                                mt: 1,
                                background: THEME.primary.gradient,
                                textTransform: "none",
                                fontWeight: 600,
                                borderRadius: 2,
                              }}
                            >
                              Ajouter un logo
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

      {/* ========== DIALOG LOGO (édition/ajout) ========== */}
      <Dialog
        open={logoDialog.open}
        onClose={() => setLogoDialog({ open: false, mode: "add", data: null })}
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
            <ImageIcon style={{ width: 24, height: 24 }} />
            <Typography variant="h6" fontWeight={600}>
              {logoDialog.mode === "add" ? "Nouveau Logo" : "Modifier le logo"}
            </Typography>
          </Stack>
          <IconButton
            onClick={() =>
              setLogoDialog({ open: false, mode: "add", data: null })
            }
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {logoDialog.data && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Image Upload */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 1.5 }}
                >
                  Image du logo
                </Typography>
                <Box
                  sx={{
                    width: "100%",
                    height: 140,
                    bgcolor: THEME.neutral[100],
                    borderRadius: 2,
                    overflow: "hidden",
                    position: "relative",
                    border: isPendingImage(logoDialog.data.image)
                      ? `2px dashed ${THEME.accent.orange}`
                      : `2px dashed ${THEME.neutral[300]}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {logoDialog.data.image ? (
                    <>
                      <Box
                        component="img"
                        src={logoDialog.data.image}
                        alt="Logo"
                        sx={{
                          maxWidth: "80%",
                          maxHeight: "80%",
                          objectFit: "contain",
                        }}
                      />
                      {isPendingImage(logoDialog.data.image) && (
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
                      handleLogoImageSelect(e.target.files[0])
                    }
                  />
                </Button>
              </Box>

              {/* Nom */}
              <TextField
                label="Nom du logo"
                fullWidth
                size="small"
                value={logoDialog.data.name}
                onChange={(e) =>
                  setLogoDialog({
                    ...logoDialog,
                    data: { ...logoDialog.data!, name: e.target.value },
                  })
                }
                placeholder="Ex: Mon Logo"
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
              setLogoDialog({ open: false, mode: "add", data: null })
            }
            sx={{ textTransform: "none", color: THEME.neutral[600] }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveLogoDialog}
            disabled={!logoDialog.data?.name}
            sx={{
              background: THEME.primary.gradient,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              borderRadius: 2,
            }}
          >
            {logoDialog.mode === "add" ? "Ajouter" : "Enregistrer"}
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