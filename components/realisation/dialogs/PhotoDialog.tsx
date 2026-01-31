// components/dialogs/PhotoDialog.tsx
"use client";

import React, { useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Grid,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Chip,
  Alert,
  alpha,
  Fade,
  LinearProgress,
} from "@mui/material";
import {
  Collections as GalleryIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  Add as AddIcon,
  HourglassEmpty as PendingIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
  Edit as EditIcon,
  Block as BlockIcon,
} from "@mui/icons-material";

import {
  PhotoItem,
  PhotoDialogState,
  TempDialogImage,
  ImageItem,
} from "../types";
import { THEME, CLIENT_OPTIONS } from "../constants";

// ============================================================
// CONSTANTS
// ============================================================

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_KB = 150;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_KB * 1024;

// ============================================================
// IMAGE COMPRESSION UTILITY
// ============================================================

interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
}

async function compressImage(
  file: File,
  maxSizeKB: number = MAX_FILE_SIZE_KB,
): Promise<CompressionResult> {
  const originalSize = file.size;
  const maxSizeBytes = maxSizeKB * 1024;

  // Si déjà sous la limite, retourner tel quel
  if (file.size <= maxSizeBytes) {
    return { file, originalSize, compressedSize: file.size };
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculer les dimensions optimales
      let { width, height } = img;
      const maxDimension = 1200;

      // Redimensionner si trop grand
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      // Compression progressive
      const tryCompress = (quality: number): void => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Compression failed"));
              return;
            }

            // Si sous la limite ou qualité minimale atteinte
            if (blob.size <= maxSizeBytes || quality <= 0.1) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve({
                file: compressedFile,
                originalSize,
                compressedSize: blob.size,
              });
            } else {
              // Réduire la qualité et réessayer
              tryCompress(quality - 0.1);
            }
          },
          "image/jpeg",
          quality,
        );
      };

      tryCompress(0.9);
    };

    img.onerror = () => reject(new Error("Image load failed"));
    img.src = URL.createObjectURL(file);
  });
}

async function compressMultipleImages(
  files: File[],
): Promise<CompressionResult[]> {
  const results = await Promise.all(
    files.map((file) => compressImage(file, MAX_FILE_SIZE_KB)),
  );
  return results;
}

// ============================================================
// STYLES
// ============================================================

