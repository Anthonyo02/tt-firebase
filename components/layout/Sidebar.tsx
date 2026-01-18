"use client";

import React from "react";
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
  Badge,
} from "@mui/material";
import { Dashboard, Folder, Inventory2, Inventory, Web, OfflinePin, WifiOff } from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import logo from "../../public/images/logo.png";
import Image from "next/image";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const DRAWER_WIDTH = 260;

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { isOffline } = useConnectionStatus();

  const pathname = usePathname();
  const router = useRouter();

 const menuItems = [
  { text: "Dashboard", icon: <Dashboard />, path: "/" },
  { text: "Projets", icon: <Folder />, path: "/projets" },
  { text: "Matériels", icon: <Inventory2 />, path: "/materiels" },
  ...(isOffline
    ? [{ text: "Hors Ligne", icon: <WifiOff />, path: "/offline" }]
    : []),

  { text: "Site Web Tolotady", icon: <Web />, path: "siteweb" },
];

  const handleNavigate = (path: string) => {
    router.push(path);
    if (isMobile) onClose();
  };

  const drawerContent = (
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
            overflow: "hidden", // important pour borderRadius
          }}
        >
          <Image
            src={logo}
            alt="logo"
            width={60} // largeur fixe
            height={60} // hauteur fixe
            style={{ objectFit: "contain" }} // pour que le logo garde ses proportions
          />
        </Box>
        <Typography variant="h6" fontWeight={700}>
          T~T Stock
        </Typography>
      </Box>

      {/* Navigation */}
      <List sx={{ px: 2, flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.path || item.path} // utiliser path ou path pour clé unique
            disablePadding
            sx={{ mb: 0.5 }}
          >
            <ListItemButton
              onClick={() =>
                item.path
                  ? handleNavigate(item.path)
                  : window.open(item.path)
              }
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

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            border: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": { width: DRAWER_WIDTH, border: "none" },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
