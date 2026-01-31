// components/EditorHeader.tsx
"use client";

import React from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Stack,
  Chip,
  Paper,
  Button,
  Badge,
  alpha,
} from "@mui/material";
import {
  Save as SaveIcon,
  HourglassEmpty as PendingIcon,
  YouTube as YouTubeIcon,
  Collections as GalleryIcon,
  Language as WebIcon,
} from "@mui/icons-material";
import { THEME } from "./constants";


interface EditorHeaderProps {
  editorTab: "videos" | "photos" | "digitalProjects";
  videosCount: number;
  photosCount: number;
  digitalProjectsCount: number;
  totalPendingVideos: number;
  totalPendingPhotos: number;
  totalPendingDigitalProjects: number;
  hasChangesToSave: boolean;
  totalPendingCount: number;
  pendingLabel: string;
  saving: boolean;
  isSmall: boolean;
  onTabChange: (tab: "videos" | "photos" | "digitalProjects") => void;
  onSave: () => void;
  onCancelChanges: () => void;
}

export default function EditorHeader({
  editorTab,
  videosCount,
  photosCount,
  digitalProjectsCount,
  totalPendingVideos,
  totalPendingPhotos,
  totalPendingDigitalProjects,
  hasChangesToSave,
  totalPendingCount,
  pendingLabel,
  saving,
  isSmall,
  onTabChange,
  onSave,
  onCancelChanges,
}: EditorHeaderProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2, md: 3 },
        mb: { xs: 2, md: 4 },
        borderRadius: { xs: 2, md: 3 },
        background: "white",
        border: `1px solid ${THEME.neutral[200]}`,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "stretch", md: "center" },
        justifyContent: "space-between",
        gap: { xs: 1.5, md: 2 },
      }}
    >
      {/* Tabs */}
      <Box
        sx={{
          display: "flex",
          p: 0.5,
          borderRadius: 2,
          bgcolor: THEME.neutral[100],
          width: { xs: "100%", md: "auto" },
          minWidth: { md: 480 },
          flexWrap: { xs: "wrap", sm: "nowrap" },
          gap: { xs: 0.5, sm: 0 },
        }}
      >
        {/* Videos Tab */}
        <Button
          size="small"
          onClick={() => onTabChange("videos")}
          startIcon={
            !isSmall && (
              <Badge
                badgeContent={totalPendingVideos}
                sx={{
                  "& .MuiBadge-badge": {
                    background: THEME.accent.orange,
                    color: "white",
                    fontSize: "0.6rem",
                    minWidth: 14,
                    height: 14,
                  },
                }}
              >
                <YouTubeIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
              </Badge>
            )
          }
          sx={{
            flex: { xs: "1 1 45%", sm: 1 },
            mr: { xs: 0, sm: 0.5 },
            borderRadius: 1.5,
            textTransform: "none",
            fontWeight: 600,
            fontSize: { xs: "0.65rem", sm: "0.75rem", md: "0.8rem" },
            py: { xs: 0.75, sm: 1 },
            color: editorTab === "videos" ? "white" : "#616637",
            background: editorTab === "videos" ? "#616637" : "transparent",
            boxShadow:
              editorTab === "videos" ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "none",
            "&:hover": {
              background: editorTab === "videos" ? "#4a4f2a" : "#D9CBC0",
            },
          }}
        >
          {`Vidéos (${videosCount})`}
        </Button>

        {/* Photos Tab */}
        <Button
          onClick={() => onTabChange("photos")}
          size="small"
          startIcon={
            !isSmall && (
              <Badge
                badgeContent={totalPendingPhotos}
                sx={{
                  "& .MuiBadge-badge": {
                    background: THEME.accent.orange,
                    color: "white",
                    fontSize: "0.6rem",
                    minWidth: 14,
                    height: 14,
                  },
                }}
              >
                <GalleryIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
              </Badge>
            )
          }
          sx={{
            flex: { xs: "1 1 45%", sm: 1 },
            mr: { xs: 0, sm: 0.5 },
            borderRadius: 1.5,
            textTransform: "none",
            fontWeight: 600,
            fontSize: { xs: "0.65rem", sm: "0.75rem", md: "0.8rem" },
            py: { xs: 0.75, sm: 1 },
            color: editorTab === "photos" ? "white" : "#616637",
            background: editorTab === "photos" ? "#616637" : "transparent",
            boxShadow:
              editorTab === "photos" ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "none",
            "&:hover": {
              background: editorTab === "photos" ? "#4a4f2a" : "#D9CBC0",
            },
          }}
        >
          {`Photos (${photosCount})`}
        </Button>

        {/* Digital Projects Tab */}
        <Button
          onClick={() => onTabChange("digitalProjects")}
          size="small"
          startIcon={
            !isSmall && (
              <Badge
                badgeContent={totalPendingDigitalProjects}
                sx={{
                  "& .MuiBadge-badge": {
                    background: THEME.accent.orange,
                    color: "white",
                    fontSize: "0.6rem",
                    minWidth: 14,
                    height: 14,
                  },
                }}
              >
                <WebIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
              </Badge>
            )
          }
          sx={{
            flex: { xs: "1 1 100%", sm: 1 },
            borderRadius: 1.5,
            textTransform: "none",
            fontWeight: 600,
            fontSize: { xs: "0.65rem", sm: "0.75rem", md: "0.8rem" },
            py: { xs: 0.75, sm: 1 },
            color: editorTab === "digitalProjects" ? "white" : "#616637",
            background:
              editorTab === "digitalProjects" ? THEME.digital.main : "transparent",
            boxShadow:
              editorTab === "digitalProjects"
                ? "0 2px 8px rgba(59, 130, 246, 0.3)"
                : "none",
            "&:hover": {
              background:
                editorTab === "digitalProjects" ? THEME.digital.dark : "#D9CBC0",
            },
          }}
        >
          {`Projets Web (${digitalProjectsCount})`}
        </Button>
      </Box>

      {/* Actions */}
      <Stack
        direction="row"
        spacing={{ xs: 1, sm: 2 }}
        alignItems="center"
        justifyContent={{ xs: "space-between", md: "flex-end" }}
        sx={{ width: { xs: "100%", md: "auto" } }}
      >
        {/* Pending Chip */}
        {hasChangesToSave && (
          <Chip
            icon={<PendingIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
            label={isSmall ? `${totalPendingCount} en attente` : pendingLabel}
            onDelete={onCancelChanges}
            size={isSmall ? "small" : "medium"}
            sx={{
              bgcolor: alpha(THEME.accent.orange, 0.1),
              color: THEME.accent.orange,
              fontWeight: 600,
              fontSize: { xs: "0.65rem", sm: "0.75rem" },
              maxWidth: { xs: 150, sm: "none" },
              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
              "& .MuiChip-deleteIcon": {
                color: THEME.accent.orange,
                fontSize: { xs: 16, sm: 18 },
                "&:hover": { color: "#EA580C" },
              },
            }}
          />
        )}

        {/* Save Button */}
        <Button
          variant="contained"
          startIcon={
            saving ? (
              <CircularProgress size={isSmall ? 14 : 18} sx={{ color: "white" }} />
            ) : (
              <SaveIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
            )
          }
          onClick={onSave}
          size="small"
          disabled={saving || !hasChangesToSave}
          sx={{
            px: { xs: 1.5, sm: 2, md: 3 },
            py: { xs: 1, sm: 1.5 },
            borderRadius: { xs: 1.5, sm: 2 },
            textTransform: "none",
            fontWeight: 600,
            fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
            minWidth: { xs: "auto", sm: 120 },
            background: hasChangesToSave
              ? `linear-gradient(135deg, ${THEME.accent.orange} 0%, #EA580C 100%)`
              : THEME.primary.gradient,
            boxShadow: hasChangesToSave
              ? "0 4px 14px rgba(245, 158, 11, 0.4)"
              : "0 4px 14px rgba(99, 102, 241, 0.4)",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: hasChangesToSave
                ? "0 6px 20px rgba(245, 158, 11, 0.5)"
                : "0 6px 20px rgba(99, 102, 241, 0.5)",
            },
            "&:disabled": {
              background: THEME.neutral[300],
              color: THEME.neutral[500],
            },
            transition: "all 0.3s ease",
          }}
        >
          {saving
            ? isSmall
              ? "..."
              : "Sauvegarde..."
            : hasChangesToSave
            ? isSmall
              ? `(${totalPendingCount})`
              : `Enregistrer (${totalPendingCount})`
            : isSmall
            ? "OK"
            : "Enregistrer"}
        </Button>
      </Stack>
    </Paper>
  );
}