// components/sections/DigitalProjectsSection.tsx
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
import { Add as AddIcon, Language as WebIcon } from "@mui/icons-material";

import { DigitalProjectItem } from "../types";
import { THEME } from "../constants";
import DigitalProjectCard from "../cards/DigitalProjectCard";

interface DigitalProjectsSectionProps {
  projects: DigitalProjectItem[];
  totalPending: number;
  isSmall: boolean;
  isPendingProject: (id: string) => boolean;
  updatingItem: string | null;
  deletingItem: string | null;
  onAdd: () => void;
  onEdit: (project: DigitalProjectItem) => void;
  onDelete: (projectId: string) => void;
}

export default function DigitalProjectsSection({
  projects,
  totalPending,
  isSmall,
  isPendingProject,
  updatingItem,
  deletingItem,
  onAdd,
  onEdit,
  onDelete,
}: DigitalProjectsSectionProps) {
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
            <WebIcon
              sx={{ fontSize: { xs: 20, sm: 24 }, color: THEME.digital.main }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.5rem" },
              }}
            >
              Projets Digitaux
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
            Sites web, applications et projets numériques
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
            background: THEME.digital.gradient,
            boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
            "&:hover": {
              transform: "translateY(-2px)",
              background: THEME.digital.dark,
            },
            transition: "all 0.3s ease",
          }}
        >
          {isSmall ? "Ajouter" : "Nouveau projet"}
        </Button>
      </Stack>

      {/* Grid */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
        {projects.map((project, index) => (
          <Grid item xs={6} sm={6} md={4} lg={3} key={project.id}>
            <DigitalProjectCard
              project={project}
              index={index}
              isPending={isPendingProject(project.id)}
              isUpdating={updatingItem === project.id}
              isDeleting={deletingItem === project.id}
              isSmall={isSmall}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </Grid>
        ))}

        {/* Empty State */}
        {projects.length === 0 && (
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
                  bgcolor: alpha(THEME.digital.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: { xs: 2, md: 3 },
                }}
              >
                <WebIcon
                  sx={{
                    fontSize: { xs: 28, sm: 32, md: 40 },
                    color: THEME.digital.main,
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
                Aucun projet digital
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: THEME.neutral[500],
                  mb: { xs: 2, md: 3 },
                  fontSize: { xs: "0.75rem", md: "0.875rem" },
                }}
              >
                Ajoutez vos sites web et applications
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAdd}
                size={isSmall ? "small" : "medium"}
                sx={{
                  background: THEME.digital.gradient,
                  textTransform: "none",
                  fontWeight: 600,
                  px: { xs: 2, md: 4 },
                  py: { xs: 1, md: 1.5 },
                  borderRadius: 2,
                }}
              >
                Ajouter un projet
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}