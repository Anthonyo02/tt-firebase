// ============================================
// IMAGE UPLOAD CARD WITH OVERLAY - Pour Hero Images avec titre/sous-titre
// ============================================

"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import ImageUploadCard, { ImageUploadCardProps } from "./ImageUploadCard";

interface HeroOverlayProps {
  title: string;
  subtitle: string;
  overlayColor: string;
}

interface ImageUploadCardWithOverlayProps
  extends Omit<ImageUploadCardProps, "overlay"> {
  heroTitle?: string;
  heroSubtitle?: string;
  overlayColor?: string;
}

const ImageUploadCardWithOverlay: React.FC<ImageUploadCardWithOverlayProps> = ({
  heroTitle,
  heroSubtitle,
  overlayColor = "rgba(0,0,0,0.5)",
  imageUrl,
  ...props
}) => {
  // Créer l'overlay seulement si on a une image
  const overlay = imageUrl ? (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: overlayColor,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        textAlign="center"
        sx={{ color: "#ffffff", fontSize: { xs: "0.9rem", sm: "1.1rem" } }}
      >
        {heroTitle || "Titre"}
      </Typography>
      <Typography
        variant="body2"
        textAlign="center"
        sx={{
          color: "#ffffff",
          opacity: 0.9,
          fontSize: { xs: "0.7rem", sm: "0.8rem" },
          mt: 0.5,
        }}
      >
        {heroSubtitle || "Sous-titre"}
      </Typography>
    </Box>
  ) : undefined;

  return <ImageUploadCard imageUrl={imageUrl} overlay={overlay} {...props} />;
};

export default ImageUploadCardWithOverlay;