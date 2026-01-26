// ============================================
// ACCORDION HEADER - En-tête d'accordéon
// ============================================

"use client";
import React from "react";
import { Box, Typography, Avatar, Chip } from "@mui/material";
import { safeAlpha } from "../ui/utils";
import { SectionConfig } from "@/types/types";

interface AccordionHeaderProps {
  config: SectionConfig;
  isExpanded: boolean;
  isSmall?: boolean;
}

const AccordionHeader: React.FC<AccordionHeaderProps> = ({
  config,
  isExpanded,
  isSmall,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      width: "100%",
      py: 0.5,
      flexWrap: { xs: "wrap", sm: "nowrap" },
      gap: { xs: 1, sm: 0 },
    }}
  >
    <Avatar
      sx={{
        width: { xs: 36, sm: 42 },
        height: { xs: 36, sm: 42 },
        mr: { xs: 1.5, sm: 2 },
        background: isExpanded ? config.gradient : safeAlpha(config.color, 0.1),
        color: isExpanded ? "#fff" : config.color,
        transition: "all 0.3s ease",
        boxShadow: isExpanded
          ? `0 4px 14px ${safeAlpha(config.color, 0.4)}`
          : "none",
      }}
    >
      {React.cloneElement(config.icon as React.ReactElement, {
        sx: { fontSize: { xs: 18, sm: 22 } },
      })}
    </Avatar>
    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        sx={{
          color: isExpanded ? config.color : "text.primary",
          transition: "color 0.3s ease",
          fontSize: { xs: "0.875rem", sm: "1rem" },
          lineHeight: 1.3,
        }}
        noWrap
      >
        {config.title}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: { xs: "none", sm: "block" },
          fontSize: { xs: "0.7rem", sm: "0.75rem" },
        }}
      >
        {config.sub}
      </Typography>
    </Box>
    {isExpanded && !isSmall && (
      <Chip
        label="En cours"
        size="small"
        sx={{
          bgcolor: safeAlpha(config.color, 0.1),
          color: config.color,
          fontWeight: 600,
          mr: 1,
          fontSize: "0.7rem",
        }}
      />
    )}
  </Box>
);

export default AccordionHeader;