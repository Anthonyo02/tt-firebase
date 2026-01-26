// ============================================
// HISTORY SECTION - Section histoire
// ============================================

"use client";
import React from "react";
import {
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import AccordionHeader from "./AccordionHeader";
import StyledTextField from "./StyledTextField";
import ColorPicker from "./ColorPicker";
import { PageContent } from "@/types/types";
import { SECTIONS_CONFIG } from "@/types/constants";
import { safeAlpha } from "../ui/utils";

interface HistorySectionProps {
  formData: PageContent;
  expanded: string | false;
  isSmall: boolean;
  onChangePanel: (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => void;
  onSectionChange: (section: "history", field: string, value: string) => void;
}

const HistorySection: React.FC<HistorySectionProps> = ({
  formData,
  expanded,
  isSmall,
  onChangePanel,
  onSectionChange,
}) => {
  const config = SECTIONS_CONFIG[1];

  return (
    <Accordion
      expanded={expanded === "panel1"}
      onChange={onChangePanel("panel1")}
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
              color: expanded === "panel1" ? config.color : "inherit",
              fontSize: { xs: 20, sm: 24 },
            }}
          />
        }
        sx={{ px: { xs: 2, sm: 3 }, py: 1 }}
      >
        <AccordionHeader
          config={config}
          isExpanded={expanded === "panel1"}
          isSmall={isSmall}
        />
      </AccordionSummary>
      <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 3, sm: 4 } }}>
        <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StyledTextField
              isSmall={isSmall}
              fullWidth
              label="Sur-titre"
              value={formData.history.subTitle}
              onChange={(e: any) =>
                onSectionChange("history", "subTitle", e.target.value)
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={5}>
            <StyledTextField
              isSmall={isSmall}
              fullWidth
              label="Titre Principal"
              value={formData.history.title}
              onChange={(e: any) =>
                onSectionChange("history", "title", e.target.value)
              }
            />
          </Grid>
          <Grid container item xs={12} md={3}>
            <ColorPicker
              label="Couleur"
              value={formData.history.color}
              onChange={(value) => onSectionChange("history", "color", value)}
            />
          </Grid>
          <Grid item xs={12}>
            <StyledTextField
              isSmall={isSmall}
              fullWidth
              multiline
              rows={isSmall ? 3 : 4}
              label="Description"
              value={formData.history.description}
              onChange={(e: any) =>
                onSectionChange("history", "description", e.target.value)
              }
              placeholder="Racontez l'histoire de votre entreprise..."
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default HistorySection;