// ============================================
// SHOW EDIT ABOUT - Composant parent principal
// ============================================

"use client";
import React, { useState } from "react";
import { Box, Button, useTheme, useMediaQuery } from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import EditAboutModal from "../about/EditAboutModal";

const ShowEditAbout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: { xs: "center", sm: "flex-end" },
      }}
    >
      <Button
        variant="contained"
        size={isMobile ? "small" : "medium"}
        startIcon={<EditNoteIcon />}
        onClick={() => setOpen(true)}
        sx={{
          background: "linear-gradient(135deg, #616637 0%, #8C915D 100%)",
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 2,
        }}
      >
        {isMobile ? "Éditer" : "Éditer About"}
      </Button>

      <EditAboutModal open={open} onClose={() => setOpen(false)} />
    </Box>
  );
};

export default ShowEditAbout;