// components/sections/PhotosSection.tsx
"use client";

import React from "react";
import {
  Box,
  Typography,
  Grid,
  Stack,
  Chip,
  Paper,
  Button,
  alpha,
} from "@mui/material";
import { Add as AddIcon, Photo as PhotoIcon } from "@mui/icons-material";
import { Camera } from "lucide-react";

import { PhotoItem } from "../types";
import { THEME } from "../constants";
import PhotoCard from "../cards/PhotoCard";
interface PhotosSectionProps {
  photos: PhotoItem[];
  totalPending: number;
  isSmall: boolean;
  isPendingPhoto: (id: string) => boolean;
  updatingItem: string | null;
  deletingItem: string | null;
  onAdd: () => void;
  onEdit: (photo: PhotoItem) => void;
  onDelete: (photoId: string) => void;
}

export default function PhotosSection({
  photos,
  totalPending,
  isSmall,
  isPendingPhoto,
  updatingItem,
  deletingItem,
  onAdd,
  onEdit,
  onDelete,
}: PhotosSectionProps) {
  return (
    <Box>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={{ xs: 1.5, sm: 2 }}
        mb={{ xs: 2, md: 4 }}
      >
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            mb={0.5}
            flexWrap="wrap"
          >
            <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-accent-warm" />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.5rem" },
              }}
            >
              Photos
            </Typography>
            {totalPending > 0 && (
              <Chip
                size="small"
                label={`${totalPending} en attente`}
                sx={{
                  bgcolor: THEME.accent.orange,
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.65rem",
                  height: 22,
                }}
              />
            )}
          </Stack>
          <Typography
            variant="body2"
            color={THEME.neutral[500]}
            sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
          >
            Gérez votre galerie photo
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
          onClick={onAdd}
          size={isSmall ? "small" : "medium"}
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 1, sm: 1.5 },
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: { xs: "0.8rem", sm: "0.875rem" },
            background: "#616637",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
            "&:hover": {
              transform: "translateY(-2px)",
              background: "#4a4f2a",
            },
            transition: "all 0.3s ease",
          }}
        >
          {isSmall ? "Ajouter" : "Nouvelle photo"}
        </Button>
      </Stack>

      {/* Grid */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
        {photos.map((photo, index) => (
          <Grid item xs={6} sm={6} md={4} lg={3} key={photo.id}>
            <PhotoCard
              photo={photo}
              index={index}
              isPending={isPendingPhoto(photo.id)}
              isUpdating={updatingItem === photo.id}
              isDeleting={deletingItem === photo.id}
              isSmall={isSmall}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </Grid>
        ))}

        {/* Empty State */}
        {photos.length === 0 && (
          <Grid item xs={12}>
            <Paper
              sx={{
                p: { xs: 3, sm: 4, md: 6 },
                textAlign: "center",
                borderRadius: { xs: 2, md: 3 },
                bgcolor: "white",
                border: `2px dashed ${THEME.neutral[300]}`,
              }}
            >
              <Box
                sx={{
                  width: { xs: 50, sm: 60, md: 80 },
                  height: { xs: 50, sm: 60, md: 80 },
                  borderRadius: "50%",
                  bgcolor: alpha(THEME.secondary.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: { xs: 2, md: 3 },
                }}
              >
                <PhotoIcon
                  sx={{
                    fontSize: { xs: 28, sm: 32, md: 40 },
                    color: THEME.secondary.main,
                  }}
                />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  color: THEME.neutral[700],
                  mb: 1,
                  fontSize: { xs: "1rem", md: "1.25rem" },
                }}
              >
                Aucune photo
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: THEME.neutral[500],
                  mb: { xs: 2, md: 3 },
                  fontSize: { xs: "0.75rem", md: "0.875rem" },
                }}
              >
                Commencez par ajouter votre première photo
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAdd}
                size={isSmall ? "small" : "medium"}
                sx={{
                  background: THEME.secondary.gradient,
                  textTransform: "none",
                  fontWeight: 600,
                  px: { xs: 2, md: 4 },
                  py: { xs: 1, md: 1.5 },
                  borderRadius: 2,
                }}
              >
                Ajouter une photo
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}