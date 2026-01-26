// ============================================
// CARDS SECTION - Section Vision & Mission
// ============================================

"use client";
import React from "react";
import {
  Box,
  Button,
  Grid,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import AccordionHeader from "./AccordionHeader";
import StyledTextField from "./StyledTextField";
import ColorPicker from "./ColorPicker";
import ItemCard from "./ItemCard";
import { SECTIONS_CONFIG } from "@/types/constants";
import { safeAlpha } from "../ui/utils";
import { CardItem, PageContent } from "@/types/types";

interface CardsSectionProps {
  formData: PageContent;
  expanded: string | false;
  isSmall: boolean;
  onChangePanel: (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => void;
  onCardChange: (index: number, field: keyof CardItem, value: string) => void;
  onAddCard: () => void;
  onRemoveCard: (index: number) => void;
}

const CardsSection: React.FC<CardsSectionProps> = ({
  formData,
  expanded,
  isSmall,
  onChangePanel,
  onCardChange,
  onAddCard,
  onRemoveCard,
}) => {
  const config = SECTIONS_CONFIG[2];

  return (
    <Accordion
      expanded={expanded === "panel2"}
      onChange={onChangePanel("panel2")}
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
              color: expanded === "panel2" ? config.color : "inherit",
              fontSize: { xs: 20, sm: 24 },
            }}
          />
        }
        sx={{ px: { xs: 2, sm: 3 }, py: 1 }}
      >
        <AccordionHeader
          config={config}
          isExpanded={expanded === "panel2"}
          isSmall={isSmall}
        />
      </AccordionSummary>
      <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 3, sm: 4 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mb: { xs: 2, sm: 3 },
          }}
        >
          <Button
            startIcon={<AddCircleOutlineIcon />}
            onClick={onAddCard}
            variant="contained"
            size="small"
            sx={{
              background: config.gradient,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              boxShadow: `0 4px 14px ${safeAlpha(config.color, 0.4)}`,
            }}
          >
            {isSmall ? "Ajouter" : "Ajouter une carte"}
          </Button>
        </Box>
        <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
          {formData.cards.map((card, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <ItemCard
                onDelete={() => onRemoveCard(index)}
                color={card.color || config.color}
                index={index}
              >
                <Stack spacing={{ xs: 1.5, sm: 2 }}>
                  <StyledTextField
                    isSmall={isSmall}
                    fullWidth
                    label="Titre"
                    value={card.title}
                    onChange={(e: any) =>
                      onCardChange(index, "title", e.target.value)
                    }
                  />
                  <StyledTextField
                    isSmall={isSmall}
                    fullWidth
                    multiline
                    rows={isSmall ? 2 : 3}
                    label="Description"
                    value={card.description}
                    onChange={(e: any) =>
                      onCardChange(index, "description", e.target.value)
                    }
                  />
                  <ColorPicker
                    label="Couleur de la carte"
                    value={card.color}
                    onChange={(value) => onCardChange(index, "color", value)}
                  />
                </Stack>
              </ItemCard>
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default CardsSection;