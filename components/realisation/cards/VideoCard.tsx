// components/VideoCard.tsx
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
  PlayCircleOutline as PlayIcon,
  YouTube as YouTubeIcon,
  HourglassEmpty as PendingIcon,
  Warning as WarningIcon,
  Movie as MovieIcon,
} from "@mui/icons-material";

import { VideoItem } from "../types";
import { THEME } from "../constants";
import {
  getYouTubeThumbnail,
  getYouTubeVideoId,
  isValidYouTubeUrl,
  getClientColor,
  formatDateDisplay,
} from "../utils";

interface VideoCardProps {
  video: VideoItem;
  index: number;
  isPending: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isSmall: boolean;
  onEdit: (video: VideoItem) => void;
  onDelete: (videoId: string) => void;
}

export default function VideoCard({
  video,
  index,
  isPending,
  isUpdating,
  isDeleting,
  isSmall,
  onEdit,
  onDelete,
}: VideoCardProps) {
  const thumbnail = getYouTubeThumbnail(video.videoUrl);
  const isValidUrl = isValidYouTubeUrl(video.videoUrl);

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
            {thumbnail ? (
              <>
                <Box
                  component="img"
                  src={thumbnail}
                  alt={video.title}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e: any) => {
                    const videoId = getYouTubeVideoId(video.videoUrl);
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
                      width: { xs: 36, sm: 48, md: 56 },
                      height: { xs: 26, sm: 34, md: 40 },
                      borderRadius: 1.5,
                      bgcolor: THEME.youtube.main,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PlayIcon
                      sx={{
                        fontSize: { xs: 18, sm: 24, md: 28 },
                        color: "white",
                      }}
                    />
                  </Box>
                </Box>
                {!isValidUrl && (
                  <Chip
                    icon={<WarningIcon sx={{ fontSize: 12 }} />}
                    label="URL invalide"
                    size="small"
                    sx={{
                      position: "absolute",
                      bottom: 8,
                      left: 8,
                      bgcolor: "#EF4444",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.6rem",
                      height: 20,
                    }}
                  />
                )}
              </>
            ) : (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                }}
              >
                <YouTubeIcon
                  sx={{
                    fontSize: { xs: 32, sm: 48, md: 60 },
                    color: THEME.neutral[300],
                  }}
                />
                {!isSmall && (
                  <Typography
                    variant="caption"
                    sx={{ color: THEME.neutral[500], fontSize: "0.65rem" }}
                  >
                    Ajoutez un lien YouTube
                  </Typography>
                )}
              </Box>
            )}

            <MovieIcon
              sx={{
                position: "absolute",
                top: { xs: 4, sm: 8, md: 12 },
                right: { xs: 4, sm: 8, md: 12 },
                bgcolor: alpha(THEME.youtube.main, 0.9),
                borderRadius: "50%",
                width: { xs: 20, sm: 24, md: 30 },
                height: { xs: 20, sm: 24, md: 30 },
                boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
                color: "white",
                p: { xs: 0.25, sm: 0.5 },
              }}
            />
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
            {video.title || "Sans titre"}
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
              {video.description || "Pas de description"}
            </Typography>
          )}
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            flexWrap="wrap"
            gap={0.5}
          >
            {video.client && (
              <Chip
                size="small"
                label={video.client}
                sx={{
                  bgcolor: alpha(getClientColor(video.client), 0.1),
                  color: getClientColor(video.client),
                  fontWeight: 600,
                  fontSize: { xs: "0.55rem", sm: "0.65rem", md: "0.75rem" },
                  height: { xs: 18, sm: 22, md: 24 },
                }}
              />
            )}
            <Chip
              size="small"
              label={formatDateDisplay(video.date)}
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
            onClick={() => onEdit(video)}
            disabled={isUpdating}
            sx={{
              color: THEME.primary.main,
              bgcolor: alpha(THEME.primary.main, 0.1),
              width: { xs: 28, sm: 32, md: 36 },
              height: { xs: 28, sm: 32, md: 36 },
              "&:hover": { bgcolor: alpha(THEME.primary.main, 0.2) },
            }}
          >
            {isUpdating ? (
              <CircularProgress size={14} sx={{ color: THEME.primary.main }} />
            ) : (
              <EditIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
            )}
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(video.id)}
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