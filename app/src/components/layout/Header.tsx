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
} from "@mui/icons-material";

import { useAuth } from "../../context/AuthContext";
import { useTheme as useAppTheme } from "../../context/ThemeContext";
import { useConnection } from "../../context/ConnectionContext";

import CreateUserModal from "../modals/CreateUserModal";
import UsersListModal from "../modals/UsersListModal";
import SettingsModal from "../modals/SettingsModal";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const theme = useTheme();
  const { user, logout, isAdmin } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const { status } = useConnection(); // 🟢🟠⚪ connexion temps réel

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showUsersList, setShowUsersList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [reload, setReload] = useState(false);

  // localUser toujours objet, jamais null
  const [localUser, setLocalUser] = useState<{ nom?: string; email?: string; role?: string }>({});

  /* ======================
     MENU HANDLERS
  ====================== */
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);

  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    logout();
    localStorage.clear();
  };

  /* ======================
     USER LOCAL STORAGE
  ====================== */
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

  /* ======================
     CONFIG CONNEXION
  ====================== */
  const connectionConfig = {
    stable: {
      label: "En ligne",
      color: "success" as const,
      icon: <Wifi />,
      tooltip: "Connexion stable : toutes les fonctionnalités sont disponibles.",
    },
    unstable: {
      label: "Connexion instable",
      color: "warning" as const,
      icon: <Wifi />,
      tooltip:
        "Connexion instable : certaines opérations (création, modification ou suppression) peuvent échouer.",
    },
    offline: {
      label: "Hors ligne",
      color: "default" as const,
      icon: <WifiOff />,
      tooltip:
        "Hors ligne : aucune opération n’est possible tant que la connexion n’est pas rétablie.",
    },
  };

  /* ======================
     RENDER
  ====================== */
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
          {/* Menu mobile */}
          <IconButton edge="start" onClick={onMenuClick} sx={{ display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ flex: 1 }} />

          {/* ===== Connexion Chip ===== */}
          <Tooltip title={connectionConfig[status]?.tooltip} arrow>
            <Chip
              icon={connectionConfig[status]?.icon}
              label={connectionConfig[status]?.label}
              color={connectionConfig[status]?.color}
              size="small"
              variant="outlined"
              sx={{
                cursor: "help",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: 2,
                  transform: "scale(1.05)",
                },
              }}
            />
          </Tooltip>

          {/* ===== Theme ===== */}
          <IconButton onClick={toggleTheme}>
            {mode === "light" ? (
              <DarkMode sx={{ color: "text.secondary" }} />
            ) : (
              <LightMode sx={{ color: "text.secondary" }} />
            )}
          </IconButton>

          {/* ===== User ===== */}
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
              <Typography variant="body2" fontWeight={600} color={"text.primary"}>
                {localUser?.nom || "Utilisateur"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {localUser?.role === "admin" ? "Administrateur" : "Employé"}
              </Typography>
            </Box>
          </Box>

          {/* ===== Menu ===== */}
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
                    {localUser?.nom
                      ? localUser.nom.length > 10
                        ? localUser.nom.slice(0, 10) + "…"
                        : localUser.nom
                      : "Utilisateur"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {localUser?.email
                      ? localUser.email.length > 15
                        ? localUser.email.slice(0, 15) + "…"
                        : localUser.email
                      : ""}
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
            {isAdmin && (
              <>
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    setShowCreateUser(true);
                  }}
                >
                  <ListItemIcon>
                    <PersonAdd fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Créer un compte</ListItemText>
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    setShowUsersList(true);
                  }}
                >
                  <ListItemIcon>
                    <People fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Liste utilisateurs</ListItemText>
                </MenuItem>

                <Divider />
              </>
            )}

            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <ListItemIcon>
                <Logout fontSize="small" sx={{ color: "error.main" }} />
              </ListItemIcon>
              <ListItemText>Déconnexion</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* ===== Modals ===== */}
      <CreateUserModal setReload={()=>setReload(true)} open={showCreateUser} onClose={() => setShowCreateUser(false)} />
      <UsersListModal
        open={showUsersList}
        onClose={() => setShowUsersList(false)}
        openCreate={() => setShowCreateUser(true)}
        reload={reload}
        setReload={()=>setReload(false)}
      />
      <SettingsModal user={localUser} open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
};

export default Header;