const styles = {
  dialog: (isSmall: boolean) => ({
    borderRadius: isSmall ? 0 : 3,
    overflow: "hidden",
    m: isSmall ? 0 : 2,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  }),

  header: {
    wrapper: {
      background:
        "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
      position: "relative",
      overflow: "hidden",
      color: "white",
      py: { xs: 1.5, sm: 2 },
      px: { xs: 2, sm: 3 },
      mb: 1,
    },
    decorativeCircle: {
      position: "absolute",
      width: 200,
      height: 200,
      borderRadius: "50%",
      background: alpha("#fff", 0.1),
      top: -80,
      right: -40,
    },
    content: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "relative",
      zIndex: 1,
    },
    iconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 2,
      bgcolor: alpha("#fff", 0.2),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      mr: 1.5,
    },
    closeButton: {
      color: "white",
      bgcolor: alpha("#fff", 0.15),
      "&:hover": { bgcolor: alpha("#fff", 0.25) },
    },
  },

  content: {
    wrapper: {
      p: { xs: 2, sm: 2.5 },
    },
    sectionTitle: {
      fontWeight: 600,
      mb: 1.5,
      fontSize: "0.85rem",
      color: THEME.neutral[700],
      display: "flex",
      alignItems: "center",
      gap: 0.75,
    },
  },

  uploadButton: (disabled: boolean) => ({
    mb: 1.5,
    py: 1.5,
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.8rem",
    borderColor: disabled
      ? THEME.neutral[300]
      : alpha(THEME.secondary.main, 0.4),
    borderStyle: "dashed",
    color: disabled ? THEME.neutral[400] : THEME.secondary.main,
    bgcolor: disabled ? THEME.neutral[100] : "transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    "&:hover": disabled
      ? {}
      : {
          bgcolor: alpha(THEME.secondary.main, 0.08),
          borderColor: THEME.secondary.main,
        },
  }),

  imageGrid: {
    wrapper: {
      display: "grid",
      gridTemplateColumns: {
        xs: "repeat(3, 1fr)",
        sm: "repeat(4, 1fr)",
        md: "repeat(5, 1fr)",
      },
      gap: 1,
      maxHeight: { xs: 200, sm: 180, md: 160 },
      overflowY: "auto",
      p: 1,
      bgcolor: THEME.neutral[50],
      borderRadius: 2,
      border: `1px solid ${THEME.neutral[200]}`,
      "&::-webkit-scrollbar": { width: 4 },
      "&::-webkit-scrollbar-thumb": {
        bgcolor: THEME.neutral[300],
        borderRadius: 2,
      },
    },
  },

  imageCard: (isTemp: boolean) => ({
    wrapper: {
      position: "relative",
      aspectRatio: "1",
      borderRadius: 1.5,
      overflow: "hidden",
      border: isTemp
        ? `2px solid ${THEME.accent.orange}`
        : `1px solid ${THEME.neutral[200]}`,
      cursor: "pointer",
      transition: "all 0.2s ease",
      "&:hover": {
        transform: "scale(1.03)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        "& .delete-btn": { opacity: 1 },
      },
    },
    image: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    newBadge: {
      position: "absolute",
      top: 2,
      left: 2,
      bgcolor: THEME.accent.orange,
      color: "white",
      fontSize: "0.5rem",
      fontWeight: 700,
      height: 16,
      borderRadius: 0.75,
      "& .MuiChip-label": { px: 0.5 },
    },
    indexBadge: {
      position: "absolute",
      bottom: 2,
      left: 2,
      bgcolor: alpha("#000", 0.7),
      color: "white",
      px: 0.75,
      py: 0.25,
      borderRadius: 0.75,
      fontSize: "0.6rem",
      fontWeight: 600,
    },
    deleteButton: {
      position: "absolute",
      top: 2,
      right: 2,
      bgcolor: alpha("#EF4444", 0.9),
      color: "white",
      width: 20,
      height: 20,
      opacity: 0,
      transition: "opacity 0.2s",
      "&:hover": { bgcolor: "#DC2626" },
    },
  }),

  placeholder: {
    gridColumn: { xs: "span 3", sm: "span 4", md: "span 5" },
    py: 3,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    bgcolor: THEME.neutral[100],
    borderRadius: 2,
    border: `2px dashed ${THEME.neutral[300]}`,
    gap: 0.5,
  },

  limitBadge: (isAtLimit: boolean) => ({
    ml: 1,
    height: 20,
    fontSize: "0.7rem",
    fontWeight: 600,
    bgcolor: isAtLimit
      ? alpha("#EF4444", 0.1)
      : alpha(THEME.secondary.main, 0.1),
    color: isAtLimit ? "#EF4444" : THEME.secondary.main,
    border: `1px solid ${isAtLimit ? "#EF4444" : THEME.secondary.main}`,
  }),

  formField: {
    "& .MuiOutlinedInput-root": { borderRadius: 2 },
    "& .MuiInputBase-input": { fontSize: "0.9rem" },
  },

  actions: {
    wrapper: {
      p: { xs: 1.5, sm: 2 },
      borderTop: `1px solid ${THEME.neutral[200]}`,
      flexDirection: { xs: "column", sm: "row" },
      gap: 1,
    },
    cancelButton: {
      textTransform: "none",
      color: THEME.neutral[600],
      px: 3,
      order: { xs: 2, sm: 1 },
    },
    submitButton: {
      background: THEME.secondary.gradient,
      textTransform: "none",
      fontWeight: 600,
      px: 4,
      borderRadius: 2,
      color: "white",
      order: { xs: 1, sm: 2 },
      "&:disabled": { background: THEME.neutral[300] },
    },
  },
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

