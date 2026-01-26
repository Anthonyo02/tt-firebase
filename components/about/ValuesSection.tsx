// ============================================
// VALUES SECTION - Section des valeurs
// ============================================

"use client";
import React from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DiamondIcon from "@mui/icons-material/Diamond";

import AccordionHeader from "./AccordionHeader";
import StyledTextField from "./StyledTextField";
import ColorPicker from "./ColorPicker";
import ItemCard from "./ItemCard";
import { PageContent, ValueItem } from "@/types/types";
import { SECTIONS_CONFIG } from "@/types/constants";
import { safeAlpha } from "../ui/utils";

interface ValuesSectionProps {
  formData: PageContent;
  expanded: string | false;
  isSmall: boolean;
  onChangePanel: (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => void;
  onValuesHeaderChange: (field: string, value: string) => void;
  onValueItemChange: (index: number, field: keyof ValueItem, value: string) => void;
  onAddValueItem: () => void;
  onRemoveValueItem: (index: number) => void;
}

const ValuesSection: React.FC<ValuesSectionProps> = ({
  formData,
  expanded,
  isSmall,
  onChangePanel,
  onValuesHeaderChange,
  onValueItemChange,
  onAddValueItem,
  onRemoveValueItem,
}) => {
  const config = SECTIONS_CONFIG[3];

  return (
    <Accordion
      expanded={expanded === "panel3"}
      onChange={onChangePanel("panel3")}
      elevation={0}
      sx={{
        borderBottom: "1px solid #e2e8f0",
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
              color: expanded === "panel3" ? config.color : "inherit",
              fontSize: { xs: 20, sm: 24 },
            }}
          />
        }
        sx={{ px: { xs: 2, sm: 3 }, py: 1 }}
      >
        <AccordionHeader
          config={config}
          isExpanded={expanded === "panel3"}
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
                label="Sur-titre"
                value={formData.values.subTitle}
                onChange={(e: any) =>
                  onValuesHeaderChange("subTitle", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StyledTextField
                isSmall={isSmall}
                fullWidth
                label="Titre de section"
                value={formData.values.title}
                onChange={(e: any) =>
                  onValuesHeaderChange("title", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <ColorPicker
                label="Couleur section"
                value={formData.values.color}
                onChange={(value) => onValuesHeaderChange("color", value)}
              />
            </Grid>
          </Grid>
        </Paper>

        <Divider sx={{ mb: { xs: 2, sm: 3 } }}>
          <Chip
            icon={<DiamondIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
            label="Liste des valeurs"
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

        <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
          {formData.values.items.map((item, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <ItemCard
                onDelete={() => onRemoveValueItem(index)}
                color={item.color || config.color}
                index={index}
              >
                <Stack spacing={{ xs: 1.5, sm: 2 }}>
                  <StyledTextField
                    isSmall={isSmall}
                    fullWidth
                    label="Nom de la valeur"
                    value={item.title}
                    onChange={(e: any) =>
                      onValueItemChange(index, "title", e.target.value)
                    }
                  />
                  <StyledTextField
                    isSmall={isSmall}
                    fullWidth
                    multiline
                    rows={2}
                    label="Description"
                    value={item.description}
                    onChange={(e: any) =>
                      onValueItemChange(index, "description", e.target.value)
                    }
                  />
                  <ColorPicker
                    label="Couleur"
                    value={item.color}
                    onChange={(value) =>
                      onValueItemChange(index, "color", value)
                    }
                  />
                </Stack>
              </ItemCard>
            </Grid>
          ))}
          <Grid item xs={12} sm={6}>
            <Paper
              elevation={0}
              onClick={onAddValueItem}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: { xs: 2, sm: 3 },
                border: "2px dashed",
                borderColor: safeAlpha(config.color, 0.3),
                bgcolor: safeAlpha(config.color, 0.02),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                minHeight: { xs: 120, sm: 150 },
                "&:hover": {
                  borderColor: config.color,
                  bgcolor: safeAlpha(config.color, 0.05),
                  transform: { xs: "none", sm: "scale(1.02)" },
                },
              }}
            >
              <Stack alignItems="center" spacing={1}>
                <AddCircleOutlineIcon
                  sx={{
                    fontSize: { xs: 32, sm: 40 },
                    color: config.color,
                    opacity: 0.7,
                  }}
                />
                <Typography
                  color={config.color}
                  fontWeight={600}
                  sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
                >
                  Ajouter une valeur
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default ValuesSection;