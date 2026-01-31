// components/dialogs/DigitalProjectDialog.tsx
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
  Chip,
  alpha,
} from "@mui/material";
import {
  Language as WebIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  HourglassEmpty as PendingIcon,
  Code as CodeIcon,
  Link as LinkIcon,
  Devices as DevicesIcon,
} from "@mui/icons-material";

import { DigitalProjectItem, DigitalProjectDialogState, TempDialogImage } from "../types";
import { THEME, CLIENT_OPTIONS, TECHNOLOGY_OPTIONS } from "../constants";
import { isValidProjectUrl } from "../utils";

interface DigitalProjectDialogProps {
  dialogState: DigitalProjectDialogState;
  tempImage: TempDialogImage | null;
  isSmall: boolean;
  isUpdating: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (data: DigitalProjectItem) => void;
  onImageSelect: (file: File) => void;
}

export default function DigitalProjectDialog({
  dialogState,
  tempImage,
  isSmall,
  isUpdating,
  onClose,
  onSave,
  onChange,
  onImageSelect,
}: DigitalProjectDialogProps) {
  const { open, mode, data } = dialogState;

  if (!data) return null;

  const handleFieldChange = (field: keyof DigitalProjectItem, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleTechnologyToggle = (techValue: string) => {
    const currentTechs = data.technologies || [];
    const newTechs = currentTechs.includes(techValue)
      ? currentTechs.filter((t) => t !== techValue)
      : [...currentTechs, techValue];
    handleFieldChange("technologies", newTechs);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
          background: THEME.digital.gradient,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: { xs: 1.5, sm: 2 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <WebIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
          >
            {mode === "add" ? "Nouveau projet digital" : "Modifier le projet"}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Image Upload */}
          <Grid item xs={12} md={5}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 1.5,
                fontSize: { xs: "0.875rem", sm: "1rem" },
              }}
            >
              Capture d'écran
            </Typography>
            <Box
              sx={{
                width: "100%",
                aspectRatio: { xs: "16/9", md: "4/3" },
                bgcolor: THEME.neutral[100],
                borderRadius: { xs: 2, md: 3 },
                overflow: "hidden",
                position: "relative",
                border: tempImage
                  ? `2px dashed ${THEME.accent.orange}`
                  : `2px dashed ${THEME.neutral[300]}`,
                transition: "all 0.3s ease",
                "&:hover": { borderColor: THEME.digital.main },
              }}
            >
              {data.image ? (
                <>
                  <Box
                    component="img"
                    src={data.image}
                    alt="Capture"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {tempImage && (
                    <Chip
                      icon={<PendingIcon sx={{ fontSize: 12 }} />}
                      label="Non confirmée"
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        bgcolor: THEME.accent.orange,
                        color: "white",
                        fontSize: "0.65rem",
                      }}
                    />
                  )}
                </>
              ) : (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  sx={{ height: "100%", gap: 1 }}
                >
                  <DevicesIcon
                    sx={{ fontSize: { xs: 36, sm: 48 }, color: THEME.neutral[400] }}
                  />
                  <Typography
                    variant="body2"
                    color={THEME.neutral[500]}
                    sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                  >
                    Capture d'écran du projet
                  </Typography>
                </Stack>
              )}
            </Box>
            <Button
              component="label"
              variant="outlined"
              fullWidth
              size={isSmall ? "small" : "medium"}
              startIcon={<CloudUploadIcon />}
              sx={{
                mt: 2,
                py: { xs: 1, sm: 1.5 },
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                borderColor: THEME.digital.main,
                color: THEME.digital.main,
                "&:hover": {
                  bgcolor: alpha(THEME.digital.main, 0.1),
                  borderColor: THEME.digital.main,
                },
              }}
            >
              Choisir une image
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={(e) => e.target.files?.[0] && onImageSelect(e.target.files[0])}
              />
            </Button>
          </Grid>

          {/* Form */}
          <Grid item xs={12} md={7}>
            <Stack spacing={{ xs: 2, sm: 3 }}>
              {/* URL du projet */}
              <TextField
                label="URL du projet"
                fullWidth
                size={isSmall ? "small" : "medium"}
                value={data.projectUrl}
                onChange={(e) => handleFieldChange("projectUrl", e.target.value)}
                placeholder="https://www.exemple.com"
                helperText={
                  data.projectUrl && !isValidProjectUrl(data.projectUrl)
                    ? "⚠️ URL invalide"
                    : "Lien vers le site ou l'application"
                }
                error={data.projectUrl !== "" && !isValidProjectUrl(data.projectUrl)}
                InputProps={{
                  startAdornment: (
                    <LinkIcon
                      sx={{
                        mr: 1,
                        color: THEME.digital.main,
                        fontSize: { xs: 18, sm: 24 },
                      }}
                    />
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />

              {/* Titre */}
              <TextField
                label="Titre du projet"
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

              {/* Technologies */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                  }}
                >
                  Technologies utilisées
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    p: 2,
                    bgcolor: THEME.neutral[50],
                    borderRadius: 2,
                    border: `1px solid ${THEME.neutral[200]}`,
                  }}
                >
                  {TECHNOLOGY_OPTIONS.map((tech) => {
                    const isSelected = data.technologies?.includes(tech.value);
                    return (
                      <Chip
                        key={tech.value}
                        label={tech.label}
                        size="small"
                        icon={<CodeIcon sx={{ fontSize: 14 }} />}
                        onClick={() => handleTechnologyToggle(tech.value)}
                        sx={{
                          cursor: "pointer",
                          bgcolor: isSelected ? alpha(tech.color, 0.2) : "white",
                          color: isSelected ? tech.color : THEME.neutral[600],
                          border: `1px solid ${isSelected ? tech.color : THEME.neutral[300]}`,
                          fontWeight: isSelected ? 600 : 400,
                          transition: "all 0.2s ease",
                          "& .MuiChip-icon": {
                            color: isSelected ? tech.color : THEME.neutral[400],
                          },
                          "&:hover": {
                            bgcolor: alpha(tech.color, 0.1),
                            borderColor: tech.color,
                          },
                        }}
                      />
                    );
                  })}
                </Box>
                {data.technologies && data.technologies.length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 1, color: THEME.neutral[500] }}
                  >
                    {data.technologies.length} technologie(s) sélectionnée(s)
                  </Typography>
                )}
              </Box>

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
                          <span style={{ fontSize: isSmall ? "0.875rem" : "1rem" }}>
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
          </Grid>
        </Grid>
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
          disabled={!data.title || isUpdating}
          sx={{
            background: THEME.digital.gradient,
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