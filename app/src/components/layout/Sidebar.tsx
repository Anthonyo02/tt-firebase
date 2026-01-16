import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
} from '@mui/material';
import {
  Dashboard,
  Folder,
  Inventory2,
  CloudOff,
  Inventory,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import logo from '../../images/logo.png';


interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const DRAWER_WIDTH = 260;

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAdmin } = useAuth();
  // const { offlineQueue } = useData();

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
    { text: 'Projets', icon: <Folder />, path: '/projets' },
    { text: 'Matériels', icon: <Inventory2 />, path: '/materiels' },
    { text: 'Hors Ligne', icon: <Inventory2 />, path: '/offline' },
    { text: 'Site Web Tolotady', icon: <Inventory2 />, path: '/' },
  ];

  // if (isAdmin) {
  //   menuItems.push({
  //     text: 'Offline',
  //     icon: (
  //       <Badge badgeContent={offlineQueue.length} color="warning">
  //         <CloudOff />
  //       </Badge>
  //     ),
  //     path: '/offline',
  //   });
  // }

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#2a2c1f',
        color: 'white',
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: 2,
            // background: 'linear-gradient(135deg, #818660 0%, #9a9f7a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img src={logo} alt="logo" />
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
              onClick={() => handleNavigate(item.path)}
              sx={{
                borderRadius: 2,
                py: 1.5,
                bgcolor: location.pathname === item.path ? 'rgba(129, 134, 96, 0.3)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(129, 134, 96, 0.2)',
                },
                transition: 'all 0.2s',
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
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
      <Box sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            border: 'none',
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
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          border: 'none',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