interface ImageCardProps {
  img: ImageItem;
  index: number;
  isTemp: boolean;
  onRemove: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({
  img,
  index,
  isTemp,
  onRemove,
}) => {
  const cardStyles = styles.imageCard(isTemp);

  return (
    <Box sx={cardStyles.wrapper}>
      <Box
        component="img"
        src={img.imageUrl}
        alt={`Image ${index + 1}`}
        sx={cardStyles.image}
      />

      {isTemp && <Chip label="New" size="small" sx={cardStyles.newBadge} />}

      <Box sx={cardStyles.indexBadge}>{index + 1}</Box>

      <IconButton
        className="delete-btn"
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        sx={cardStyles.deleteButton}
      >
        <CloseIcon sx={{ fontSize: 12 }} />
      </IconButton>
    </Box>
  );
};

const EmptyPlaceholder: React.FC = () => (
  <Box sx={styles.placeholder}>
    <CloudUploadIcon sx={{ fontSize: 32, color: THEME.neutral[400] }} />
    <Typography variant="caption" color={THEME.neutral[500]}>
      Aucune image
    </Typography>
  </Box>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

interface PhotoDialogProps {
  dialogState: PhotoDialogState;
  tempImages: TempDialogImage[];
  isSmall: boolean;
  isUpdating: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (data: PhotoItem) => void;
  onImagesSelect: (files: FileList) => void;
  onRemoveImage: (index: number) => void;
}

export default function PhotoDialog({
  dialogState,
  tempImages,
  isSmall,
  isUpdating,
  onClose,
  onSave,
  onChange,
  onImagesSelect,
  onRemoveImage,
}: PhotoDialogProps) {
  const { open, mode, data } = dialogState;
  const [isCompressing, setIsCompressing] = React.useState(false);
  const [compressionProgress, setCompressionProgress] = React.useState(0);

  if (!data) return null;

  const imageCount = data.images?.length || 0;
  const isAtLimit = imageCount >= MAX_IMAGES;
  const remainingSlots = MAX_IMAGES - imageCount;

  const handleFieldChange = (field: keyof PhotoItem, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const isTempImage = (imageUrl: string): boolean => {
    return tempImages.some((t) => t.previewUrl === imageUrl);
  };

  // ⭐ Handler avec compression automatique
  const handleImagesSelect = async (files: FileList) => {
    if (isAtLimit) return;

    const fileArray = Array.from(files);

    // Limiter au nombre de slots disponibles
    const filesToProcess = fileArray.slice(0, remainingSlots);

    if (filesToProcess.length === 0) return;

    setIsCompressing(true);
    setCompressionProgress(0);

    try {
      const compressedResults: File[] = [];

      for (let i = 0; i < filesToProcess.length; i++) {
        const result = await compressImage(filesToProcess[i], MAX_FILE_SIZE_KB);
        compressedResults.push(result.file);

        // Mise à jour du progrès
        setCompressionProgress(((i + 1) / filesToProcess.length) * 100);

        console.log(
          `📸 ${filesToProcess[i].name}: ${(result.originalSize / 1024).toFixed(1)}KB → ${(result.compressedSize / 1024).toFixed(1)}KB`,
        );
      }

      // Créer un FileList-like object
      const dataTransfer = new DataTransfer();
      compressedResults.forEach((file) => dataTransfer.items.add(file));

      onImagesSelect(dataTransfer.files);
    } catch (error) {
      console.error("Compression error:", error);
    } finally {
      setIsCompressing(false);
      setCompressionProgress(0);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isSmall}
      TransitionComponent={Fade}
      PaperProps={{ sx: styles.dialog(isSmall) }}
    >
      {/* ==================== HEADER ==================== */}
      <DialogTitle sx={styles.header.wrapper}>
        <Box
          sx={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.1)",
            top: -100,
            right: -50,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 150,
            height: 150,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.08)",
            bottom: -30,
            left: "30%",
          }}
        />
        <Box sx={styles.header.content}>
          <Stack direction="row" alignItems="center">
            <Box sx={styles.header.iconWrapper}>
              {mode === "add" ? (
                <AddIcon />
              ) : (
                <EditIcon sx={{ fontSize: 20 }} />
              )}
            </Box>
            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ fontSize: "1.1rem", lineHeight: 1.2 }}
              >
                {mode === "add" ? "Nouvelle photo" : "Modifier la photo"}
              </Typography>
              {imageCount > 0 && (
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {imageCount}/{MAX_IMAGES} image{imageCount > 1 ? "s" : ""}
                </Typography>
              )}
            </Box>
          </Stack>
          <IconButton
            onClick={onClose}
            sx={styles.header.closeButton}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ==================== CONTENT ==================== */}
      <DialogContent sx={styles.content.wrapper}>
        <Grid container spacing={2.5}>
          {/* SECTION IMAGES */}
          <Grid item xs={12} md={5}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              <Typography sx={{ ...styles.content.sectionTitle, mb: 0 }}>
                <ImageIcon sx={{ fontSize: 18, color: THEME.secondary.main }} />
                Images
              </Typography>
              <Chip
                label={`${imageCount}/${MAX_IMAGES}`}
                size="small"
                icon={
                  isAtLimit ? <BlockIcon sx={{ fontSize: 12 }} /> : undefined
                }
                sx={styles.limitBadge(isAtLimit)}
              />
            </Box>

            {/* ⭐ Bouton désactivé si limite atteinte */}
            <Button
              component="label"
              variant="outlined"
              fullWidth
              size="small"
              disabled={isAtLimit || isCompressing}
              startIcon={
                isCompressing ? (
                  <CircularProgress size={16} color="inherit" />
                ) : isAtLimit ? (
                  <BlockIcon />
                ) : (
                  <AddIcon />
                )
              }
              sx={styles.uploadButton(isAtLimit || isCompressing)}
            >
              {isCompressing
                ? "Compression en cours..."
                : isAtLimit
                  ? `Limite atteinte (${MAX_IMAGES} max)`
                  : `Ajouter des images (${remainingSlots} restant${remainingSlots > 1 ? "s" : ""})`}
              <input
                hidden
                accept="image/*"
                type="file"
                multiple
                disabled={isAtLimit || isCompressing}
                onChange={(e) =>
                  e.target.files && handleImagesSelect(e.target.files)
                }
              />
            </Button>

            {/* Barre de progression compression */}
            {isCompressing && (
              <Box sx={{ mb: 1.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={compressionProgress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: THEME.neutral[200],
                    "& .MuiLinearProgress-bar": {
                      bgcolor: THEME.secondary.main,
                      borderRadius: 3,
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: THEME.neutral[500], mt: 0.5, display: "block" }}
                >
                  Compression: {Math.round(compressionProgress)}%
                </Typography>
              </Box>
            )}

            {/* Grille d'images */}
            <Box sx={styles.imageGrid.wrapper}>
              {data.images?.map((img, index) => (
                <ImageCard
                  key={index}
                  img={img}
                  index={index}
                  isTemp={isTempImage(img.imageUrl)}
                  onRemove={() => onRemoveImage(index)}
                />
              ))}
              {imageCount === 0 && <EmptyPlaceholder />}
            </Box>

            {/* Info compression */}
            <Alert
              severity="info"
              sx={{
                mt: 1.5,
                py: 0.25,
                borderRadius: 2,
                fontSize: "0.7rem",
                "& .MuiAlert-icon": { fontSize: 16 },
              }}
            >
              Images auto-compressées à {MAX_FILE_SIZE_KB}KB max
            </Alert>

            {tempImages.length > 0 && (
              <Alert
                severity="warning"
                icon={<PendingIcon sx={{ fontSize: 16 }} />}
                sx={{ mt: 1, py: 0.5, borderRadius: 2, fontSize: "0.75rem" }}
              >
                {tempImages.length} image(s) en attente d'upload
              </Alert>
            )}
          </Grid>

          {/* SECTION FORMULAIRE */}
          <Grid item xs={12} md={7}>
            <Typography sx={styles.content.sectionTitle}>
              <GalleryIcon sx={{ fontSize: 18, color: THEME.secondary.main }} />
              Informations
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Titre"
                fullWidth
                size="small"
                value={data.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                sx={styles.formField}
              />

              <TextField
                label="Description"
                fullWidth
                size="small"
                multiline
                rows={3}
                value={data.description}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
                sx={styles.formField}
              />
              <TextField
                label="Lien drive"
                fullWidth
                size="small"
                value={data.driveLink ?? ""}
                onChange={(e) => handleFieldChange("driveLink", e.target.value)}
                sx={styles.formField}
              />

              <Grid container justifyContent={'space-between'} rowSpacing={{ xs: 2, sm: 0 }}
>
                <Grid item xs={12} sm={5}>
                  <TextField
                    select
                    label="Client"
                    fullWidth
                    size="small"
                    value={data.client}
                    onChange={(e) =>
                      handleFieldChange("client", e.target.value)
                    }
                    sx={styles.formField}
                  >
                    {CLIENT_OPTIONS.map((client) => (
                      <MenuItem key={client.value} value={client.value}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              bgcolor: client.color,
                            }}
                          />
                          <span>{client.label}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date"
                    type="date"
                    fullWidth
                    size="small"
                    value={data.date}
                    onChange={(e) => handleFieldChange("date", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <CalendarIcon
                          sx={{
                            mr: 1,
                            color: THEME.neutral[400],
                            fontSize: 18,
                          }}
                        />
                      ),
                    }}
                    sx={styles.formField}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      {/* ==================== ACTIONS ==================== */}
      <DialogActions sx={styles.actions.wrapper}>
        <Button
          onClick={onClose}
          fullWidth={isSmall}
          sx={styles.actions.cancelButton}
        >
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          fullWidth={isSmall}
          disabled={!data.title || isUpdating || isCompressing}
          sx={styles.actions.submitButton}
        >
          {isUpdating ? (
            <CircularProgress size={20} sx={{ color: "white" }} />
          ) : mode === "add" ? (
            `Ajouter${imageCount > 0 ? ` (${imageCount})` : ""}`
          ) : (
            "Mettre à jour"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
