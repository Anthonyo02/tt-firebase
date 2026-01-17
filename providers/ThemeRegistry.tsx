"use client";

import * as React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import EmotionCacheProvider from "@/providers/EmotionCache";

// Import ton thème MUI
import theme from "@/theme/muiTheme";

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <EmotionCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </EmotionCacheProvider>
  );
}
