// components/LoadingState.tsx
"use client";

import React from "react";
import { Box, Typography, Stack, CircularProgress } from "@mui/material";
import { AutoAwesome as SparkleIcon } from "@mui/icons-material";

import { THEME } from "../../components/realisation/constants";

export default function LoadingState() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${THEME.neutral[50]} 0%, ${THEME.neutral[100]} 100%)`,
      }}
    >
      <Stack alignItems="center" spacing={3}>
        <Box sx={{ position: "relative", width: 80, height: 80 }}>
          <CircularProgress
            size={80}
            thickness={2}
            sx={{ color: THEME.primary.main, position: "absolute" }}
          />
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <SparkleIcon sx={{ fontSize: 32, color: THEME.primary.main }} />
          </Box>
        </Box>
        <Typography
          variant="h6"
          sx={{
            background: THEME.primary.gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 600,
          }}
        >
          Chargement...
        </Typography>
      </Stack>
    </Box>
  );
}