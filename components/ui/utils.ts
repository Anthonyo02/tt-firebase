// ============================================
// UTILITAIRES - Fonctions helpers
// ============================================

import { alpha } from "@mui/material";

// --- Helper pour alpha avec couleurs non supportées ---
export const safeAlpha = (color: string, opacity: number): string => {
  const unsupportedColors = ["transparent", "inherit", "initial", "unset", ""];

  if (!color || unsupportedColors.includes(color.toLowerCase().trim())) {
    return `rgba(97, 102, 55, ${opacity})`;
  }

  try {
    return alpha(color, opacity);
  } catch {
    return `rgba(97, 102, 55, ${opacity})`;
  }
};

// --- Helper pour obtenir une couleur safe ---
export const getSafeColor = (color: string, fallback: string = "#616637"): string => {
  const unsupportedColors = ["transparent", "inherit", "initial", "unset", ""];

  if (!color || unsupportedColors.includes(color.toLowerCase().trim())) {
    return fallback;
  }

  return color;
};