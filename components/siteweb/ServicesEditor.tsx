"use client";

import React, { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";

// Firebase
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db2 } from "@/lib/firebase-site";

// Icons (MUI)
import {
  Edit as EditIcon,
  Visibility as PreviewIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Image as ImageIcon,
  CloudUpload as CloudUploadIcon,
  DeleteOutline as DeleteIcon,
  Add as AddIcon,
  SwapHoriz as SwapIcon,
  Link as LinkIcon,
  FormatListBulleted as ListIcon,
  SmartButton as ButtonIcon,
  Settings as SettingsIcon,
  Build as BuildIcon,
  Star as StarIcon,
  Favorite as FavoriteIcon,
  Rocket as RocketIcon,
  Psychology as PsychologyIcon,
  Lightbulb as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";

import {
  Box,
  Button,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
  Chip,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
} from "@mui/material";
import HeroImageUploader from "../HeroImageEditor";
import EditAboutModal from "../HeroImageEditor";
import EditServiceBannerModal from "../HeroImageEditor";
import EditBannier from "../HeroImageEditor";

// ============================================
// TYPES & INTERFACES
// ============================================

interface ListItem {
  id: string;
  text: string;
}

interface ServiceList {
  items: ListItem[];
}

interface ServiceButton {
  id: string;
  label: string;
  action: "navigate" | "modal" | "scroll" | "external";
  url?: string;
  variant: "primary" | "secondary" | "outlined";
}

interface ServiceImage {
  imageId: string;
  imageUrl: string;
  icon: string;
  alt: string;
}

interface ServiceTheme {
  primaryColor: string;
}

interface ServiceContent {
  title: string;
  subtitle: string;
  description: string;
}

interface ServiceBox {
  id: string;
  theme: ServiceTheme;
  content: ServiceContent;
  lists: ServiceList[];
  buttons: ServiceButton[];
  image: ServiceImage;
  imageSide: "left" | "right";
  createdAt: string;
  updatedAt: string;
}

interface ServicesData {
  services: ServiceBox[];
}

interface PendingImage {
  boxId: string;
  file: File;
  previewUrl: string;
}

// ============================================
// CONSTANTES
// ============================================

const THEME_COLORS = {
  beige: "#D5B595",
  olive: "#616637",
  bgLight: "#FDFCFB",
  textMain: "#1A1A1A",
};

const AVAILABLE_ICONS: { [key: string]: React.ReactNode } = {
  settings: <SettingsIcon fontSize="small" />,
  build: <BuildIcon fontSize="small" />,
  star: <StarIcon fontSize="small" />,
  favorite: <FavoriteIcon fontSize="small" />,
  rocket: <RocketIcon fontSize="small" />,
  psychology: <PsychologyIcon fontSize="small" />,
  lightbulb: <LightbulbIcon fontSize="small" />,
  trending: <TrendingUpIcon fontSize="small" />,
  security: <SecurityIcon fontSize="small" />,
  speed: <SpeedIcon fontSize="small" />,
};

const PRESET_COLORS = [
  "#1E88E5",
  "#43A047",
  "#FB8C00",
  "#E53935",
  "#8E24AA",
  "#00ACC1",
  "#FFB300",
  "#6D4C41",
  "#546E7A",
  "#D81B60",
  "#616637",
  "#D5B595",
];

const ACTION_TYPES = [
  { value: "navigate", label: "Navigation" },
  { value: "modal", label: "Modal" },
  { value: "scroll", label: "Scroll" },
  { value: "external", label: "Externe" },
];

const BUTTON_VARIANTS = [
  { value: "primary", label: "Principal" },
  { value: "secondary", label: "Secondaire" },
  { value: "outlined", label: "Contour" },
];

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp" as const,
};

// ============================================
// STYLES COMPACTS
// ============================================

const compactStyles = {
  textField: {
    size: "small" as const,
    sx: {
      "& .MuiInputBase-root": {
        fontSize: "0.8rem",
        minHeight: 36,
      },
      "& .MuiInputLabel-root": {
        fontSize: "0.8rem",
      },
      "& .MuiOutlinedInput-input": {
        padding: "8px 12px",
      },
    },
  },
  button: {
    size: "small" as const,
    sx: {
      fontSize: "0.75rem",
      padding: "4px 12px",
      minHeight: 32,
    },
  },
  iconButton: {
    size: "small" as const,
    sx: {
      padding: "4px",
    },
  },
  chip: {
    size: "small" as const,
    sx: {
      fontSize: "0.7rem",
      height: 22,
    },
  },
  typography: {
    title: {
      fontSize: "0.85rem",
      fontWeight: 600,
    },
    body: {
      fontSize: "0.8rem",
    },
    caption: {
      fontSize: "0.7rem",
    },
  },
};

// ============================================
// HELPERS
// ============================================

