// ============================================
// APPROACH SECTION - Section approche
// ============================================

"use client";
import React from "react";
import {
  Grid,
  Stack,
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

interface ApproachSectionProps {
  formData: PageContent;
  expanded: string | false;
  isSmall: boolean;
  onChangePanel: (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => void;
  onSectionChange: (section: "approach", field: string, value: string) => void;
}

const ApproachSection: React.FC<ApproachSectionProps> = ({
  formData,
  expanded,
  isSmall,
  onChangePanel,
  onSectionChange,
}) => {
  const config = SECTIONS_CONFIG[4];

  return (
    <Accordion
      expanded={expanded === "panel4"}
      onChange={onChangePanel("panel4")}
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
              color: expanded === "panel4" ? config.color : "inherit",
              fontSize: { xs: 20, sm: 24 },
            }}
          />
        }
        sx={{ px: { xs: 2, sm: 3 }, py: 1 }}
      >
        <AccordionHeader
          config={config}
          isExpanded={expanded === "panel4"}
          isSmall={isSmall}
        />
      </AccordionSummary>
      <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 3, sm: 4 } }}>
        <Stack spacing={{ xs: 1.5, sm: 2.5 }}>
          <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
            <Grid item xs={12} sm={4}>
              <StyledTextField
                isSmall={isSmall}
                fullWidth
                label="Sur-titre"
                value={formData.approach.subTitle}
                onChange={(e: any) =>
                  onSectionChange("approach", "subTitle", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <StyledTextField
                isSmall={isSmall}
                fullWidth
                label="Titre Principal"
                value={formData.approach.title}
                onChange={(e: any) =>
                  onSectionChange("approach", "title", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <ColorPicker
                label="Couleur"
                value={formData.approach.color}
                onChange={(value) =>
                  onSectionChange("approach", "color", value)
                }
              />
            </Grid>
          </Grid>
          <StyledTextField
            isSmall={isSmall}
            fullWidth
            multiline
            rows={isSmall ? 4 : 5}
            label="Description détaillée"
            value={formData.approach.description}
            onChange={(e: any) =>
              onSectionChange("approach", "description", e.target.value)
            }
            placeholder="Décrivez votre approche unique..."
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

export default ApproachSection;