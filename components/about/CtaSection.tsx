// ============================================
// CTA SECTION - Section appel à l'action
// ============================================

"use client";
import React from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LinkIcon from "@mui/icons-material/Link";
import TouchAppIcon from "@mui/icons-material/TouchApp";

import { CtaButton, PageContent } from "@/types/types";
import { SECTIONS_CONFIG } from "@/types/constants";
import { getSafeColor, safeAlpha } from "../ui/utils";
import AccordionHeader from "./AccordionHeader";
import StyledTextField from "./StyledTextField";
import ColorPicker from "./ColorPicker";

interface CtaSectionProps {
  formData: PageContent;
  expanded: string | false;
  isSmall: boolean;
  onChangePanel: (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => void;
  onCtaHeaderChange: (section: "cta", field: string, value: string) => void;
  onCtaButtonChange: (index: number, field: keyof CtaButton, value: string) => void;
  onAddCtaButton: () => void;
  onRemoveCtaButton: (index: number) => void;
}

const CtaSection: React.FC<CtaSectionProps> = ({
  formData,
  expanded,
  isSmall,
  onChangePanel,
  onCtaHeaderChange,
  onCtaButtonChange,
  onAddCtaButton,
  onRemoveCtaButton,
}) => {
  const config = SECTIONS_CONFIG[5];

  return (
    <Accordion
      expanded={expanded === "panel5"}
      onChange={onChangePanel("panel5")}
      elevation={0}
      sx={{
        "&::before": { display: "none" },
        "&.Mui-expanded": {
          bgcolor: safeAlpha(config.color, 0.02),
        },
      }}
    >
      <AccordionSummary
        expandIcon={
          <ExpandMoreIcon
            sx={{
              color: expanded === "panel5" ? config.color : "inherit",
              fontSize: { xs: 20, sm: 24 },
            }}
          />
        }
        sx={{ px: { xs: 2, sm: 3 }, py: 1 }}
      >
        <AccordionHeader
          config={config}
          isExpanded={expanded === "panel5"}
          isSmall={isSmall}
        />
      </AccordionSummary>
      <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 3, sm: 4 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2.5 },
            mb: { xs: 2, sm: 3 },
            borderRadius: { xs: 2, sm: 3 },
            background: `linear-gradient(135deg, ${safeAlpha(config.color, 0.05)} 0%, ${safeAlpha(config.color, 0.02)} 100%)`,
            border: `1px solid ${safeAlpha(config.color, 0.15)}`,
          }}
        >
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            <Grid item xs={12} sm={4}>
              <StyledTextField
                isSmall={isSmall}
                fullWidth
                label="Titre d'appel"
                value={formData.cta.title}
                onChange={(e: any) =>
                  onCtaHeaderChange("cta", "title", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StyledTextField
                isSmall={isSmall}
                fullWidth
                label="Sous-titre"
                value={formData.cta.subTitle}
                onChange={(e: any) =>
                  onCtaHeaderChange("cta", "subTitle", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <ColorPicker
                label="Couleur section"
                value={formData.cta.color}
                onChange={(value) => onCtaHeaderChange("cta", "color", value)}
              />
            </Grid>
          </Grid>
        </Paper>

        <Divider sx={{ mb: { xs: 2, sm: 3 } }}>
          <Chip
            icon={<TouchAppIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
            label="Boutons d'action"
            size="small"
            sx={{
              bgcolor: safeAlpha(config.color, 0.1),
              color: config.color,
              fontWeight: 600,
              fontSize: { xs: "0.65rem", sm: "0.75rem" },
              "& .MuiChip-icon": { color: config.color },
            }}
          />
        </Divider>

        <Stack spacing={{ xs: 1.5, sm: 2.5 }}>
          {formData.cta.buttons.map((btn, index) => {
            const safeBgColor = getSafeColor(btn.bgColor, "#616637");
            const safeTextColor = getSafeColor(btn.textColor, "#ffffff");

            return (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 2.5 },
                  borderRadius: { xs: 2, sm: 3 },
                  border: "1px solid",
                  borderColor: safeAlpha(safeBgColor, 0.3),
                  borderLeft: `5px solid ${safeBgColor}`,
                  bgcolor: safeAlpha(safeBgColor, 0.02),
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: `0 4px 20px ${safeAlpha(safeBgColor, 0.15)}`,
                  },
                }}
              >
                <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: { xs: 1, sm: 2 },
                      }}
                    >
                      <Chip
                        label={`Bouton ${index + 1}`}
                        size="small"
                        sx={{
                          bgcolor: safeBgColor,
                          color: safeTextColor,
                          fontWeight: 700,
                          fontSize: { xs: "0.65rem", sm: "0.75rem" },
                        }}
                      />
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          onClick={() => onRemoveCtaButton(index)}
                          sx={{ color: "#ef4444" }}
                        >
                          <DeleteOutlineIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StyledTextField
                      isSmall={isSmall}
                      fullWidth
                      label="Texte du bouton"
                      value={btn.label}
                      onChange={(e: any) =>
                        onCtaButtonChange(index, "label", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StyledTextField
                      isSmall={isSmall}
                      fullWidth
                      label="URL / Lien"
                      value={btn.href}
                      onChange={(e: any) =>
                        onCtaButtonChange(index, "href", e.target.value)
                      }
                      InputProps={{
                        startAdornment: (
                          <LinkIcon
                            sx={{
                              mr: 1,
                              opacity: 0.4,
                              fontSize: { xs: 16, sm: 20 },
                            }}
                          />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={6} md={3}>
                    <ColorPicker
                      label="Couleur fond"
                      value={btn.bgColor}
                      onChange={(value) =>
                        onCtaButtonChange(index, "bgColor", value)
                      }
                    />
                  </Grid>
                  <Grid item xs={6} sm={6} md={3}>
                    <ColorPicker
                      label="Couleur texte"
                      value={btn.textColor}
                      onChange={(value) =>
                        onCtaButtonChange(index, "textColor", value)
                      }
                    />
                  </Grid>
                  {/* Aperçu */}
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        pt: { xs: 1, sm: 1.5 },
                        borderTop: "1px dashed",
                        borderColor: "divider",
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                      >
                        Aperçu :
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: { xs: "0.7rem", sm: "0.8rem" },
                          bgcolor: safeBgColor,
                          color: safeTextColor,
                          border: `2px solid ${safeBgColor}`,
                          "&:hover": {
                            bgcolor: safeBgColor,
                            opacity: 0.9,
                          },
                        }}
                      >
                        {btn.label || "Bouton"}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            );
          })}

          <Button
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={onAddCtaButton}
            fullWidth
            size={isSmall ? "small" : "medium"}
            sx={{
              borderStyle: "dashed",
              borderWidth: 2,
              borderRadius: { xs: 2, sm: 3 },
              py: { xs: 1.5, sm: 2 },
              textTransform: "none",
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
              color: config.color,
              borderColor: config.color,
              "&:hover": {
                borderColor: config.color,
                bgcolor: safeAlpha(config.color, 0.05),
              },
            }}
          >
            Ajouter un bouton
          </Button>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

export default CtaSection;