const generateId = () =>
  `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const getTimestamp = () => new Date().toISOString();

const createNewBox = (lastSide?: "left" | "right"): ServiceBox => ({
  id: generateId(),
  theme: { primaryColor: THEME_COLORS.olive },
  content: { title: "", subtitle: "", description: "" },
  lists: [{ items: [] }],
  buttons: [],
  image: { imageId: "", imageUrl: "", icon: "star", alt: "" },
  imageSide: lastSide === "left" ? "right" : "left",
  createdAt: getTimestamp(),
  updatedAt: getTimestamp(),
});

const DEFAULT_SERVICES_DATA: ServicesData = {
  services: [],
};

const getButtonStyles = (variant: string, primaryColor: string) => {
  switch (variant) {
    case "primary":
      return {
        bgcolor: primaryColor,
        color: "white",
        borderColor: primaryColor,
        "&:hover": {
          bgcolor: alpha(primaryColor, 0.85),
        },
      };
    case "secondary":
      return {
        bgcolor: alpha(primaryColor, 0.15),
        color: primaryColor,
        borderColor: "transparent",
        "&:hover": {
          bgcolor: alpha(primaryColor, 0.25),
        },
      };
    case "outlined":
      return {
        bgcolor: "transparent",
        color: primaryColor,
        borderColor: primaryColor,
        border: `1.5px solid ${primaryColor}`,
        "&:hover": {
          bgcolor: alpha(primaryColor, 0.08),
          borderColor: primaryColor,
        },
      };
    default:
      return {
        bgcolor: primaryColor,
        color: "white",
        "&:hover": {
          bgcolor: alpha(primaryColor, 0.85),
        },
      };
  }
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function ServicesEditor() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // États principaux
  const [data, setData] = useState<ServicesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  // Accordéon
  const [expandedSection, setExpandedSection] = useState<string | false>(false);

  // Images en attente
  const [pendingImages, setPendingImages] = useState<Map<string, PendingImage>>(
    new Map(),
  );

  // ============================================
  // FIREBASE SYNC
  // ============================================

useEffect(() => {
  const docRef = doc(db2, "website_content", "services");

  // D'abord vérifier si le document existe
  const initializeData = async () => {
    try {
      const { getDoc } = await import("firebase/firestore");
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        // Créer seulement une fois au démarrage
        await setDoc(docRef, DEFAULT_SERVICES_DATA);
      }
    } catch (error) {
      console.error("Erreur initialisation:", error);
    }
  };

  initializeData();

  // Ensuite écouter les changements
  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const docData = snapshot.data() as ServicesData;
        setData({ services: docData.services || [] });
      }
      // NE PLUS faire de setDoc ici!
      setLoading(false);
    },
    (error) => {
      console.error("Erreur Firebase:", error);
      setToast({ msg: "Erreur de connexion", type: "error" });
      setLoading(false);
    }
  );

  return () => unsubscribe();
}, []);

  useEffect(() => {
    return () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [pendingImages]);

  // ============================================
  // BOX HANDLERS
  // ============================================

  const addBox = () => {
    if (!data) return;
    const lastBox = data.services[data.services.length - 1];
    const newBox = createNewBox(lastBox?.imageSide);
    setData({ services: [...data.services, newBox] });
    setExpandedSection(newBox.id);
  };

  const duplicateBox = (boxId: string) => {
    if (!data) return;
    const boxToDuplicate = data.services.find((b) => b.id === boxId);
    if (!boxToDuplicate) return;

    const newBox: ServiceBox = {
      ...JSON.parse(JSON.stringify(boxToDuplicate)),
      id: generateId(),
      imageSide: boxToDuplicate.imageSide === "left" ? "right" : "left",
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
    };

    const index = data.services.findIndex((b) => b.id === boxId);
    const newServices = [...data.services];
    newServices.splice(index + 1, 0, newBox);
    setData({ services: newServices });
    setExpandedSection(newBox.id);
  };

  const deleteBox = (boxId: string) => {
    if (!data) return;
    if (pendingImages.has(boxId)) {
      const pending = pendingImages.get(boxId)!;
      URL.revokeObjectURL(pending.previewUrl);
      const newPending = new Map(pendingImages);
      newPending.delete(boxId);
      setPendingImages(newPending);
    }
    setData({ services: data.services.filter((b) => b.id !== boxId) });
    if (expandedSection === boxId) setExpandedSection(false);
  };

  const updateBox = (boxId: string, updates: Partial<ServiceBox>) => {
    if (!data) return;
    setData({
      services: data.services.map((box) =>
        box.id === boxId
          ? { ...box, ...updates, updatedAt: getTimestamp() }
          : box,
      ),
    });
  };

  const toggleImageSide = (boxId: string) => {
    if (!data) return;
    const box = data.services.find((b) => b.id === boxId);
    if (!box) return;
    updateBox(boxId, {
      imageSide: box.imageSide === "left" ? "right" : "left",
    });
  };

  // ============================================
  // LIST ITEMS HANDLERS
  // ============================================

  const addListItem = (boxId: string) => {
    if (!data) return;
    const box = data.services.find((b) => b.id === boxId);
    if (!box) return;

    const newItem: ListItem = { id: generateId(), text: "" };
    const newLists = [...box.lists];
    if (newLists.length === 0) newLists.push({ items: [] });
    newLists[0] = { items: [...newLists[0].items, newItem] };

    updateBox(boxId, { lists: newLists });
  };

  const updateListItem = (boxId: string, itemId: string, text: string) => {
    if (!data) return;
    const box = data.services.find((b) => b.id === boxId);
    if (!box) return;

    const newLists = box.lists.map((list) => ({
      items: list.items.map((item) =>
        item.id === itemId ? { ...item, text } : item,
      ),
    }));

    updateBox(boxId, { lists: newLists });
  };

  const deleteListItem = (boxId: string, itemId: string) => {
    if (!data) return;
    const box = data.services.find((b) => b.id === boxId);
    if (!box) return;

    const newLists = box.lists.map((list) => ({
      items: list.items.filter((item) => item.id !== itemId),
    }));

    updateBox(boxId, { lists: newLists });
  };

  // ============================================
  // BUTTONS HANDLERS
  // ============================================

  const addButton = (boxId: string) => {
    if (!data) return;
    const box = data.services.find((b) => b.id === boxId);
    if (!box) return;

    const newButton: ServiceButton = {
      id: generateId(),
      label: "Nouveau bouton",
      action: "navigate",
      url: "",
      variant: "primary",
    };

    updateBox(boxId, { buttons: [...box.buttons, newButton] });
  };

  const updateButton = (
    boxId: string,
    buttonId: string,
    updates: Partial<ServiceButton>,
  ) => {
    if (!data) return;
    const box = data.services.find((b) => b.id === boxId);
    if (!box) return;

    const newButtons = box.buttons.map((btn) =>
      btn.id === buttonId ? { ...btn, ...updates } : btn,
    );

    updateBox(boxId, { buttons: newButtons });
  };

  const deleteButton = (boxId: string, buttonId: string) => {
    if (!data) return;
    const box = data.services.find((b) => b.id === boxId);
    if (!box) return;

    updateBox(boxId, {
      buttons: box.buttons.filter((btn) => btn.id !== buttonId),
    });
  };

  // ============================================
  // IMAGE HANDLERS
  // ============================================

  const handleImageSelect = (boxId: string, file: File) => {
    if (!data) return;

    if (pendingImages.has(boxId)) {
      URL.revokeObjectURL(pendingImages.get(boxId)!.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    const newPending = new Map(pendingImages);
    newPending.set(boxId, { boxId, file, previewUrl });
    setPendingImages(newPending);

    const box = data.services.find((b) => b.id === boxId);
    if (box) {
      updateBox(boxId, { image: { ...box.image, imageUrl: previewUrl } });
    }

    setToast({ msg: "Image sélectionnée", type: "info" });
  };

  const cancelPendingImage = (boxId: string) => {
    if (!pendingImages.has(boxId)) return;

    URL.revokeObjectURL(pendingImages.get(boxId)!.previewUrl);
    const newPending = new Map(pendingImages);
    newPending.delete(boxId);
    setPendingImages(newPending);

    const box = data?.services.find((b) => b.id === boxId);
    if (box) {
      updateBox(boxId, { image: { ...box.image, imageUrl: "" } });
    }

    setToast({ msg: "Modification annulée", type: "info" });
  };

  // ============================================
  // SAVE HANDLER
  // ============================================

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);

    try {
      let updatedServices = [...data.services];

      // Upload des images en attente
      for (const [boxId, pending] of pendingImages) {
        try {
          const compressedFile = await imageCompression(
            pending.file,
            COMPRESSION_OPTIONS,
          );

          const formData = new FormData();
          formData.append("file", compressedFile);

          const box = updatedServices.find((b) => b.id === boxId);
          if (box?.image.imageId) {
            formData.append("publicId", box.image.imageId);
          }

          const res = await fetch("/api/cloudinary/uploadweb/services", {
            method: "POST",
            body: formData,
          });

          const resData = await res.json();

          if (!res.ok) throw new Error(resData.error || "Erreur upload");

          // Mise à jour des services avec la nouvelle URL d'image
          updatedServices = updatedServices.map((b) =>
            b.id === boxId
              ? {
                  ...b,
                  image: {
                    ...b.image,
                    imageUrl: resData.imageUrl,
                    imageId: resData.imagePublicId || resData.publicId || "",
                  },
                }
              : b,
          );

          URL.revokeObjectURL(pending.previewUrl);
        } catch (uploadErr: any) {
          console.error(`Erreur upload pour ${boxId}:`, uploadErr);
          setToast({
            msg: `Erreur upload image: ${uploadErr.message}`,
            type: "error",
          });
          setSaving(false);
          return;
        }
      }

      // Sauvegarde dans Firebase
      const docRef = doc(db2, "website_content", "services");
      await updateDoc(docRef, { services: updatedServices });

      setData({ services: updatedServices });
      setPendingImages(new Map());
      setToast({ msg: "Sauvegarde réussie !", type: "success" });
    } catch (e: any) {
      console.error("Erreur sauvegarde:", e);
      setToast({
        msg: e.message || "Erreur lors de la sauvegarde",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // RENDER SECTION (ACCORDÉON COMPACT)
  // ============================================
  const [open, setOpen] = useState(true);

  const renderSection = (box: ServiceBox, index: number) => {
    const isExpanded = expandedSection === box.id;
    const hasPendingImage = pendingImages.has(box.id);
    const primaryColor = box.theme.primaryColor;
    const isImageRight = box.imageSide === "right";
    return (
      <>
        {" "}
        <Accordion
          key={box.id}
          expanded={isExpanded}
          onChange={(_, expanded) =>
            setExpandedSection(expanded ? box.id : false)
          }
          sx={{
            borderRadius: "8px !important",
            overflow: "hidden",
            mb: 1.5,
            border: `1.5px solid ${isExpanded ? primaryColor : "transparent"}`,
            boxShadow: isExpanded
              ? `0 2px 12px ${alpha(primaryColor, 0.15)}`
              : "0 1px 3px rgba(0,0,0,0.08)",
            transition: "all 0.2s ease",
            "&:before": { display: "none" },
            "&.Mui-expanded": { margin: "0 0 12px 0" },
          }}
        >
          {/* HEADER ACCORDÉON COMPACT */}
          <AccordionSummary
            expandIcon={
              <ExpandMoreIcon
                sx={{
                  color: isExpanded ? "white" : primaryColor,
                  fontSize: 20,
                }}
              />
            }
            sx={{
              bgcolor: isExpanded ? primaryColor : alpha(primaryColor, 0.06),
              transition: "all 0.2s ease",
              minHeight: 48,
              px: 2,
              "& .MuiAccordionSummary-content": {
                alignItems: "center",
                gap: 1.5,
                my: 0.5,
              },
            }}
          >
            <Avatar
              sx={{
                bgcolor: isExpanded ? "white" : primaryColor,
                color: isExpanded ? primaryColor : "white",
                fontWeight: "bold",
                width: 28,
                height: 28,
                fontSize: "0.8rem",
              }}
            >
              {index + 1}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                fontWeight="bold"
                noWrap
                sx={{ color: isExpanded ? "white" : THEME_COLORS.textMain }}
              >
                {box.content.title || `Box ${index + 1}`}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  color: isExpanded
                    ? "rgba(255,255,255,0.75)"
                    : "text.secondary",
                  fontSize: "0.7rem",
                }}
              >
                {box.content.subtitle || "Configurer..."}
              </Typography>
            </Box>

            {hasPendingImage && (
              <Chip
                label="En attente"
                {...compactStyles.chip}
                color="warning"
                sx={{ ...compactStyles.chip.sx, mr: 1 }}
              />
            )}

            <Chip
              label={box.imageSide === "left" ? "← Img" : "Img →"}
              {...compactStyles.chip}
              sx={{
                ...compactStyles.chip.sx,
                bgcolor: isExpanded
                  ? "rgba(255,255,255,0.2)"
                  : alpha(primaryColor, 0.12),
                color: isExpanded ? "white" : primaryColor,
              }}
            />

            <Stack
              direction="row"
              spacing={0}
              onClick={(e) => e.stopPropagation()}
            >
              <Tooltip title="Inverser">
                <IconButton
                  {...compactStyles.iconButton}
                  onClick={() => toggleImageSide(box.id)}
                  sx={{
                    ...compactStyles.iconButton.sx,
                    color: isExpanded ? "white" : primaryColor,
                  }}
                >
                  <SwapIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Supprimer">
                <IconButton
                  {...compactStyles.iconButton}
                  onClick={() => deleteBox(box.id)}
                  sx={{
                    ...compactStyles.iconButton.sx,
                    color: isExpanded ? "white" : "error.main",
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </AccordionSummary>

          {/* CONTENU ACCORDÉON COMPACT */}
          <AccordionDetails sx={{ p: 0 }}>
            <Grid
              container
              direction={box.imageSide === "right" ? "row-reverse" : "row"}
            >
              {/* ZONE IMAGE */}
              <Grid
                item
                xs={12}
                md={4}
                sx={{
                  bgcolor: "#fafafa",
                  borderRight: !isImageRight ? "1px solid #eee" : "none",
                  borderLeft: isImageRight ? "1px solid #eee" : "none",
                  p: 2,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color="text.secondary"
                  sx={{ mb: 1, display: "block" }}
                >
                  IMAGE & STYLE
                </Typography>

                <Paper
                  elevation={0}
                  sx={{
                    width: "100%",
                    aspectRatio: "16/9",
                    borderRadius: 1,
                    overflow: "hidden",
                    bgcolor: "#eee",
                    border: `1px dashed ${alpha(primaryColor, 0.5)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                    position: "relative",
                  }}
                >
                  {box.image.imageUrl ? (
                    <Box
                      component="img"
                      src={box.image.imageUrl}
                      alt={box.image.alt}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Stack alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: primaryColor,
                          width: 32,
                          height: 32,
                          mb: 0.5,
                        }}
                      >
                        {AVAILABLE_ICONS[box.image.icon] || (
                          <ImageIcon fontSize="small" />
                        )}
                      </Avatar>
                      <Typography variant="caption" color="textSecondary">
                        No Image
                      </Typography>
                    </Stack>
                  )}

                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      bgcolor: primaryColor,
                      boxShadow: 1,
                    }}
                  />
                </Paper>

                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Button
                    component="label"
                    variant="contained"
                    size="small"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    sx={{
                      bgcolor: primaryColor,
                      fontSize: "0.75rem",
                      "&:hover": { bgcolor: alpha(primaryColor, 0.9) },
                    }}
                  >
                    Upload
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleImageSelect(box.id, e.target.files[0])
                      }
                    />
                  </Button>
                  {hasPendingImage && (
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => cancelPendingImage(box.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>

                <Stack spacing={1.5}>
                  <TextField
                    label="Alt Text"
                    size="small"
                    variant="outlined"
                    fullWidth
                    value={box.image.alt}
                    onChange={(e) =>
                      updateBox(box.id, {
                        image: { ...box.image, alt: e.target.value },
                      })
                    }
                    InputProps={{ style: { fontSize: 13 } }}
                    InputLabelProps={{ style: { fontSize: 13 } }}
                  />

                  <FormControl size="small" fullWidth variant="outlined">
                    <InputLabel style={{ fontSize: 13 }}>Icône</InputLabel>
                    <Select
                      value={box.image.icon}
                      label="Icône"
                      onChange={(e) =>
                        updateBox(box.id, {
                          image: { ...box.image, icon: e.target.value },
                        })
                      }
                      sx={{ fontSize: 13 }}
                    >
                      {Object.keys(AVAILABLE_ICONS).map((iconKey) => (
                        <MenuItem
                          key={iconKey}
                          value={iconKey}
                          sx={{ fontSize: 13 }}
                        >
                          <Box display="flex" alignItems="center" gap={1}>
                            {AVAILABLE_ICONS[iconKey]} {iconKey}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      gutterBottom
                    >
                      Couleur: {primaryColor}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                      {PRESET_COLORS.map((color) => (
                        <Box
                          key={color}
                          onClick={() =>
                            updateBox(box.id, {
                              theme: { primaryColor: color },
                            })
                          }
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: "4px",
                            bgcolor: color,
                            cursor: "pointer",
                            border:
                              color === primaryColor
                                ? "2px solid #333"
                                : "1px solid #ddd",
                            "&:hover": { transform: "scale(1.2)" },
                          }}
                        />
                      ))}
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) =>
                          updateBox(box.id, {
                            theme: { primaryColor: e.target.value },
                          })
                        }
                        style={{
                          width: 20,
                          height: 20,
                          padding: 0,
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                        }}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </Grid>

              {/* ZONE TEXTE / FORMULAIRE */}
              <Grid item xs={12} md={8} sx={{ p: 2, bgcolor: "white" }}>
                <Stack spacing={2}>
                  {/* CONTENU PRINCIPAL */}
                  <Box>
                    <Typography
                      sx={{
                        ...compactStyles.typography.title,
                        color: primaryColor,
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      📝 Contenu
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Titre"
                          fullWidth
                          {...compactStyles.textField}
                          value={box.content.title}
                          onChange={(e) =>
                            updateBox(box.id, {
                              content: {
                                ...box.content,
                                title: e.target.value,
                              },
                            })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Sous-titre"
                          fullWidth
                          {...compactStyles.textField}
                          value={box.content.subtitle}
                          onChange={(e) =>
                            updateBox(box.id, {
                              content: {
                                ...box.content,
                                subtitle: e.target.value,
                              },
                            })
                          }
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Description"
                          fullWidth
                          multiline
                          rows={2}
                          {...compactStyles.textField}
                          value={box.content.description}
                          onChange={(e) =>
                            updateBox(box.id, {
                              content: {
                                ...box.content,
                                description: e.target.value,
                              },
                            })
                          }
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  {/* LISTE */}
                  <Box>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={0.5}
                    >
                      <Typography
                        sx={{
                          ...compactStyles.typography.title,
                          color: primaryColor,
                        }}
                      >
                        <ListIcon
                          sx={{
                            fontSize: 14,
                            mr: 0.5,
                            verticalAlign: "text-bottom",
                          }}
                        />
                        Liste
                      </Typography>
                      <Button
                        {...compactStyles.button}
                        startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                        onClick={() => addListItem(box.id)}
                        sx={{ ...compactStyles.button.sx, color: primaryColor }}
                      >
                        Ajouter
                      </Button>
                    </Stack>

                    <Stack spacing={0.5}>
                      {box.lists[0]?.items.map((item, idx) => (
                        <Stack
                          key={item.id}
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                        >
                          <Chip
                            label={idx + 1}
                            size="small"
                            sx={{
                              bgcolor: primaryColor,
                              color: "white",
                              minWidth: 30,
                              height: 20,
                              fontSize: "0.7rem",
                            }}
                          />
                          <TextField
                            fullWidth
                            placeholder="Texte..."
                            {...compactStyles.textField}
                            value={item.text}
                            onChange={(e) =>
                              updateListItem(box.id, item.id, e.target.value)
                            }
                          />
                          <IconButton
                            {...compactStyles.iconButton}
                            color="error"
                            onClick={() => deleteListItem(box.id, item.id)}
                          >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Stack>
                      ))}

                      {(!box.lists[0] || box.lists[0].items.length === 0) && (
                        <Typography
                          sx={{
                            ...compactStyles.typography.caption,
                            fontStyle: "italic",
                            py: 0.5,
                            color: "text.secondary",
                          }}
                        >
                          Aucun élément
                        </Typography>
                      )}
                    </Stack>
                  </Box>

                  <Divider sx={{ my: 0.5 }} />

                  {/* BOUTONS */}
                  <Box>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={0.5}
                    >
                      <Typography
                        sx={{
                          ...compactStyles.typography.title,
                          color: primaryColor,
                        }}
                      >
                        <ButtonIcon
                          sx={{
                            fontSize: 14,
                            mr: 0.5,
                            verticalAlign: "text-bottom",
                          }}
                        />
                        Boutons
                      </Typography>
                      <Button
                        {...compactStyles.button}
                        startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                        onClick={() => addButton(box.id)}
                        sx={{ ...compactStyles.button.sx, color: primaryColor }}
                      >
                        Ajouter
                      </Button>
                    </Stack>

                    <Stack spacing={1}>
                      {box.buttons.map((btn) => (
                        <Paper
                          key={btn.id}
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            borderColor: alpha(primaryColor, 0.2),
                          }}
                        >
                          <Grid container spacing={1} alignItems="center">
                            <Grid item xs={6} sm={3}>
                              <TextField
                                label="Label"
                                fullWidth
                                {...compactStyles.textField}
                                value={btn.label}
                                onChange={(e) =>
                                  updateButton(box.id, btn.id, {
                                    label: e.target.value,
                                  })
                                }
                              />
                            </Grid>
                            <Grid item xs={6} sm={2.5}>
                              <FormControl
                                {...compactStyles.textField}
                                fullWidth
                              >
                                <InputLabel sx={{ fontSize: "0.8rem" }}>
                                  Action
                                </InputLabel>
                                <Select
                                  value={btn.action}
                                  label="Action"
                                  onChange={(e) =>
                                    updateButton(box.id, btn.id, {
                                      action: e.target.value as any,
                                    })
                                  }
                                  sx={{ fontSize: "0.8rem" }}
                                >
                                  {ACTION_TYPES.map((a) => (
                                    <MenuItem
                                      key={a.value}
                                      value={a.value}
                                      sx={{ fontSize: "0.8rem" }}
                                    >
                                      {a.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={6} sm={2}>
                              <FormControl
                                {...compactStyles.textField}
                                fullWidth
                              >
                                <InputLabel sx={{ fontSize: "0.8rem" }}>
                                  Style
                                </InputLabel>
                                <Select
                                  value={btn.variant}
                                  label="Style"
                                  onChange={(e) =>
                                    updateButton(box.id, btn.id, {
                                      variant: e.target.value as any,
                                    })
                                  }
                                  sx={{ fontSize: "0.8rem" }}
                                >
                                  {BUTTON_VARIANTS.map((v) => (
                                    <MenuItem
                                      key={v.value}
                                      value={v.value}
                                      sx={{ fontSize: "0.8rem" }}
                                    >
                                      {v.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={6} sm={3.5}>
                              <TextField
                                label="URL"
                                fullWidth
                                {...compactStyles.textField}
                                value={btn.url || ""}
                                onChange={(e) =>
                                  updateButton(box.id, btn.id, {
                                    url: e.target.value,
                                  })
                                }
                                InputProps={{
                                  startAdornment: (
                                    <LinkIcon
                                      sx={{
                                        mr: 0.5,
                                        color: "gray",
                                        fontSize: 14,
                                      }}
                                    />
                                  ),
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={1}>
                              <IconButton
                                color="error"
                                {...compactStyles.iconButton}
                                onClick={() => deleteButton(box.id, btn.id)}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Grid>
                          </Grid>

                          {/* Aperçu bouton */}
                          <Box
                            sx={{ mt: 1, pt: 1, borderTop: "1px dashed #eee" }}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <Typography
                                sx={{
                                  ...compactStyles.typography.caption,
                                  color: "text.secondary",
                                }}
                              >
                                Aperçu:
                              </Typography>
                              <Button
                                variant={
                                  btn.variant === "outlined"
                                    ? "outlined"
                                    : "contained"
                                }
                                {...compactStyles.button}
                                sx={{
                                  ...compactStyles.button.sx,
                                  ...getButtonStyles(btn.variant, primaryColor),
                                }}
                              >
                                {btn.label || "Bouton"}
                              </Button>
                            </Stack>
                          </Box>
                        </Paper>
                      ))}

                      {box.buttons.length === 0 && (
                        <Typography
                          sx={{
                            ...compactStyles.typography.caption,
                            fontStyle: "italic",
                            py: 0.5,
                            color: "text.secondary",
                          }}
                        >
                          Aucun bouton
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </>
    );
  };

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  if (loading || !data) {
    return (
      <Box
        sx={{
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={32} sx={{ color: THEME_COLORS.olive }} />
      </Box>
    );
  }

  const hasPendingChanges = pendingImages.size > 0;

  return (
    <Box
      sx={{ width: "100%" }}
      boxShadow="0 2px 8px rgba(0, 0, 0, 0.15)"
      overflow="hidden"
      borderRadius={2}
    >
      {/* HEADER TABS COMPACT */}
      <Box
        sx={{
          width: "100%",
          bgcolor: THEME_COLORS.olive,
          px: { xs: 1, md: 2 },
        }}
      >
        <Grid container alignItems="center">
          <Grid item xs={12} md={6}>
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              variant="scrollable"
              sx={{
                minHeight: 44,
                "& .MuiTabs-indicator": { bgcolor: "white", height: 2 },
                "& .MuiTab-root": {
                  color: "rgba(255,255,255,0.7)",
                  minHeight: 44,
                  fontSize: "0.8rem",
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
                    color="warning"
                    variant="dot"
                    invisible={!hasPendingChanges}
                  >
                    <EditIcon sx={{ fontSize: 18 }} />
                  </Badge>
                }
                iconPosition="start"
                label="Éditeur"
              />
            </Tabs>
          </Grid>

          <Grid item xs={12} md={6} sx={{ textAlign: "right", py: 0.5 }}>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="flex-end"
              alignItems="center"
            >
              <Chip
                label={`${data.services.length} box${data.services.length > 1 ? "es" : ""}`}
                {...compactStyles.chip}
                sx={{
                  ...compactStyles.chip.sx,
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                }}
              />
              <Button
                variant="contained"
                {...compactStyles.button}
                startIcon={
                  saving ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <SaveIcon sx={{ fontSize: 16 }} />
                  )
                }
                onClick={handleSave}
                disabled={saving}
                sx={{
                  ...compactStyles.button.sx,
                  bgcolor: hasPendingChanges ? "#ed6c02" : "white",
                  color: hasPendingChanges ? "white" : THEME_COLORS.olive,
                  "&:hover": {
                    bgcolor: hasPendingChanges ? "#e65100" : "#f5f5f5",
                  },
                  "&:disabled": {
                    bgcolor: "#ccc",
                    color: "#666",
                  },
                }}
              >
                {saving
                  ? "..."
                  : hasPendingChanges
                    ? `Uploader (${pendingImages.size})`
                    : "Enregistrer"}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* VUE APERÇU */}
      {tabValue === 0 && (
        <Box sx={{ bgcolor: "white", minHeight: 400 }}>
          <Box sx={{ maxWidth: 1000, mx: "auto", px: { xs: 2, md: 3 }, py: 5 }}>
            {data.services.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography color="textSecondary">Aucun service</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={addBox}
                  sx={{ mt: 2, bgcolor: THEME_COLORS.olive }}
                >
                  Créer un service
                </Button>
              </Box>
            ) : (
              data.services.map((box, idx) => {
                const isImageRight = box.imageSide === "right";
                const primaryColor = box.theme.primaryColor;

                return (
                  <Grid
                    container
                    key={box.id}
                    spacing={{ xs: 3, md: 5 }}
                    alignItems="center"
                    direction={isImageRight ? "row-reverse" : "row"}
                    sx={{ mb: { xs: 5, md: 8 } }}
                  >
                    {/* COLONNE IMAGE */}
                    <Grid item xs={12} md={5}>
                      <Box
                        sx={{
                          position: "relative",
                          borderRadius: "16px",
                          overflow: "hidden",
                          boxShadow: `0 12px 30px ${alpha(primaryColor, 0.15)}`,
                          bgcolor: alpha(primaryColor, 0.05),
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: `0 16px 40px ${alpha(primaryColor, 0.2)}`,
                          },
                        }}
                      >
                        <Box
                          sx={{
                            position: "relative",
                            paddingTop: "70%",
                            width: "100%",
                          }}
                        >
                          {box.image.imageUrl ? (
                            <Box
                              component="img"
                              src={box.image.imageUrl}
                              alt={box.image.alt}
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <Stack
                              alignItems="center"
                              justifyContent="center"
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                color: primaryColor,
                              }}
                            >
                              <Box sx={{ transform: "scale(2.5)" }}>
                                {AVAILABLE_ICONS[box.image.icon] || (
                                  <ImageIcon />
                                )}
                              </Box>
                            </Stack>
                          )}
                        </Box>

                        {/* Badge icône */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            width: 36,
                            height: 36,
                            borderRadius: "10px",
                            bgcolor: primaryColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            boxShadow: `0 4px 12px ${alpha(primaryColor, 0.4)}`,
                          }}
                        >
                          {AVAILABLE_ICONS[box.image.icon] || (
                            <StarIcon fontSize="small" />
                          )}
                        </Box>
                      </Box>
                    </Grid>

                    {/* COLONNE TEXTE */}
                    <Grid item xs={12} md={7}>
                      <Stack spacing={2}>
                        <Box>
                          {box.content.subtitle && (
                            <Typography
                              sx={{
                                color: primaryColor,
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                textTransform: "uppercase",
                                letterSpacing: 1.5,
                                mb: 0.5,
                              }}
                            >
                              {box.content.subtitle}
                            </Typography>
                          )}
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 700,
                              color: "#1a1a1a",
                              fontSize: { xs: "1.4rem", md: "1.75rem" },
                              lineHeight: 1.3,
                            }}
                          >
                            {box.content.title || `Service ${idx + 1}`}
                          </Typography>
                        </Box>

                        {box.content.description && (
                          <Typography
                            sx={{
                              color: "text.secondary",
                              fontSize: "0.95rem",
                              lineHeight: 1.6,
                            }}
                          >
                            {box.content.description}
                          </Typography>
                        )}

                        {/* LISTE */}
                        {box.lists[0]?.items.length > 0 && (
                          <Stack spacing={1} sx={{ mt: 1 }}>
                            {box.lists[0].items.map((item) => (
                              <Stack
                                key={item.id}
                                direction="row"
                                spacing={1.5}
                                alignItems="flex-start"
                              >
                                <Box
                                  sx={{
                                    mt: 0.3,
                                    minWidth: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    bgcolor: alpha(primaryColor, 0.12),
                                    color: primaryColor,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                </Box>
                                <Typography
                                  sx={{ fontSize: "0.9rem", fontWeight: 500 }}
                                >
                                  {item.text}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        )}

                        {/* BOUTONS */}
                        {box.buttons.length > 0 && (
                          <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{ pt: 1 }}
                            flexWrap="wrap"
                          >
                            {box.buttons.map((btn) => (
                              <Button
                                key={btn.id}
                                variant={
                                  btn.variant === "outlined"
                                    ? "outlined"
                                    : "contained"
                                }
                                disableElevation
                                sx={{
                                  borderRadius: "50px",
                                  px: 3,
                                  py: 1,
                                  textTransform: "none",
                                  fontSize: "0.85rem",
                                  fontWeight: 600,
                                  ...getButtonStyles(btn.variant, primaryColor),
                                }}
                              >
                                {btn.label}
                              </Button>
                            ))}
                          </Stack>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                );
              })
            )}
          </Box>
        </Box>
      )}

      {/* VUE ÉDITEUR */}
      {tabValue === 1 && (
        <Box
          sx={{
            bgcolor: "#f8f8f8",
            p: { xs: 1.5, md: 2 },
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
          }}
        >
          <EditBannier
            open={open}
            onClose={() => setOpen(false)}
            url="bannier_service"
          />
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
            <Button
              variant="contained"
              {...compactStyles.button}
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={addBox}
              sx={{ ...compactStyles.button.sx, bgcolor: THEME_COLORS.olive }}
            >
              Nouvelle Box
            </Button>
          </Stack>

          {data.services.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
              <ImageIcon sx={{ fontSize: 40, color: "#ccc", mb: 1 }} />
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Aucune box de service
              </Typography>
              <Button
                variant="contained"
                {...compactStyles.button}
                startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                onClick={addBox}
                sx={{
                  ...compactStyles.button.sx,
                  mt: 1.5,
                  bgcolor: THEME_COLORS.olive,
                }}
              >
                Créer
              </Button>
            </Paper>
          ) : (
            data.services.map((box, index) => renderSection(box, index))
          )}
        </Box>
      )}

      {/* TOAST */}
      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast(null)}
          severity={toast?.type || "info"}
          variant="filled"
          sx={{ fontSize: "0.8rem" }}
        >
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
