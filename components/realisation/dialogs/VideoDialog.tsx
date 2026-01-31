// components/dialogs/VideoDialog.tsx
"use client";

import React from "react";
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
} from "@mui/material";
import {
  YouTube as YouTubeIcon,
  PlayCircleOutline as PlayIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

import { VideoItem, VideoDialogState } from "../types";
import { THEME, CLIENT_OPTIONS } from "../constants";
import {
  isValidYouTubeUrl,
  getYouTubeThumbnail,
  getYouTubeVideoId,
} from "../utils";

interface VideoDialogProps {
  dialogState: VideoDialogState;
  isSmall: boolean;
  isUpdating: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (data: VideoItem) => void;
}

export default function VideoDialog({
  dialogState,
  isSmall,
  isUpdating,
  onClose,
  onSave,
  onChange,
}: VideoDialogProps) {
  const { open, mode, data } = dialogState;

  if (!data) return null;

  const handleFieldChange = (field: keyof VideoItem, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isSmall}
      PaperProps={{
        sx: {
          borderRadius: isSmall ? 0 : 3,
          overflow: "hidden",
          m: isSmall ? 0 : 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          background: THEME.youtube.gradient,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: { xs: 1.5, sm: 2 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <YouTubeIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
          >
            {mode === "add" ? "Nouvelle vidéo" : "Modifier la vidéo"}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Stack spacing={{ xs: 2, sm: 3 }} pt={{ xs: 1, sm: 2 }}>
          {/* Aperçu YouTube */}
          {isValidYouTubeUrl(data.videoUrl) && (
            <Box
              sx={{
                width: "100%",
                aspectRatio: "16/9",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: THEME.neutral[900],
                position: "relative",
              }}
            >
              <Box
                component="img"
                src={getYouTubeThumbnail(data.videoUrl)}
                alt="Aperçu YouTube"
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e: any) => {
                  const videoId = getYouTubeVideoId(data.videoUrl);
                  if (videoId) {
                    e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                  }
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.3)",
                }}
              >
                <Box
                  sx={{
                    width: { xs: 48, sm: 64 },
                    height: { xs: 34, sm: 44 },
                    borderRadius: 1.5,
                    bgcolor: THEME.youtube.main,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PlayIcon
                    sx={{ fontSize: { xs: 24, sm: 32 }, color: "white" }}
                  />
                </Box>
              </Box>
            </Box>
          )}

          {/* Lien YouTube */}
          <TextField
            label="Lien YouTube"
            fullWidth
            size={isSmall ? "small" : "medium"}
            value={data.videoUrl}
            onChange={(e) => handleFieldChange("videoUrl", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            helperText={
              data.videoUrl && !isValidYouTubeUrl(data.videoUrl)
                ? "⚠️ Lien YouTube invalide"
                : "Collez le lien de votre vidéo YouTube"
            }
            error={data.videoUrl !== "" && !isValidYouTubeUrl(data.videoUrl)}
            InputProps={{
              startAdornment: (
                <YouTubeIcon
                  sx={{
                    mr: 1,
                    color: THEME.youtube.main,
                    fontSize: { xs: 18, sm: 24 },
                  }}
                />
              ),
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          {/* Titre */}
          <TextField
            label="Titre"
            fullWidth
            size={isSmall ? "small" : "medium"}
            value={data.title}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          {/* Description */}
          <TextField
            label="Description"
            fullWidth
            size={isSmall ? "small" : "medium"}
            multiline
            rows={isSmall ? 2 : 3}
            value={data.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          {/* Client et Date */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Client"
                fullWidth
                size={isSmall ? "small" : "medium"}
                value={data.client}
                onChange={(e) => handleFieldChange("client", e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              >
                {CLIENT_OPTIONS.map((client) => (
                  <MenuItem key={client.value} value={client.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: client.color,
                        }}
                      />
                      <span
                        style={{ fontSize: isSmall ? "0.875rem" : "1rem" }}
                      >
                        {client.label}
                      </span>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date de réalisation"
                type="date"
                fullWidth
                size={isSmall ? "small" : "medium"}
                value={data.date}
                onChange={(e) => handleFieldChange("date", e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <CalendarIcon
                      sx={{
                        mr: 1,
                        color: THEME.neutral[400],
                        fontSize: { xs: 18, sm: 24 },
                      }}
                    />
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: { xs: 2, sm: 3 },
          borderTop: `1px solid ${THEME.neutral[200]}`,
          flexDirection: { xs: "column", sm: "row" },
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          fullWidth={isSmall}
          sx={{
            textTransform: "none",
            color: THEME.neutral[600],
            px: 3,
            order: { xs: 2, sm: 1 },
          }}
        >
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          fullWidth={isSmall}
          disabled={
            !data.title || !isValidYouTubeUrl(data.videoUrl) || isUpdating
          }
          sx={{
            background: THEME.youtube.gradient,
            textTransform: "none",
            fontWeight: 600,
            px: 4,
            borderRadius: 2,
            color: "white",
            order: { xs: 1, sm: 2 },
          }}
        >
          {isUpdating ? (
            <CircularProgress size={20} sx={{ color: "white" }} />
          ) : mode === "add" ? (
            "Ajouter"
          ) : (
            "Mettre à jour"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}