// components/editor/ProjetsPreview.tsx
"use client";

import React from "react";
import {
  Box,
  Button,
  Typography,
  Grid,
  Stack,
  Paper,
  Chip,
} from "@mui/material";
import {
  Image as ImageIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { Heart, Leaf, Target } from "lucide-react";

// ============================================
// TYPES & INTERFACES
// ============================================

interface LabelItem {
  id: string;
  text: string;
}

interface ListItem {
  id: string;
  text: string;
}

interface ListGroup {
  id: string;
  title: string;
  items: ListItem[];
}

interface FeatureImage {
  imageId: string;
  imageUrl: string;
  logo: string;
  alt: string;
}

interface FeatureTheme {
  primaryColor: string;
}

interface FeatureContent {
  title: string;
  subtitle: string;
  description: string;
}

interface FeatureBox {
  id: string;
  theme: FeatureTheme;
  content: FeatureContent;
  labels: LabelItem[];
  listGroups: ListGroup[];
  image: FeatureImage;
  imageSide: "left" | "right";
  createdAt: string;
  updatedAt: string;
}

interface ProjetsPreviewProps {
  projets: FeatureBox[];
  onAddBox?: () => void;
  themeColor?: string;
  maxHeight?: string | number;
  compact?: boolean; // Mode compact pour preview
}

// ============================================
// CONSTANTES
// ============================================

const DEFAULT_THEME_COLOR = "#616637";

// Styles pour le mode compact
const COMPACT_STYLES = {
  card: {
    borderRadius: 3,
  },
  image: {
    minHeight: { xs: 120, lg: 180 },
  },
  logoBadge: {
    height: 36,
    width: 36,
    left: 12,
    top: 12,
    borderRadius: 2,
  },
  content: {
    p: { xs: 2, lg: 3 },
  },
  chip: {
    fontSize: "0.65rem",
    height: 20,
  },
  title: {
    fontSize: { xs: "1rem", md: "1.2rem" },
  },
  subtitle: {
    fontSize: "0.8rem",
  },
  description: {
    fontSize: "0.75rem",
    lineHeight: 1.6,
  },
  listTitle: {
    fontSize: "0.8rem",
  },
  listItem: {
    fontSize: "0.7rem",
  },
  listIcon: {
    height: 14,
    width: 14,
  },
  heartIcon: {
    height: 10,
    width: 10,
  },
  bullet: {
    height: 4,
    width: 4,
    mt: 0.6,
  },
  gap: 2.5,
  padding: { xs: 1.5, md: 3 },
};

// Styles normaux
const NORMAL_STYLES = {
  card: {
    borderRadius: 6,
  },
  image: {
    minHeight: { xs: 200, lg: 300 },
  },
  logoBadge: {
    height: 56,
    width: 56,
    left: 24,
    top: 24,
    borderRadius: 3,
  },
  content: {
    p: { xs: 4, lg: 6 },
  },
  chip: {
    fontSize: "0.75rem",
    height: 24,
  },
  title: {
    fontSize: { xs: "1.5rem", md: "2rem" },
  },
  subtitle: {
    fontSize: "1rem",
  },
  description: {
    fontSize: "0.875rem",
    lineHeight: 1.8,
  },
  listTitle: {
    fontSize: "1rem",
  },
  listItem: {
    fontSize: "0.875rem",
  },
  listIcon: {
    height: 20,
    width: 20,
  },
  heartIcon: {
    height: 14,
    width: 14,
  },
  bullet: {
    height: 6,
    width: 6,
    mt: 0.75,
  },
  gap: 5,
  padding: { xs: 2, md: 5 },
};

// ============================================
// HELPERS
// ============================================

const hexToRgba = (hex: string, alpha: number): string => {
  let c: any;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split("");
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = "0x" + c.join("");
    return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",")},${alpha})`;
  }
  return hex;
};

// ============================================
// SOUS-COMPOSANTS
// ============================================

interface ProjectCardProps {
  box: FeatureBox;
  index: number;
  styles: typeof COMPACT_STYLES;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ box, index, styles }) => {
  const primaryColor = box.theme.primaryColor;
  const isImageLeft = box.imageSide === "left";

  return (
    <Paper
      elevation={1}
      sx={{
        overflow: "hidden",
        // borderRadius: styles.card.borderRadius,
        bgcolor: hexToRgba(primaryColor, 0.05),
        border: `1px solid ${hexToRgba(primaryColor, 0.2)}`,
      }}
    >
      <Grid container direction={isImageLeft ? "row" : "row-reverse"}>
        {/* Image Section */}
        <Grid item xs={12} lg={5}>
          <Box
            sx={{
              position: "relative",
              aspectRatio: { xs: "2.5/1", lg: "auto" },
              height: "100%",
              minHeight: styles.image.minHeight,
              backgroundImage: box.image.imageUrl
                ? `url(${box.image.imageUrl})`
                : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              bgcolor: !box.image.imageUrl
                ? hexToRgba(primaryColor, 0.1)
                : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Placeholder si pas d'image */}
            {!box.image.imageUrl && (
              <Stack alignItems="center" spacing={0.5}>
                {box.image.logo ? (
                  <Box
                    component="img"
                    src={box.image.logo}
                    alt="Logo"
                    sx={{
                      width: 50,
                      height: 50,
                      objectFit: "contain",
                    //   opacity: 0.5,
                    }}
                  />
                ) : (
                  <ImageIcon
                    sx={{
                      fontSize: 40,
                      color: primaryColor,
                    //   opacity: 0.3,
                    }}
                  />
                )}
                <Typography
                  variant="caption"
                  sx={{ 
                    color: primaryColor, 
                    opacity: 0.5,
                    fontSize: "0.65rem",
                  }}
                >
                  Aucune image
                </Typography>
              </Stack>
            )}

            {/* Logo Badge */}
            {box.image.logo && (
              <Box
                sx={{
                  position: "absolute",
                  left: styles.logoBadge.left,
                  top: styles.logoBadge.top,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: styles.logoBadge.height,
                  width: styles.logoBadge.width,
                  borderRadius: styles.logoBadge.borderRadius,
                  bgcolor: "white",
                  boxShadow: 2,
                  p: 0.5,
                  overflow: "hidden",
                }}
              >
                <Box
                  component="img"
                  src={box.image.logo}
                  alt={box.image.alt || "Logo"}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </Box>
            )}
          </Box>
        </Grid>

        {/* Content Section */}
        <Grid item xs={12} lg={7}>
          <Box sx={styles.content}>
            {/* Tags / Labels */}
            {box.labels.length > 0 && (
              <Box
                sx={{
                  mb: 1,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.5,
                }}
              >
                {box.labels.map((label) => (
                  <Chip
                    key={label.id}
                    label={label.text}
                    size="small"
                    sx={{
                      bgcolor: hexToRgba(primaryColor, 0.1),
                      color: primaryColor,
                      fontWeight: 500,
                      fontSize: styles.chip.fontSize,
                      height: styles.chip.height,
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Titre */}
            <Typography
              variant="h5"
              component="h2"
              sx={{
                fontWeight: 700,
                color: "text.primary",
                fontSize: styles.title.fontSize,
                lineHeight: 1.2,
              }}
            >
              {box.content.title || `Feature ${index + 1}`}
            </Typography>

            {/* Sous-titre */}
            {box.content.subtitle && (
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 500,
                  color: primaryColor,
                  mt: 0.25,
                  fontSize: styles.subtitle.fontSize,
                }}
              >
                {box.content.subtitle}
              </Typography>
            )}

            {/* Description */}
            {box.content.description && (
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  lineHeight: styles.description.lineHeight,
                  mt: 1,
                  fontSize: styles.description.fontSize,
                }}
              >
                {box.content.description}
              </Typography>
            )}

            {/* List Groups */}
            {box.listGroups.length > 0 && (
              <Box
                sx={{
                  mt: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                {box.listGroups.map((group, groupIndex) => (
                  <ListGroupDisplay
                    key={group.id}
                    group={group}
                    groupIndex={groupIndex}
                    primaryColor={primaryColor}
                    styles={styles}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

interface ListGroupDisplayProps {
  group: ListGroup;
  groupIndex: number;
  primaryColor: string;
  styles: typeof COMPACT_STYLES;
}

const ListGroupDisplay: React.FC<ListGroupDisplayProps> = ({
  group,
  groupIndex,
  primaryColor,
  styles,
}) => {
  return (
    <Box>
      {/* Titre du groupe avec icône */}
      {group.title && (
        <Typography
          variant="subtitle2"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            fontWeight: 600,
            color: "text.primary",
            mb: 0.5,
            fontSize: styles.listTitle.fontSize,
          }}
        >
          {groupIndex === 0 ? (
            <Target
              style={{
                color: primaryColor,
                height: styles.listIcon.height,
                width: styles.listIcon.width,
              }}
            />
          ) : (
            <Leaf
              style={{
                color: primaryColor,
                height: styles.listIcon.height,
                width: styles.listIcon.width,
              }}
            />
          )}
          {group.title}
        </Typography>
      )}

      {/* Items - Style différent selon l'index */}
      {groupIndex === 0 ? (
        // Premier groupe : liste avec bullets
        <Box
          component="ul"
          sx={{
            pl: 1.5,
            m: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          {group.items.map((item) => (
            <Box
              component="li"
              key={item.id}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 0.75,
                fontSize: styles.listItem.fontSize,
                color: "text.secondary",
              }}
            >
              <Box
                sx={{
                  mt: styles.bullet.mt,
                  height: styles.bullet.height,
                  width: styles.bullet.width,
                  flexShrink: 0,
                  borderRadius: "50%",
                  bgcolor: primaryColor,
                }}
              />
              {item.text}
            </Box>
          ))}
        </Box>
      ) : (
        // Autres groupes : badges avec Heart
        <Box
          sx={{
            mt: 0.75,
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
          }}
        >
          {group.items.map((item) => (
            <Box
              key={item.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                borderRadius: 50,
                bgcolor: "rgba(255,255,255,0.7)",
                px: 1.25,
                py: 0.5,
                fontSize: styles.listItem.fontSize,
                color: "text.secondary",
                boxShadow: 1,
              }}
            >
              <Heart
                style={{
                  color: primaryColor,
                  height: styles.heartIcon.height,
                  width: styles.heartIcon.width,
                  flexShrink: 0,
                }}
              />
              {item.text}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

const ProjetsPreview: React.FC<ProjetsPreviewProps> = ({
  projets,
  onAddBox,
  themeColor = DEFAULT_THEME_COLOR,
  maxHeight = "80vh",
  compact = true, // Par défaut en mode compact
}) => {
  // Choisir les styles selon le mode
  const styles = compact ? COMPACT_STYLES : NORMAL_STYLES;

  // État vide
  if (projets.length === 0) {
    return (
      <Box
        sx={{
          bgcolor: "#fafafa",
          minHeight: compact ? 250 : 400,
          overflowY: "auto",
          maxHeight,
        }}
      >
        <Box sx={{ textAlign: "center", py: compact ? 4 : 6 }}>
          <ImageIcon
            sx={{
              fontSize: compact ? 40 : 64,
              color: themeColor,
              opacity: 0.3,
              mb: 1,
            }}
          />
          <Typography 
            color="textSecondary" 
            gutterBottom
            sx={{ fontSize: compact ? "0.8rem" : "1rem" }}
          >
            Aucune feature
          </Typography>
          {onAddBox && (
            <Button
              variant="contained"
              size={compact ? "small" : "medium"}
              startIcon={<AddIcon />}
              onClick={onAddBox}
              sx={{
                mt: 1.5,
                bgcolor: themeColor,
                fontSize: compact ? "0.75rem" : "0.875rem",
                "&:hover": {
                  bgcolor: hexToRgba(themeColor, 0.85),
                },
              }}
            >
              Créer une feature
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  // Liste des projets
  return (
    <Box
      sx={{
        bgcolor: "#fafafa",
        minHeight: compact ? 250 : 400,
        overflowY: "auto",
        maxHeight,
      }}
    >
      <Box sx={{ p: styles.padding }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: styles.gap }}>
          {projets.map((box, idx) => (
            <ProjectCard 
              key={box.id} 
              box={box} 
              index={idx} 
              styles={styles}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ProjetsPreview;

// Export des types pour réutilisation
export type {
  FeatureBox,
  FeatureContent,
  FeatureImage,
  FeatureTheme,
  LabelItem,
  ListItem,
  ListGroup,
  ProjetsPreviewProps,
};