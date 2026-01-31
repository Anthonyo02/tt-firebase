// components/DigitalProjectCard.tsx
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
  Button,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  HourglassEmpty as PendingIcon,
  Language as WebIcon,
  Code as CodeIcon,
  OpenInNew as OpenInNewIcon,
  Devices as DevicesIcon,
} from "@mui/icons-material";

import { DigitalProjectItem } from "../types";
import { THEME, TECHNOLOGY_OPTIONS } from "../constants";
import { getClientColor, getTechColor, formatDateDisplay } from "../utils";

interface DigitalProjectCardProps {
  project: DigitalProjectItem;
  index: number;
  isPending: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isSmall: boolean;
  onEdit: (project: DigitalProjectItem) => void;
  onDelete: (projectId: string) => void;
}

export default function DigitalProjectCard({
  project,
  index,
  isPending,
  isUpdating,
  isDeleting,
  isSmall,
  onEdit,
  onDelete,
}: DigitalProjectCardProps) {
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
            "& .project-overlay": { opacity: 1 },
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
            {project.image ? (
              <>
                <Box
                  component="img"
                  src={project.image}
                  alt={project.title}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <Box
                  className="project-overlay"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)",
                    opacity: 0,
                    transition: "opacity 0.3s ease",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    pb: 2,
                  }}
                >
                  {project.projectUrl && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<OpenInNewIcon />}
                      href={project.projectUrl}
                      target="_blank"
                      sx={{
                        bgcolor: "white",
                        color: THEME.digital.main,
                        textTransform: "none",
                        fontSize: "0.75rem",
                        "&:hover": { bgcolor: THEME.neutral[100] },
                      }}
                    >
                      Visiter
                    </Button>
                  )}
                </Box>
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
                <DevicesIcon
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
                    Ajoutez une capture d'écran
                  </Typography>
                )}
              </Box>
            )}

            <WebIcon
              sx={{
                position: "absolute",
                top: { xs: 4, sm: 8, md: 12 },
                right: { xs: 4, sm: 8, md: 12 },
                bgcolor: alpha(THEME.digital.main, 0.9),
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
            {project.title || "Sans titre"}
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
                mb: 1,
                minHeight: { sm: 36, md: 42 },
                fontSize: { sm: "0.75rem", md: "0.875rem" },
              }}
            >
              {project.description || "Pas de description"}
            </Typography>
          )}

          {/* Technologies */}
          {project.technologies && project.technologies.length > 0 && (
            <Stack
              direction="row"
              spacing={0.5}
              flexWrap="wrap"
              gap={0.5}
              mb={1}
            >
              {project.technologies.slice(0, isSmall ? 2 : 3).map((tech) => (
                <Chip
                  key={tech}
                  size="small"
                  icon={<CodeIcon sx={{ fontSize: 10 }} />}
                  label={
                    TECHNOLOGY_OPTIONS.find((t) => t.value === tech)?.label ||
                    tech
                  }
                  sx={{
                    bgcolor: alpha(getTechColor(tech), 0.1),
                    color: getTechColor(tech),
                    fontWeight: 500,
                    fontSize: { xs: "0.5rem", sm: "0.6rem" },
                    height: { xs: 16, sm: 20 },
                    "& .MuiChip-icon": { color: getTechColor(tech) },
                  }}
                />
              ))}
              {project.technologies.length > (isSmall ? 2 : 3) && (
                <Chip
                  size="small"
                  label={`+${project.technologies.length - (isSmall ? 2 : 3)}`}
                  sx={{
                    bgcolor: THEME.neutral[200],
                    color: THEME.neutral[600],
                    fontWeight: 500,
                    fontSize: { xs: "0.5rem", sm: "0.6rem" },
                    height: { xs: 16, sm: 20 },
                  }}
                />
              )}
            </Stack>
          )}

          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            flexWrap="wrap"
            gap={0.5}
          >
            {project.client && (
              <Chip
                size="small"
                label={project.client}
                sx={{
                  bgcolor: alpha(getClientColor(project.client), 0.1),
                  color: getClientColor(project.client),
                  fontWeight: 600,
                  fontSize: { xs: "0.55rem", sm: "0.65rem", md: "0.75rem" },
                  height: { xs: 18, sm: 22, md: 24 },
                }}
              />
            )}
            <Chip
              size="small"
              label={formatDateDisplay(project.date)}
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
          justifyContent="space-between"
          alignItems="center"
          spacing={0.5}
          sx={{ p: { xs: 0.5, sm: 1, md: 1.5 }, bgcolor: THEME.neutral[50] }}
        >
          {project.projectUrl && (
            <IconButton
              size="small"
              href={project.projectUrl}
              target="_blank"
              sx={{
                color: THEME.digital.main,
                bgcolor: alpha(THEME.digital.main, 0.1),
                width: { xs: 28, sm: 32, md: 36 },
                height: { xs: 28, sm: 32, md: 36 },
                "&:hover": { bgcolor: alpha(THEME.digital.main, 0.2) },
              }}
            >
              <OpenInNewIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
            </IconButton>
          )}

          <Box sx={{ flex: 1 }} />

          <IconButton
            size="small"
            onClick={() => onEdit(project)}
            disabled={isUpdating}
            sx={{
              color: THEME.digital.main,
              bgcolor: alpha(THEME.digital.main, 0.1),
              width: { xs: 28, sm: 32, md: 36 },
              height: { xs: 28, sm: 32, md: 36 },
              "&:hover": { bgcolor: alpha(THEME.digital.main, 0.2) },
            }}
          >
            {isUpdating ? (
              <CircularProgress size={14} sx={{ color: THEME.digital.main }} />
            ) : (
              <EditIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
            )}
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(project.id)}
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