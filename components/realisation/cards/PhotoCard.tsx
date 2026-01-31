// components/PhotoCard.tsx
"use client";

import React from "react";
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Stack,
  Chip,
  Card,
  CardMedia,
  CardContent,
  Divider,
  Grow,
  alpha,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Photo as PhotoIcon,
  HourglassEmpty as PendingIcon,
  Collections as GalleryIcon,
} from "@mui/icons-material";

import { PhotoItem } from "../types";
import { THEME } from "../constants";
import { getClientColor, formatDateDisplay } from "../utils";

interface PhotoCardProps {
  photo: PhotoItem;
  index: number;
  isPending: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isSmall: boolean;
  onEdit: (photo: PhotoItem) => void;
  onDelete: (photoId: string) => void;
}

export default function PhotoCard({
  photo,
  index,
  isPending,
  isUpdating,
  isDeleting,
  isSmall,
  onEdit,
  onDelete,
}: PhotoCardProps) {
  const firstImage =
    photo.images && photo.images.length > 0 ? photo.images[0] : null;
  const imageCount = photo.images ? photo.images.length : 0;

  return (
    <Grow in timeout={300 + index * 100}>
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: { xs: 2, md: 3 },
          overflow: "hidden",
          border: isPending
            ? `2px dashed ${THEME.accent.orange}`
            : `1px solid ${THEME.neutral[200]}`,
          transition: "all 0.3s ease",
          "&:hover": {
            transform: { xs: "none", md: "translateY(-8px)" },
            boxShadow: {
              xs: "0 4px 12px rgba(0,0,0,0.1)",
              md: "0 20px 40px rgba(0,0,0,0.1)",
            },
            "& .photo-overlay": { opacity: 1 },
          },
        }}
      >
        <Box sx={{ position: "relative" }}>
          {isPending && (
            <Chip
              icon={<PendingIcon sx={{ fontSize: 12 }} />}
              label="En attente"
              size="small"
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                zIndex: 5,
                bgcolor: THEME.accent.orange,
                color: "white",
                fontWeight: 600,
                fontSize: "0.6rem",
                height: 20,
                "& .MuiChip-icon": { fontSize: 12 },
              }}
            />
          )}

          <CardMedia
            sx={{
              height: { xs: 120, sm: 160, md: 220 },
              bgcolor: THEME.neutral[100],
              position: "relative",
            }}
          >
            {firstImage ? (
              <>
                <Box
                  component="img"
                  src={firstImage.imageUrl}
                  alt={photo.title}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {imageCount > 1 && (
                  <Chip
                    icon={<GalleryIcon sx={{ fontSize: 12 }} />}
                    label={`${imageCount}`}
                    size="small"
                    sx={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      bgcolor: "rgba(0,0,0,0.7)",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.65rem",
                      height: 22,
                      "& .MuiChip-icon": { color: "white" },
                    }}
                  />
                )}
                <Box
                  className="photo-overlay"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
                    opacity: 0,
                    transition: "opacity 0.3s ease",
                  }}
                />
              </>
            ) : (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PhotoIcon
                  sx={{
                    fontSize: { xs: 32, sm: 48, md: 60 },
                    color: THEME.neutral[300],
                  }}
                />
              </Box>
            )}
          </CardMedia>
        </Box>

        <CardContent sx={{ flex: 1, p: { xs: 1, sm: 1.5, md: 2.5 } }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: THEME.neutral[800],
              mb: 0.5,
              fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
              lineHeight: 1.3,
            }}
            noWrap
          >
            {photo.title || "Sans titre"}
          </Typography>
          {!isSmall && (
            <Typography
              variant="body2"
              sx={{
                color: THEME.neutral[500],
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                lineHeight: 1.4,
                mb: 1.5,
                minHeight: { sm: 36, md: 42 },
                fontSize: { sm: "0.75rem", md: "0.875rem" },
              }}
            >
              {photo.description || "Pas de description"}
            </Typography>
          )}
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            flexWrap="wrap"
            gap={0.5}
          >
            {photo.client && (
              <Chip
                size="small"
                label={photo.client}
                sx={{
                  bgcolor: alpha(getClientColor(photo.client), 0.1),
                  color: getClientColor(photo.client),
                  fontWeight: 600,
                  fontSize: { xs: "0.55rem", sm: "0.65rem", md: "0.75rem" },
                  height: { xs: 18, sm: 22, md: 24 },
                }}
              />
            )}
            <Chip
              size="small"
              label={formatDateDisplay(photo.date)}
              variant="outlined"
              sx={{
                borderColor: THEME.neutral[300],
                color: THEME.neutral[600],
                fontSize: { xs: "0.55rem", sm: "0.65rem", md: "0.75rem" },
                height: { xs: 18, sm: 22, md: 24 },
              }}
            />
          </Stack>
        </CardContent>

        <Divider />

        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={0.5}
          sx={{ p: { xs: 0.5, sm: 1, md: 1.5 }, bgcolor: THEME.neutral[50] }}
        >
          <IconButton
            size="small"
            onClick={() => onEdit(photo)}
            disabled={isUpdating}
            sx={{
              color: THEME.secondary.main,
              bgcolor: alpha(THEME.secondary.main, 0.1),
              width: { xs: 28, sm: 32, md: 36 },
              height: { xs: 28, sm: 32, md: 36 },
              "&:hover": { bgcolor: alpha(THEME.secondary.main, 0.2) },
            }}
          >
            {isUpdating ? (
              <CircularProgress size={14} sx={{ color: THEME.secondary.main }} />
            ) : (
              <EditIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
            )}
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(photo.id)}
            disabled={isDeleting}
            sx={{
              color: "#EF4444",
              bgcolor: alpha("#EF4444", 0.1),
              width: { xs: 28, sm: 32, md: 36 },
              height: { xs: 28, sm: 32, md: 36 },
              "&:hover": { bgcolor: alpha("#EF4444", 0.2) },
            }}
          >
            {isDeleting ? (
              <CircularProgress size={14} sx={{ color: "#EF4444" }} />
            ) : (
              <DeleteIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
            )}
          </IconButton>
        </Stack>
      </Card>
    </Grow>
  );
}