"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '../theme/muiTheme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // On commence avec 'light' par défaut, safe côté serveur
  const [mode, setMode] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false); // pour s'assurer qu'on est côté client

  // ⚡ Charger depuis localStorage uniquement côté client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as ThemeMode | null;
      if (stored) setMode(stored);
      setMounted(true);
    }
  }, []);

  // Sauvegarde dans localStorage à chaque changement
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', mode);
      document.documentElement.classList.toggle('dark', mode === 'dark');
    }
  }, [mode, mounted]);

  const toggleTheme = () => setMode(prev => (prev === 'light' ? 'dark' : 'light'));

  const theme = createAppTheme(mode);

  if (!mounted) return null; // ⚠️ on attend le montage pour éviter flash côté serveur

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
