// ============================================
// HERO IMAGE SECTION - Section image principale
// ============================================

"use client";
import React from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ImageIcon from "@mui/icons-material/Image";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

import AccordionHeader from "./AccordionHeader";
import StyledTextField from "./StyledTextField";
import ColorPicker from "./ColorPicker";
import { HeroImage, PageContent, PendingHeroImage } from "@/types/types";
import { SECTIONS_CONFIG } from "@/types/constants";
import { safeAlpha } from "../ui/utils";

interface HeroImageSectionProps {
  formData: PageContent;
  pendingHeroImage: PendingHeroImage | null;
  expanded: string | false;
  isSmall: boolean;
  onChangePanel: (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => void;
  onHeroImageSelect: (file: File) => void;
  onHeroImageChange: (field: keyof HeroImage, value: string) => void;
  onCancelPendingHeroImage: () => void;
}

const HeroImageSection: React.FC<HeroImageSectionProps> = ({
  formData,
  pendingHeroImage,
  expanded,
  isSmall,
  onChangePanel,
  onHeroImageSelect,
  onHeroImageChange,
  onCancelPendingHeroImage,
}) => {
  const config = SECTIONS_CONFIG[0];

  return (
    <Accordion
      expanded={expanded === "panel0"}
      onChange={onChangePanel("panel0")}
      elevation={0}
      sx={{
        borderBottom: "1px solid #e2e8f0",
        "&::before": { display: "none" },
        "&.Mui-expanded": {
          bgcolor: safeAlpha(config.color, 0.02),
        },
        mb:2
      }}
    >
      <AccordionSummary
        expandIcon={
          <ExpandMoreIcon
            sx={{
              color: expanded === "panel0" ? config.color : "inherit",
              fontSize: { xs: 20, sm: 24 },
            }}
          />
        }
        sx={{ px: { xs: 2, sm: 3 }, py: 1 }}
      >
        <AccordionHeader
          config={config}
          isExpanded={expanded === "panel0"}
          isSmall={isSmall}
        />
      </AccordionSummary>
      <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 3, sm: 4 } }}>
        <Grid container>
          {/* Prévisualisation de l'image */}
          <Grid item xs={12} md={5} px={1} position={"relative"}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 0.5,
                fontSize: { xs: "0.875rem", sm: "1rem" },
              }}
            >
              Image Hero
            </Typography>
            <Box
              sx={{
                width: "100%",
                aspectRatio: { xs: "16/9", md: "2.5" },
                bgcolor: "#f1f5f9",
                overflow: "hidden",
                position: "relative",
                border: pendingHeroImage
                  ? `3px dashed #ed6c02`
                  : `2px dashed ${config.color}`,
                transition: "all 0.3s ease",
              }}
            >
              {formData.image.imageUrl ? (
                <>
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      backgroundImage: `
                        linear-gradient(
                          ${formData.image.color}99,
                          ${formData.image.color}99
                        ),
                        url(${formData.image.imageUrl})
                      `,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      position: "relative",
                    }}
                  >
                    <Box sx={{ p: { xs: 1.5, sm: 2 }, color: "#fff" }}>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        textAlign={"center"}
                        sx={{
                          fontSize: { xs: "0.875rem", sm: "1.1rem" },
                          color: "#ffffff",
                        }}
                      >
                        {formData.image.title || "Titre"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: "0.7rem", sm: "0.8rem" },
                          opacity: 0.9,
                        }}
                        textAlign={"center"}
                      >
                        {formData.image.subTitle || "Sous-titre"}
                      </Typography>
                    </Box>
                  </Box>
                  {pendingHeroImage && (
                    <Chip
                      icon={<HourglassEmptyIcon sx={{ fontSize: 14 }} />}
                      label="Non enregistrée"
                      size="small"
                      onDelete={onCancelPendingHeroImage}
                      sx={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        bgcolor: "#ed6c02",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "0.65rem",
                        "& .MuiChip-deleteIcon": {
                          color: "#fff",
                          "&:hover": { color: "#ffcdd2" },
                        },
                      }}
                    />
                  )}
                </>
              ) : (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  sx={{ height: "100%", gap: 1 }}
                >
                  <ImageIcon
                    sx={{ fontSize: { xs: 40, sm: 60 }, color: "#94a3b8" }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                  >
                    Aucune image
                  </Typography>
                </Stack>
              )}
            </Box>
            <Grid
              right={9}
              zIndex={99}
              justifyContent="flex-end"
              top={30}
              p={1}
            >
              <Button
                component="label"
                variant="outlined"
                fullWidth
                size="large"
                startIcon={
                  pendingHeroImage ? (
                    <HourglassEmptyIcon sx={{ fontSize: 14 }} />
                  ) : (
                    <CloudUploadIcon sx={{ fontSize: 14 }} />
                  )
                }
                sx={{
                  minHeight: 28,
                  px: 1.2,
                  py: 0.8,
                  fontSize: "0.7rem",
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: pendingHeroImage ? "#ed6c02" : "#616637",
                  color: pendingHeroImage ? "#ed6c02" : "#616637",
                  "& .MuiButton-startIcon": { marginRight: 0.5 },
                  "&:hover": {
                    bgcolor: pendingHeroImage ? "#ed6c02" : "#e2e2d7",
                    color: pendingHeroImage ? "#ffffff" : "#616637",
                  },
                }}
              >
                {pendingHeroImage ? "Changer" : "Image"}
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={(e) =>
                    e.target.files?.[0] && onHeroImageSelect(e.target.files[0])
                  }
                />
              </Button>
            </Grid>
          </Grid>

          {/* Champs texte */}
          <Grid item xs={12} md={7} paddingTop={4} pl={3}>
            <Stack spacing={{ xs: 1.5, sm: 2 }}>
              <StyledTextField
                isSmall={isSmall}
                fullWidth
                label="Titre de la page"
                value={formData.image.title}
                onChange={(e: any) => onHeroImageChange("title", e.target.value)}
                placeholder="Ex: À propos de nous"
              />
              <StyledTextField
                isSmall={isSmall}
                fullWidth
                label="Sous-titre"
                value={formData.image.subTitle}
                onChange={(e: any) => onHeroImageChange("subTitle", e.target.value)}
                multiline
                rows={2}
                placeholder="Ex: Une agence de communication engagée..."
              />
              <Box sx={{ width: "100%" }}>
                <ColorPicker
                  label="Couleur du titre"
                  value={formData.image.color}
                  onChange={(value) => onHeroImageChange("color", value)}
                />
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default HeroImageSection;