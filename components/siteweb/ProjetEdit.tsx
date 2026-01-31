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
  FormatListBulleted as ListIcon,
  Star as StarIcon,
  LocalOffer as TagIcon,
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
import EditBannier from "../HeroImageEditor";
import LogoEditor from "./LogoEditor";
import { Heart, Leaf, Target } from "lucide-react";
import ProjetsPreview from "./preview/ProjetsPreview";
import StyledTextField from "../about/StyledTextField";

// ============================================
// TYPES & INTERFACES
// ============================================

interface LabelItem {
  id: string;
  text: string;
}

interface ListItem {
  id: string;
  text: string;
}

interface ListGroup {
  id: string;
  title: string;
  items: ListItem[];
}

interface FeatureImage {
  imageId: string;
  imageUrl: string;
  logo: string;
  alt: string;
}

interface FeatureTheme {
  primaryColor: string;
}

interface FeatureContent {
  title: string;
  subtitle: string;
  description: string;
}

interface FeatureBox {
  id: string;
  theme: FeatureTheme;
  content: FeatureContent;
  labels: LabelItem[];
  listGroups: ListGroup[];
  image: FeatureImage;
  imageSide: "left" | "right";
  createdAt: string;
  updatedAt: string;
}

// ✅ Interface modifiée avec introduction
interface ProjetsData {
  introduction: string;
  projets: FeatureBox[];
}

interface FeatureLogo {
  id: string;
  name: string;
  image: string;
  imagePublicId?: string;
}

