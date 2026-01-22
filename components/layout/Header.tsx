"use client";

import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  useTheme,
  Grid,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  LightMode,
  DarkMode,
  Logout,
  PersonAdd,
  People,
  WifiOff,
  Wifi,
  Settings,
  SignalWifiStatusbarConnectedNoInternet4, // Icône pour "poor"
} from "@mui/icons-material";

import { useAuth } from "@/context/AuthContext";
import { useTheme as useAppTheme } from "@/context/ThemeContext";

import CreateUserModal from "../modals/CreateUserModal";
import UsersListModal from "../modals/UsersListModal";
import SettingsModal from "../modals/SettingsModal";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";

interface HeaderProps {
  onMenuClick: () => void;
}

// Interface pour typer la configuration de connexion
interface StatusConfig {
  label: string;
  color:
    | "success"
    | "warning"
    | "default"
    | "error"
    | "primary"
    | "secondary"
    | "info";
  icon: React.ReactElement;
  tooltip: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const theme = useTheme();
  const {  logout } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const { status } = useConnectionStatus();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showUsersList, setShowUsersList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [reload, setReload] = useState(false);

  const [localUser, setLocalUser] = useState<{
    nom?: string;
    email?: string;
    role?: string;
  }>({});
  const isAdmin = localUser?.role === "admin";
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setLocalUser(JSON.parse(stored));
      } catch {
        setLocalUser({});
      }
    } else {
      setLocalUser({});
    }
  }, [showSettings]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    logout();
    localStorage.clear();
  };

  // 1. Ajout du typage Record<string, StatusConfig> pour résoudre l'erreur d'indexation
  // 2. Ajout de la clé 'poor' manquante
  const connectionConfig: Record<string, StatusConfig> = {
    stable: {
      label: "En ligne",
      color: "success",
      icon: <Wifi />,
      tooltip:
        "Connexion stable : toutes les fonctionnalités sont disponibles.",
    },
    unstable: {
      label: "Instable",
      color: "warning",
      icon: <Wifi />,
      tooltip: "Connexion instable : certaines opérations peuvent échouer.",
    },
    poor: {
      label: "Faible",
      color: "warning",
      icon: <SignalWifiStatusbarConnectedNoInternet4 />,
      tooltip: "Connexion faible : risque de lenteur.",
    },
    offline: {
      label: "Hors ligne",
      color: "default",
      icon: <WifiOff />,
      tooltip: "Hors ligne : aucune opération possible.",
    },
  };

  // Sécurité : Si le statut renvoyé par le hook n'existe pas dans la config, on utilise 'offline' par défaut
  const currentConfig = connectionConfig[status] || connectionConfig.offline;

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            edge="start"
            onClick={onMenuClick}
            sx={{ display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flex: 1 }} />

          {/* Utilisation de currentConfig pour éviter les erreurs d'accès undefined */}
          <Tooltip title={currentConfig.tooltip} arrow>
            <Chip
              icon={currentConfig.icon}
              label={currentConfig.label}
              color={currentConfig.color}
              size="small"
              variant="outlined"
              sx={{
                cursor: "help",
                transition: "all 0.2s ease",
                "&:hover": { boxShadow: 2, transform: "scale(1.05)" },
              }}
            />
          </Tooltip>

          <IconButton onClick={toggleTheme}>
            {mode === "light" ? (
              <DarkMode sx={{ color: "text.secondary" }} />
            ) : (
              <LightMode sx={{ color: "text.secondary" }} />
            )}
          </IconButton>

          <Box
            onClick={handleMenuOpen}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              cursor: "pointer",
              px: 1,
              borderRadius: 2,
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "primary.main",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {localUser?.nom ? localUser.nom.charAt(0).toUpperCase() : "U"}
            </Avatar>
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography
                variant="body2"
                fontWeight={600}
                color={"text.primary"}
              >
                {localUser?.nom || "Utilisateur"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {localUser?.role === "admin" ? "Administrateur" : "Employé"}
              </Typography>
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{ sx: { width: 230, mt: 1 } }}
          >
            <Grid container alignItems="center">
              <Grid item xs={10}>
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {localUser?.nom || "Utilisateur"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {localUser?.email || ""}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={2} display="flex" justifyContent="center">
                <IconButton onClick={() => setShowSettings(true)}>
                  <Settings />
                </IconButton>
              </Grid>
            </Grid>

            <Divider />
            {isAdmin
              ? [
                  <MenuItem
                    key="create"
                    onClick={() => {
                      handleMenuClose();
                      setShowCreateUser(true);
                    }}
                  >
                    <ListItemIcon>
                      <PersonAdd fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Créer un compte</ListItemText>
                  </MenuItem>,
                  <MenuItem
                    key="list"
                    onClick={() => {
                      handleMenuClose();
                      setShowUsersList(true);
                    }}
                  >
                    <ListItemIcon>
                      <People fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Liste utilisateurs</ListItemText>
                  </MenuItem>,
                  <Divider key="divider" />,
                ]
              : null}

            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <ListItemIcon>
                <Logout fontSize="small" sx={{ color: "error.main" }} />
              </ListItemIcon>
              <ListItemText>Déconnexion</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <CreateUserModal
        setReload={() => setReload(true)}
        open={showCreateUser}
        onClose={() => setShowCreateUser(false)}
      />
      <UsersListModal
        open={showUsersList}
        onClose={() => setShowUsersList(false)}
        openCreate={() => setShowCreateUser(true)}
        reload={reload}
        setReload={() => setReload(false)}
      />
      <SettingsModal
        user={localUser}
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};

export default Header;
