// ============================================
// IMAGE UPLOAD CARD - Composant réutilisable pour upload d'image
// ============================================

"use client";
import React from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  IconButton,
  Chip,
  alpha,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ImageIcon from "@mui/icons-material/Image";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

// ============================================
// TYPES
// ============================================

export interface ImageUploadCardProps {
  // Image actuelle
  imageUrl: string;
  imageAlt?: string;
  
  // États
  isPending?: boolean;
  isLoading?: boolean;
  
  // Couleur du thème
  themeColor?: string;
  
  // Icône optionnelle à afficher quand pas d'image
  placeholderIcon?: React.ReactNode;
  placeholderText?: string;
  
  // Overlay optionnel (pour titre/sous-titre comme dans HeroImage)
  overlay?: React.ReactNode;
  
  // Badge en haut à droite (ex: couleur du thème)
  showColorBadge?: boolean;
  
  // Aspect ratio
  aspectRatio?: string;
  
  // Callbacks
  onImageSelect: (file: File) => void;
  onCancelPending?: () => void;
  
  // Labels personnalisables
  uploadButtonLabel?: string;
  pendingButtonLabel?: string;
  
  // Styles additionnels
  sx?: object;
  containerSx?: object;
}

// ============================================
// COMPOSANT
// ============================================

const ImageUploadCard: React.FC<ImageUploadCardProps> = ({
  imageUrl,
  imageAlt = "",
  isPending = false,
  isLoading = false,
  themeColor = "#616637",
  placeholderIcon,
  placeholderText = "Aucune image",
  overlay,
  showColorBadge = false,
  aspectRatio = "16/9",
  onImageSelect,
  onCancelPending,
  uploadButtonLabel = "Upload",
  pendingButtonLabel = "Changer",
  sx = {},
  containerSx = {},
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
    // Reset input pour permettre de re-sélectionner le même fichier
    e.target.value = "";
  };

  return (
    <Box sx={{ width: "100%", ...containerSx }}>
      {/* Zone d'aperçu de l'image */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          aspectRatio,
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "#f1f5f9",
          border: isPending
            ? `3px dashed #ed6c02`
            : `2px dashed ${alpha(themeColor, 0.5)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transition: "all 0.3s ease",
          "&:hover": {
            borderColor: themeColor,
          },
          ...sx,
        }}
      >
        {imageUrl ? (
          <>
            {/* Image avec overlay optionnel */}
            <Box
              sx={{
                width: "100%",
                height: "100%",
                position: "relative",
              }}
            >
              <Box
                component="img"
                src={imageUrl}
                alt={imageAlt}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              
              {/* Overlay (titre, sous-titre, etc.) */}
              {overlay && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {overlay}
                </Box>
              )}
            </Box>

            {/* Badge "En attente" */}
            {isPending && (
              <Chip
                icon={<HourglassEmptyIcon sx={{ fontSize: 14 }} />}
                label="Non enregistrée"
                size="small"
                onDelete={onCancelPending}
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  bgcolor: "#ed6c02",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.65rem",
                  "& .MuiChip-deleteIcon": {
                    color: "#fff",
                    "&:hover": { color: "#ffcdd2" },
                  },
                }}
              />
            )}

            {/* Badge couleur thème */}
            {showColorBadge && (
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  bgcolor: themeColor,
                  boxShadow: 1,
                  border: "2px solid white",
                }}
              />
            )}
          </>
        ) : (
          // Placeholder quand pas d'image
          <Stack alignItems="center" justifyContent="center" spacing={1}>
            {placeholderIcon || (
              <ImageIcon sx={{ fontSize: 48, color: "#94a3b8" }} />
            )}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.8rem" }}
            >
              {placeholderText}
            </Typography>
          </Stack>
        )}
      </Paper>

      {/* Boutons d'action */}
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        <Button
          component="label"
          variant="contained"
          fullWidth
          size="small"
          disabled={isLoading}
          startIcon={
            isPending ? (
              <HourglassEmptyIcon sx={{ fontSize: 16 }} />
            ) : (
              <CloudUploadIcon sx={{ fontSize: 16 }} />
            )
          }
          sx={{
            bgcolor: isPending ? "#ed6c02" : themeColor,
            fontSize: "0.75rem",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              bgcolor: isPending
                ? alpha("#ed6c02", 0.9)
                : alpha(themeColor, 0.9),
            },
          }}
        >
          {isPending ? pendingButtonLabel : uploadButtonLabel}
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleFileChange}
          />
        </Button>

        {isPending && onCancelPending && (
          <IconButton
            size="small"
            color="warning"
            onClick={onCancelPending}
            sx={{ border: "1px solid #ed6c02" }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
    </Box>
  );
};

export default ImageUploadCard;