// ✅ Interface modifiée: partenaires → logo
interface LogoData {
  logos: FeatureLogo[];
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

const createNewBox = (lastSide?: "left" | "right"): FeatureBox => ({
  id: generateId(),
  theme: { primaryColor: THEME_COLORS.olive },
  content: { title: "", subtitle: "", description: "" },
  labels: [{ id: generateId(), text: "Libellé 1" }],
  listGroups: [],
  image: { imageId: "", imageUrl: "", logo: "", alt: "" },
  imageSide: lastSide === "left" ? "right" : "left",
  createdAt: getTimestamp(),
  updatedAt: getTimestamp(),
});

// ✅ DEFAULT modifié avec introduction
const DEFAULT_PROJETS_DATA: ProjetsData = {
  introduction: "",
  projets: [],
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function ProjetsEditor() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(true);

  // États principaux
  const [data, setData] = useState<ProjetsData | null>(null);
  const [logos, setLogos] = useState<FeatureLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [logosLoading, setLogosLoading] = useState(true);
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
  // FIREBASE SYNC - LOGOS (celui-ci est OK, mais on ajoute la détection offline)
  // ============================================

  useEffect(() => {
    const docRef = doc(db2, "website_content", "logo");

    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = snapshot.data() as LogoData;
          const sortedLogos = docData.logos || [];
          setLogos(sortedLogos);
        } else {
          // ✅ OK - pas de setDoc ici, c'est bien
          if (!snapshot.metadata.fromCache) {
            setLogos([]);
          }
        }
        setLogosLoading(false);
      },
      (error) => {
        console.error("Erreur Firebase logos:", error);
        setLogosLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // ============================================
  // FIREBASE SYNC - PROJETS (CORRIGÉ)
  // ============================================

  useEffect(() => {
    const docRef = doc(db2, "website_content", "projets");

    // ✅ ÉTAPE 1: Initialisation séparée (une seule fois)
    const initializeDocument = async () => {
      try {
        const { getDoc } = await import("firebase/firestore");
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          console.log("📌 Document projets n'existe pas, création...");
          await setDoc(docRef, DEFAULT_PROJETS_DATA);
        }
      } catch (error) {
        console.warn(
          "⚠️ Impossible de vérifier/créer le document projets:",
          error,
        );
      }
    };

    initializeDocument();

    // ✅ ÉTAPE 2: Listener qui N'ÉCRIT JAMAIS
    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        const metadata = snapshot.metadata;

        if (snapshot.exists()) {
          const docData = snapshot.data() as ProjetsData;
          setData({
            introduction: docData.introduction || "",
            projets: docData.projets || [],
          });
        } else {
          // ❌ NE PLUS FAIRE setDoc ICI !
          if (metadata.fromCache) {
            console.log("📴 Hors ligne - données projets depuis le cache");
            // Garder les données actuelles, ne rien faire
          } else {
            console.log(
              "⚠️ Document projets n'existe pas (sera créé à l'initialisation)",
            );
            // L'initialisation async s'en charge
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error("Erreur Firebase:", error);
        setToast({ msg: "Erreur de connexion", type: "error" });
        setLoading(false);
        // ❌ NE PAS écraser les données en cas d'erreur !
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [pendingImages]);

  // ============================================
  // HELPER: Trouver le nom du logo par URL
  // ============================================

  const getLogoNameByUrl = (logoUrl: string): string => {
    const logo = logos.find((l) => l.image === logoUrl);
    return logo?.name || "";
  };

  // ============================================
  // INTRODUCTION HANDLER
  // ============================================

  const updateIntroduction = (value: string) => {
    if (!data) return;
    setData({ ...data, introduction: value });
  };

  // ============================================
  // BOX HANDLERS
  // ============================================

  const addBox = () => {
    if (!data) return;
    const lastBox = data.projets[data.projets.length - 1];
    const newBox = createNewBox(lastBox?.imageSide);
    setData({ ...data, projets: [...data.projets, newBox] });
    setExpandedSection(newBox.id);
  };

  const duplicateBox = (boxId: string) => {
    if (!data) return;
    const boxToDuplicate = data.projets.find((b) => b.id === boxId);
    if (!boxToDuplicate) return;

    const newBox: FeatureBox = {
      ...JSON.parse(JSON.stringify(boxToDuplicate)),
      id: generateId(),
      imageSide: boxToDuplicate.imageSide === "left" ? "right" : "left",
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
    };

    const index = data.projets.findIndex((b) => b.id === boxId);
    const newprojets = [...data.projets];
    newprojets.splice(index + 1, 0, newBox);
    setData({ ...data, projets: newprojets });
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
    setData({ ...data, projets: data.projets.filter((b) => b.id !== boxId) });
    if (expandedSection === boxId) setExpandedSection(false);
  };

  const updateBox = (boxId: string, updates: Partial<FeatureBox>) => {
    if (!data) return;
    setData({
      ...data,
      projets: data.projets.map((box) =>
        box.id === boxId
          ? { ...box, ...updates, updatedAt: getTimestamp() }
          : box,
      ),
    });
  };

  const toggleImageSide = (boxId: string) => {
    if (!data) return;
    const box = data.projets.find((b) => b.id === boxId);
    if (!box) return;
    updateBox(boxId, {
      imageSide: box.imageSide === "left" ? "right" : "left",
    });
  };

  // ============================================
  // LABELS HANDLERS
  // ============================================

  const addLabel = (boxId: string) => {
    if (!data) return;
    const box = data.projets.find((b) => b.id === boxId);
    if (!box) return;

    const newLabel: LabelItem = {
      id: generateId(),
      text: `Libellé ${box.labels.length + 1}`,
    };

    updateBox(boxId, { labels: [...box.labels, newLabel] });
  };

  const updateLabel = (boxId: string, labelId: string, text: string) => {
    if (!data) return;
    const box = data.projets.find((b) => b.id === boxId);
    if (!box) return;

    const newLabels = box.labels.map((label) =>
      label.id === labelId ? { ...label, text } : label,
    );

    updateBox(boxId, { labels: newLabels });
  };

  const deleteLabel = (boxId: string, labelId: string) => {
    if (!data) return;
    const box = data.projets.find((b) => b.id === boxId);
    if (!box) return;

    updateBox(boxId, {
      labels: box.labels.filter((label) => label.id !== labelId),
    });
  };

  // ============================================
  // LIST GROUPS HANDLERS
  // ============================================

  const addListGroup = (boxId: string) => {
    if (!data) return;
    const box = data.projets.find((b) => b.id === boxId);
    if (!box) return;

    const newGroup: ListGroup = {
      id: generateId(),
      title: `Groupe ${box.listGroups.length + 1}`,
      items: [],
    };

    updateBox(boxId, { listGroups: [...box.listGroups, newGroup] });
  };

  const updateListGroupTitle = (
    boxId: string,
    groupId: string,
    title: string,
  ) => {
    if (!data) return;
    const box = data.projets.find((b) => b.id === boxId);
    if (!box) return;

    const newGroups = box.listGroups.map((group) =>
      group.id === groupId ? { ...group, title } : group,
    );

    updateBox(boxId, { listGroups: newGroups });
  };

  const deleteListGroup = (boxId: string, groupId: string) => {
    if (!data) return;
    const box = data.projets.find((b) => b.id === boxId);
    if (!box) return;

    updateBox(boxId, {
      listGroups: box.listGroups.filter((group) => group.id !== groupId),
    });
  };

  const addListItem = (boxId: string, groupId: string) => {
    if (!data) return;
    const box = data.projets.find((b) => b.id === boxId);
    if (!box) return;

    const newItem: ListItem = { id: generateId(), text: "" };
    const newGroups = box.listGroups.map((group) =>
      group.id === groupId
        ? { ...group, items: [...group.items, newItem] }
        : group,
    );

    updateBox(boxId, { listGroups: newGroups });
  };

  const updateListItem = (
    boxId: string,
    groupId: string,
    itemId: string,
    text: string,
  ) => {
    if (!data) return;
    const box = data.projets.find((b) => b.id === boxId);
    if (!box) return;

    const newGroups = box.listGroups.map((group) =>
      group.id === groupId
        ? {
            ...group,
            items: group.items.map((item) =>
              item.id === itemId ? { ...item, text } : item,
            ),
          }
        : group,
    );

    updateBox(boxId, { listGroups: newGroups });
  };

  const deleteListItem = (boxId: string, groupId: string, itemId: string) => {
    if (!data) return;
    const box = data.projets.find((b) => b.id === boxId);
    if (!box) return;

    const newGroups = box.listGroups.map((group) =>
      group.id === groupId
        ? { ...group, items: group.items.filter((item) => item.id !== itemId) }
        : group,
    );

    updateBox(boxId, { listGroups: newGroups });
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

    const box = data.projets.find((b) => b.id === boxId);
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

    const box = data?.projets.find((b) => b.id === boxId);
    if (box) {
      updateBox(boxId, { image: { ...box.image, imageUrl: "" } });
    }

    setToast({ msg: "Modification annulée", type: "info" });
  };

  // ============================================
  // SAVE HANDLER (modifié avec introduction)
  // ============================================

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);

    try {
      let updatedprojets = [...data.projets];

      // Upload des images en attente
      for (const [boxId, pending] of pendingImages) {
        try {
          const compressedFile = await imageCompression(
            pending.file,
            COMPRESSION_OPTIONS,
          );

          const formData = new FormData();
          formData.append("file", compressedFile);

          const box = updatedprojets.find((b) => b.id === boxId);
          if (box?.image.imageId) {
            formData.append("publicId", box.image.imageId);
          }

          const res = await fetch("/api/cloudinary/uploadweb/projets", {
            method: "POST",
            body: formData,
          });

          const resData = await res.json();

          if (!res.ok) throw new Error(resData.error || "Erreur upload");

          updatedprojets = updatedprojets.map((b) =>
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

      // ✅ Sauvegarde dans Firebase AVEC introduction
      const docRef = doc(db2, "website_content", "projets");
      await updateDoc(docRef, {
        introduction: data.introduction,
        projets: updatedprojets,
      });

      setData({
        introduction: data.introduction,
        projets: updatedprojets,
      });
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

  const hexToRgba = (hex: string, alpha: number) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split("");
      if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = "0x" + c.join("");
      return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",")},${alpha})`;
    }
    return hex;
  };

  const renderSection = (box: FeatureBox, index: number) => {
    const isExpanded = expandedSection === box.id;
    const hasPendingImage = pendingImages.has(box.id);
    const primaryColor = box.theme.primaryColor;
    const isImageRight = box.imageSide === "right";

    return (
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
              {box.content.title || `Feature ${index + 1}`}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: isExpanded ? "rgba(255,255,255,0.75)" : "text.secondary",
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
            <Tooltip title="Dupliquer">
              <IconButton
                {...compactStyles.iconButton}
                onClick={() => duplicateBox(box.id)}
                sx={{
                  ...compactStyles.iconButton.sx,
                  color: isExpanded ? "white" : primaryColor,
                }}
              >
                <AddIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
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
                    {box.image.logo ? (
                      <Box
                        component="img"
                        src={box.image.logo}
                        alt="Logo sélectionné"
                        sx={{
                          width: 48,
                          height: 48,
                          objectFit: "contain",
                          mb: 0.5,
                        }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          bgcolor: primaryColor,
                          width: 32,
                          height: 32,
                          mb: 0.5,
                        }}
                      >
                        <ImageIcon fontSize="small" />
                      </Avatar>
                    )}
                    <Typography variant="caption" color="textSecondary">
                      {box.image.logo
                        ? getLogoNameByUrl(box.image.logo)
                        : "No Image"}
                    </Typography>
                  </Stack>
                )}

                {/* Badge logo en haut à gauche */}
                {box.image.logo && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      width: 28,
                      height: 28,
                      borderRadius: "6px",
                      bgcolor: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: 1,
                      p: 0.3,
                    }}
                  >
                    <Box
                      component="img"
                      src={box.image.logo}
                      alt="Logo"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </Box>
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
                    background: primaryColor,
                    fontSize: "0.75rem",
                    "&:hover": { background: alpha(primaryColor, 0.9) },
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

                {/* SÉLECTEUR DE LOGO */}
                <FormControl size="small" fullWidth variant="outlined">
                  <InputLabel style={{ fontSize: 13 }}>Logo</InputLabel>
                  <Select
                    value={box.image.logo ?? ""}
                    label="Logo"
                    onChange={(e) =>
                      updateBox(box.id, {
                        image: { ...box.image, logo: e.target.value as string },
                      })
                    }
                    sx={{ fontSize: 13 }}
                    MenuProps={{
                      PaperProps: {
                        sx: { maxHeight: 300 },
                      },
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: 13 }}>
                      <em>Aucun logo</em>
                    </MenuItem>
                    {/* Liste des logos */}
                    {logosLoading ? (
                      <MenuItem disabled sx={{ fontSize: 13 }}>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        Chargement...
                      </MenuItem>
                    ) : logos.length === 0 ? (
                      <MenuItem disabled sx={{ fontSize: 13 }}>
                        Aucun logo disponible
                      </MenuItem>
                    ) : (
                      logos.map((logo) => (
                        <MenuItem
                          key={logo.id}
                          value={logo.image}
                          sx={{ fontSize: 13 }}
                        >
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Box
                              component="img"
                              src={logo.image}
                              alt={logo.name}
                              sx={{
                                width: 28,
                                height: 28,
                                objectFit: "contain",
                                borderRadius: 0.5,
                                bgcolor: "#f5f5f5",
                                p: 0.25,
                              }}
                            />
                            <Typography variant="body2">{logo.name}</Typography>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>

                {/* BOUTON POUR AJOUTER UN NOUVEAU LOGO */}
                <LogoEditor />

                {/* SÉLECTEUR DE COULEUR */}
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
                {/* LABELS DYNAMIQUES */}
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
                      <TagIcon
                        sx={{
                          fontSize: 14,
                          mr: 0.5,
                          verticalAlign: "text-bottom",
                        }}
                      />
                      Libellés
                    </Typography>
                    <Button
                      {...compactStyles.button}
                      startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                      onClick={() => addLabel(box.id)}
                      sx={{ ...compactStyles.button.sx, color: primaryColor }}
                    >
                      Ajouter
                    </Button>
                  </Stack>

                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {box.labels.map((label) => (
                      <Stack
                        key={label.id}
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        sx={{
                          bgcolor: alpha(primaryColor, 0.08),
                          borderRadius: 1,
                          px: 1,
                          py: 0.5,
                        }}
                      >
                        <TextField
                          variant="standard"
                          placeholder="Libellé..."
                          value={label.text}
                          onChange={(e) =>
                            updateLabel(box.id, label.id, e.target.value)
                          }
                          InputProps={{
                            disableUnderline: true,
                            style: { fontSize: 13 },
                          }}
                          sx={{ width: 100 }}
                        />
                        <IconButton
                          {...compactStyles.iconButton}
                          color="error"
                          onClick={() => deleteLabel(box.id, label.id)}
                          disabled={box.labels.length <= 1}
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                </Box>

                <Divider sx={{ my: 1 }} />

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

                {/* GROUPES DE LISTES */}
                <Box>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
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
                      Groupes de Listes
                    </Typography>
                    <Button
                      {...compactStyles.button}
                      startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                      onClick={() => addListGroup(box.id)}
                      sx={{ ...compactStyles.button.sx, color: primaryColor }}
                    >
                      Nouveau groupe
                    </Button>
                  </Stack>

                  <Stack
                    spacing={2}
                    maxHeight={{ sm: "200px" }}
                    sx={{ overflowY: "scroll" }}
                    p={2}
                    boxShadow={`0 0 15px 1px ${primaryColor}`}
                    borderRadius={1}
                  >
                    {box.listGroups.map((group, groupIdx) => (
                      <Paper
                        key={group.id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          borderColor: alpha(primaryColor, 0.2),
                        }}
                      >
                        {/* Titre du groupe */}
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          mb={1}
                        >
                          <Chip
                            label={groupIdx + 1}
                            size="small"
                            sx={{
                              bgcolor: primaryColor,
                              color: "white",
                              minWidth: 24,
                              height: 20,
                              fontSize: "0.7rem",
                            }}
                          />
                          <TextField
                            label="Titre du groupe"
                            fullWidth
                            {...compactStyles.textField}
                            value={group.title}
                            onChange={(e) =>
                              updateListGroupTitle(
                                box.id,
                                group.id,
                                e.target.value,
                              )
                            }
                          />
                          <Button
                            {...compactStyles.button}
                            size="small"
                            onClick={() => addListItem(box.id, group.id)}
                            sx={{
                              ...compactStyles.button.sx,
                              color: primaryColor,
                              minWidth: "auto",
                            }}
                          >
                            <AddIcon sx={{ fontSize: 14 }} />
                          </Button>
                          <IconButton
                            {...compactStyles.iconButton}
                            color="error"
                            onClick={() => deleteListGroup(box.id, group.id)}
                          >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Stack>

                        {/* Items du groupe */}
                        <Stack spacing={0.5} sx={{ pl: 4 }}>
                          {group.items.map((item) => (
                            <Stack
                              key={item.id}
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                            >
                              <Typography
                                sx={{
                                  color: primaryColor,
                                  fontSize: "0.75rem",
                                  minWidth: 16,
                                }}
                              >
                                •
                              </Typography>
                              <TextField
                                fullWidth
                                placeholder="Élément..."
                                {...compactStyles.textField}
                                value={item.text}
                                onChange={(e) =>
                                  updateListItem(
                                    box.id,
                                    group.id,
                                    item.id,
                                    e.target.value,
                                  )
                                }
                              />
                              <IconButton
                                {...compactStyles.iconButton}
                                color="error"
                                onClick={() =>
                                  deleteListItem(box.id, group.id, item.id)
                                }
                              >
                                <DeleteIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Stack>
                          ))}

                          {group.items.length === 0 && (
                            <Typography
                              sx={{
                                ...compactStyles.typography.caption,
                                fontStyle: "italic",
                                py: 0.5,
                                color: "text.secondary",
                              }}
                            >
                              Aucun élément - cliquez + pour ajouter
                            </Typography>
                          )}
                        </Stack>
                      </Paper>
                    ))}

                    {box.listGroups.length === 0 && (
                      <Typography
                        sx={{
                          ...compactStyles.typography.caption,
                          fontStyle: "italic",
                          py: 0.5,
                          color: "text.secondary",
                        }}
                      >
                        Aucun groupe de liste
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
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
                label={`${data.projets.length} feature${data.projets.length > 1 ? "s" : ""}`}
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
                    <CircularProgress size={14} />
                  ) : (
                    <SaveIcon sx={{ fontSize: 16 }} />
                  )
                }
                onClick={handleSave}
                disabled={saving}
                sx={{
                  ...compactStyles.button.sx,
                  bgcolor: hasPendingChanges ? "#ed6c02" : "white",
                  color: hasPendingChanges ? THEME_COLORS.olive : "white",
                  "&:hover": {
                    bgcolor: hasPendingChanges ? "#e65100" : "#f5f5f5",
                  },
                  "&:disabled": {
                    bgcolor: "#ccc",
                    color: "#ffffff",
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
        <ProjetsPreview
          projets={data.projets}
          // introduction={data.introduction}
          onAddBox={addBox}
          themeColor={THEME_COLORS.olive}
          maxHeight="80vh"
        />
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
            url="projets"
          />

          {/* ✅ CHAMP INTRODUCTION CONNECTÉ */}
          <StyledTextField
            fullWidth
            label="Introduction"
            value={data.introduction}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateIntroduction(e.target.value)
            }
            multiline
            rows={3}
            placeholder="Ex: Une agence de communication engagée..."
            sx={{ my: 1, borderRadius: 1 }}
          />

          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
            <Button
              variant="contained"
              {...compactStyles.button}
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={addBox}
              sx={{
                ...compactStyles.button.sx,
                bgcolor: THEME_COLORS.olive,
                pt: 1,
              }}
            >
              Nouvelle Box
            </Button>
          </Stack>

          {data.projets.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
              <ImageIcon sx={{ fontSize: 40, color: "#ccc", mb: 1 }} />
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Aucune feature
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
            data.projets.map((box, index) => renderSection(box, index))
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
