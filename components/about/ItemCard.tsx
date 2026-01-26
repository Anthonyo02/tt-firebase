// ============================================
// ITEM CARD - Carte d'élément avec suppression
// ============================================

"use client";
import React from "react";
import { Box, Paper, IconButton, Badge } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { getSafeColor, safeAlpha } from "../ui/utils";

interface ItemCardProps {
  children: React.ReactNode;
  onDelete: () => void;
  color: string;
  index: number;
}

const ItemCard: React.FC<ItemCardProps> = ({
  children,
  onDelete,
  color,
  index,
}) => {
  const safeColor = getSafeColor(color, "#616637");

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2.5 },
        borderRadius: { xs: 2, sm: 3 },
        border: "1px solid",
        borderColor: safeAlpha(safeColor, 0.2),
        bgcolor: safeAlpha(safeColor, 0.02),
        position: "relative",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: safeColor,
          boxShadow: `0 4px 20px ${safeAlpha(safeColor, 0.15)}`,
          transform: { xs: "none", sm: "translateY(-2px)" },
          "& .delete-btn": { opacity: 1 },
        },
      }}
    >
      <Badge
        badgeContent={index + 1}
        sx={{
          position: "absolute",
          top: { xs: 12, sm: 16 },
          left: { xs: 12, sm: 16 },
          "& .MuiBadge-badge": {
            bgcolor: safeColor,
            color: "#fff",
            fontWeight: 700,
            fontSize: { xs: "0.6rem", sm: "0.7rem" },
            minWidth: { xs: 16, sm: 20 },
            height: { xs: 16, sm: 20 },
          },
        }}
      />
      <IconButton
        className="delete-btn"
        size="small"
        onClick={onDelete}
        sx={{
          position: "absolute",
          top: { xs: 4, sm: 8 },
          right: { xs: 4, sm: 8 },
          opacity: { xs: 1, sm: 0.4 },
          transition: "all 0.2s",
          color: "#ef4444",
          padding: { xs: 0.5, sm: 1 },
          "&:hover": { bgcolor: safeAlpha("#ef4444", 0.1) },
        }}
      >
        <DeleteOutlineIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
      </IconButton>
      <Box sx={{ pt: { xs: 2.5, sm: 3 } }}>{children}</Box>
    </Paper>
  );
};

export default ItemCard;
