"use client";

import React, { useEffect, useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Dashboard,
  Folder,
  Inventory2,
  Web,
  WifiOff,
} from "@mui/icons-material";
import { usePathname, useRouter } from "next/navigation";
import logo from "../../public/images/logo.png";
import Image from "next/image";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";

// --- SOUS-COMPOSANT : Contenu de la Sidebar ---
// Cela remplace la variable "drawerContent"
interface SidebarContentProps {
  onNavigate: (path: string) => void;
  pathname: string;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ onNavigate, pathname }) => {
  const { isOffline } = useConnectionStatus();
  
  // Gestion utilisateur locale
  const [localUser, setLocalUser] = useState<{ role?: string }>({});
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setLocalUser(JSON.parse(stored));
      } catch {
        setLocalUser({});
      }
    }
  }, []);

  const isAdmin = localUser?.role === "admin";

  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/" },
    { text: "Projets", icon: <Folder />, path: "/projets" },
    { text: "Matériels", icon: <Inventory2 />, path: "/materiels" },
    ...(isOffline
      ? [{ text: "Hors Ligne", icon: <WifiOff />, path: "/offline" }]
      : []),
    ...(isAdmin
      ? [{ text: "Site Web Tolotady", icon: <Web />, path: "/siteweb" }]
      : []),
  ];

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#2a2c1f",
        color: "white",
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <Image
            src={logo}
            alt="logo"
            width={60}
            height={60}
            style={{ objectFit: "contain" }}
          />
        </Box>
        <Typography variant="h6" fontWeight={700}>
          T~T Stock
        </Typography>
      </Box>

      {/* Navigation */}
      <List sx={{ px: 2, flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => onNavigate(item.path)}
              sx={{
                borderRadius: 2,
                py: 1.5,
                bgcolor:
                  pathname === item.path
                    ? "rgba(129, 134, 96, 0.3)"
                    : "transparent",
                "&:hover": { bgcolor: "rgba(129, 134, 96, 0.2)" },
                transition: "all 0.2s",
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Footer */}
      <Box sx={{ p: 3, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          Version 1.0.1
        </Typography>
      </Box>
    </Box>
  );
};

// --- COMPOSANT PRINCIPAL ---

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  // Optionnel : on peut passer la largeur en prop si besoin de flexibilité
  width?: number; 
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, width = 260 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigate = (path: string) => {
    // Gestion simple : si lien externe ou interne
    if (path.startsWith("http")) {
       window.open(path);
    } else {
       router.push(path);
    }
    
    if (isMobile) onClose();
  };

  // Option 1 : Mobile (Temporary Drawer)
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: width, // Utilisation de la prop ou valeur par défaut
            border: "none",
            boxSizing: "border-box",
          },
        }}
      >
        <SidebarContent onNavigate={handleNavigate} pathname={pathname} />
      </Drawer>
    );
  }

  // Option 2 : Desktop (Permanent Drawer)
  return (
    <Box
      component="nav"
      sx={{ width: { md: width }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: width, // Utilisation de la prop ou valeur par défaut
            border: "none",
            boxSizing: "border-box",
          },
        }}
        open
      >
        <SidebarContent onNavigate={handleNavigate} pathname={pathname} />
      </Drawer>
    </Box>
  );
};

export default Sidebar;