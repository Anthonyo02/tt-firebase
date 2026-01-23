"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
} from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Grid,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
  Avatar,
  alpha,
  Badge,
  Snackbar,
  Alert,
  CircularProgress,
  Popover,
} from "@mui/material";

// Firebase
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Icônes
import SaveIcon from "@mui/icons-material/Save";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LinkIcon from "@mui/icons-material/Link";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DiamondIcon from "@mui/icons-material/Diamond";
import HandshakeIcon from "@mui/icons-material/Handshake";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ColorLensIcon from "@mui/icons-material/ColorLens";

// --- Helper pour alpha avec couleurs non supportées ---
const safeAlpha = (color: string, opacity: number): string => {
  const unsupportedColors = ["transparent", "inherit", "initial", "unset", ""];

  if (!color || unsupportedColors.includes(color.toLowerCase().trim())) {
    return `rgba(97, 102, 55, ${opacity})`;
  }

  try {
    return alpha(color, opacity);
  } catch {
    return `rgba(97, 102, 55, ${opacity})`;
  }
};

// --- Helper pour obtenir une couleur safe ---
const getSafeColor = (color: string, fallback: string = "#616637"): string => {
  const unsupportedColors = ["transparent", "inherit", "initial", "unset", ""];

  if (!color || unsupportedColors.includes(color.toLowerCase().trim())) {
    return fallback;
  }

  return color;
};

// --- Interfaces ---
interface CardItem {
  title: string;
  description: string;
  color: string;
}

interface ValueItem {
  title: string;
  description: string;
  color: string;
}

interface CtaButton {
  label: string;
  href: string;
  bgColor: string;
  textColor: string;
}

interface PageContent {
  history: {
    subTitle: string;
    title: string;
    description: string;
    color: string;
  };
  cards: CardItem[];
  values: {
    subTitle: string;
    title: string;
    color: string;
    items: ValueItem[];
  };
  approach: {
    subTitle: string;
    title: string;
    description: string;
    color: string;
  };
  cta: {
    title: string;
    subTitle: string;
    color: string;
    buttons: CtaButton[];
  };
}

interface EditAboutModalProps {
  open: boolean;
  onClose: () => void;
}

// --- Default Data ---
const DEFAULT_DATA: PageContent = {
  history: {
    subTitle: "NOTRE HISTOIRE",
    title: "Tolo-Tady Communication",
    description:
      "Tolo-Tady Communication est une agence de communication malgache...",
    color: "#616637",
  },
  cards: [
    {
      title: "Notre Vision",
      description: "Devenir l'agence de référence...",
      color: "#616637",
    },
    {
      title: "Notre Mission",
      description: "Accompagner les acteurs du changement...",
      color: "#8C915D",
    },
  ],
  values: {
    subTitle: "CE QUI NOUS GUIDE",
    title: "Nos valeurs",
    color: "#616637",
    items: [
      {
        title: "Engagement",
        description: "Nous croyons en une communication qui a du sens.",
        color: "#616637",
      },
      {
        title: "Proximité",
        description: "Nous travaillons main dans la main.",
        color: "#8C915D",
      },
    ],
  },
  approach: {
    subTitle: "NOTRE DIFFÉRENCE",
    title: "Une approche humaine",
    description:
      "Chez Tolo-Tady, nous croyons que la meilleure communication...",
    color: "#616637",
  },
  cta: {
    title: "Envie de travailler avec nous ?",
    subTitle: "Découvrez nos services ou contactez-nous.",
    color: "#616637",
    buttons: [
      {
        label: "Nos services",
        href: "/services",
        bgColor: "#616637",
        textColor: "#ffffff",
      },
      {
        label: "Nous contacter",
        href: "/contact",
        bgColor: "#ffffff",
        textColor: "#616637",
      },
    ],
  },
};

// --- Couleurs prédéfinies pour le color picker ---
const PRESET_COLORS = [
  "#616637",
  "#8C915D",
  "#4A4F2B",
  "#A5AA82",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#8b5cf6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
  "#a855f7",
];

// --- Configuration des sections avec couleurs ---
const SECTIONS_CONFIG = [
  {
    id: "panel1",
    icon: <HistoryEduIcon />,
    title: "Histoire & Introduction",
    sub: "Titres principaux et description",
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  },
  {
    id: "panel2",
    icon: <VisibilityIcon />,
    title: "Vision & Mission",
    sub: "Cartes principales",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
  },
  {
    id: "panel3",
    icon: <DiamondIcon />,
    title: "Nos Valeurs",
    sub: "Liste des valeurs de l'entreprise",
    color: "#ec4899",
    gradient: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
  },
  {
    id: "panel4",
    icon: <HandshakeIcon />,
    title: "Notre Approche",
    sub: "Texte descriptif de la méthode",
    color: "#14b8a6",
    gradient: "linear-gradient(135deg, #14b8a6 0%, #10b981 100%)",
  },
  {
    id: "panel5",
    icon: <TouchAppIcon />,
    title: "Appel à l'action",
    sub: "Boutons et liens de bas de page",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  },
];

// =============================================================================
// COMPOSANT COLOR PICKER OPTIMISÉ AVEC POPOVER
// =============================================================================
interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorPicker = memo<ColorPickerProps>(({ label, value, onChange }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [tempColor, setTempColor] = useState(() =>
    getSafeColor(value, "#616637")
  );
  const open = Boolean(anchorEl);

  // Sync avec la valeur externe
  useEffect(() => {
    setTempColor(getSafeColor(value, "#616637"));
  }, [value]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    if (tempColor !== value) {
      onChange(tempColor);
    }
  }, [tempColor, value, onChange]);

  const handlePresetClick = useCallback(
    (color: string) => {
      setTempColor(color);
      onChange(color);
      setAnchorEl(null);
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (/^#[0-9A-Fa-f]{0,6}$/.test(newValue) || newValue === "") {
        setTempColor(newValue || "#");
      }
    },
    []
  );

  const handleColorInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTempColor(e.target.value);
    },
    []
  );

  return (
    <>
      <TextField
        label={label}
        value={tempColor}
        onClick={handleClick}
        fullWidth
        size="small"
        InputProps={{
          readOnly: true,
          startAdornment: (
            <Box
              sx={{
                width: { xs: 20, sm: 24 },
                height: { xs: 20, sm: 24 },
                borderRadius: 1,
                bgcolor: tempColor,
                border: "2px solid #e2e8f0",
                mr: 1,
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
          ),
          endAdornment: (
            <ColorLensIcon
              sx={{
                color: tempColor,
                fontSize: { xs: 18, sm: 20 },
                opacity: 0.7,
              }}
            />
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#fff",
            borderRadius: 2,
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "#fafafa",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: tempColor,
              },
            },
          },
          "& input": {
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          },
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            p: { xs: 1.5, sm: 2 },
            borderRadius: 3,
            minWidth: { xs: 260, sm: 280 },
            maxWidth: 320,
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
          >
            Choisir une couleur
          </Typography>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Couleurs prédéfinies */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: "block", fontWeight: 500 }}
        >
          Couleurs prédéfinies
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: 0.75,
            mb: 2,
          }}
        >
          {PRESET_COLORS.map((color) => (
            <Tooltip key={color} title={color} arrow placement="top">
              <Box
                onClick={() => handlePresetClick(color)}
                sx={{
                  width: { xs: 28, sm: 32 },
                  height: { xs: 28, sm: 32 },
                  borderRadius: 1.5,
                  bgcolor: color,
                  cursor: "pointer",
                  border:
                    tempColor.toLowerCase() === color.toLowerCase()
                      ? "3px solid #1a1a1a"
                      : "2px solid #e2e8f0",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    transform: "scale(1.15)",
                    boxShadow: `0 4px 12px ${safeAlpha(color, 0.5)}`,
                    zIndex: 1,
                  },
                }}
              />
            </Tooltip>
          ))}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Couleur personnalisée */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: "block", fontWeight: 500 }}
        >
          Couleur personnalisée
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            component="input"
            type="color"
            value={tempColor.length === 7 ? tempColor : "#616637"}
            onChange={handleColorInputChange}
            sx={{
              width: { xs: 44, sm: 50 },
              height: { xs: 36, sm: 40 },
              border: "2px solid #e2e8f0",
              borderRadius: 2,
              cursor: "pointer",
              padding: 0,
              overflow: "hidden",
              "&::-webkit-color-swatch-wrapper": { padding: 0 },
              "&::-webkit-color-swatch": {
                border: "none",
                borderRadius: 1,
              },
            }}
          />
          <TextField
            size="small"
            value={tempColor}
            onChange={handleInputChange}
            placeholder="#616637"
            sx={{
              flex: 1,
              "& input": {
                fontFamily: "monospace",
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                textTransform: "uppercase",
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </Box>

        {/* Aperçu et bouton appliquer */}
        <Box sx={{ mt: 2, display: "flex", gap: 1, alignItems: "center" }}>
          <Box
            sx={{
              flex: 1,
              height: 36,
              borderRadius: 2,
              bgcolor: tempColor,
              border: "1px solid #e2e8f0",
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleClose}
            startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
            sx={{
              bgcolor: tempColor,
              color:
                parseInt(tempColor.slice(1), 16) > 0xffffff / 2
                  ? "#1a1a1a"
                  : "#fff",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              px: 2,
              "&:hover": {
                bgcolor: tempColor,
                opacity: 0.9,
              },
            }}
          >
            OK
          </Button>
        </Box>
      </Popover>
    </>
  );
});

ColorPicker.displayName = "ColorPicker";

// =============================================================================
// COMPOSANT STYLED TEXTFIELD MÉMORISÉ
// =============================================================================
interface StyledTextFieldProps {
  fullWidth?: boolean;
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  size?: "small" | "medium";
  InputProps?: any;
  sx?: any;
}

const StyledTextField = memo<StyledTextFieldProps>((props) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <TextField
      {...props}
      size={isSmall ? "small" : props.size || "small"}
      sx={{
        "& .MuiOutlinedInput-root": {
          backgroundColor: "#fff",
          borderRadius: 2,
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: "#fafafa",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#c7d2fe",
            },
          },
          "&.Mui-focused": {
            backgroundColor: "#fff",
            boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.1)",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#6366f1",
            },
          },
        },
        "& .MuiInputLabel-root.Mui-focused": {
          color: "#6366f1",
        },
        ...props.sx,
      }}
    />
  );
});

StyledTextField.displayName = "StyledTextField";

// =============================================================================
// COMPOSANT ACCORDION HEADER MÉMORISÉ
// =============================================================================
interface AccordionHeaderProps {
  config: (typeof SECTIONS_CONFIG)[0];
  isExpanded: boolean;
  isSmall: boolean;
}

const AccordionHeader = memo<AccordionHeaderProps>(
  ({ config, isExpanded, isSmall }) => (
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
          background: isExpanded
            ? config.gradient
            : safeAlpha(config.color, 0.1),
          color: isExpanded ? "#fff" : config.color,
          transition: "all 0.3s ease",
          boxShadow: isExpanded
            ? `0 4px 14px ${safeAlpha(config.color, 0.4)}`
            : "none",
        }}
      >
        {React.cloneElement(config.icon, {
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
  )
);

AccordionHeader.displayName = "AccordionHeader";

// =============================================================================
// COMPOSANT ITEM CARD MÉMORISÉ
// =============================================================================
interface ItemCardProps {
  children: React.ReactNode;
  onDelete: () => void;
  color: string;
  index: number;
}

const ItemCard = memo<ItemCardProps>(({ children, onDelete, color, index }) => {
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
});

ItemCard.displayName = "ItemCard";

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================
const EditAboutModal: React.FC<EditAboutModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const [expanded, setExpanded] = useState<string | false>("panel1");

  // États
  const [formData, setFormData] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  // Firebase Sync
  useEffect(() => {
    if (!open) return;

    const docRef = doc(db, "website_content", "full_about");

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as PageContent;
          setFormData({
            history: {
              subTitle: data.history?.subTitle || DEFAULT_DATA.history.subTitle,
              title: data.history?.title || DEFAULT_DATA.history.title,
              description:
                data.history?.description || DEFAULT_DATA.history.description,
              color: data.history?.color || DEFAULT_DATA.history.color,
            },
            cards: Array.isArray(data.cards)
              ? data.cards.map((c: any) => ({
                  title: c.title || "",
                  description: c.description || "",
                  color: c.color || "#616637",
                }))
              : DEFAULT_DATA.cards,
            values: {
              subTitle: data.values?.subTitle || DEFAULT_DATA.values.subTitle,
              title: data.values?.title || DEFAULT_DATA.values.title,
              color: data.values?.color || DEFAULT_DATA.values.color,
              items: Array.isArray(data.values?.items)
                ? data.values.items.map((v: any) => ({
                    title: v.title || "",
                    description: v.description || "",
                    color: v.color || "#616637",
                  }))
                : DEFAULT_DATA.values.items,
            },
            approach: {
              subTitle:
                data.approach?.subTitle || DEFAULT_DATA.approach.subTitle,
              title: data.approach?.title || DEFAULT_DATA.approach.title,
              description:
                data.approach?.description || DEFAULT_DATA.approach.description,
              color: data.approach?.color || DEFAULT_DATA.approach.color,
            },
            cta: {
              title: data.cta?.title || DEFAULT_DATA.cta.title,
              subTitle: data.cta?.subTitle || DEFAULT_DATA.cta.subTitle,
              color: data.cta?.color || DEFAULT_DATA.cta.color,
              buttons: Array.isArray(data.cta?.buttons)
                ? data.cta.buttons.map((b: any) => ({
                    label: b.label || "",
                    href: b.href || "#",
                    bgColor: b.bgColor || "#616637",
                    textColor: b.textColor || "#ffffff",
                  }))
                : DEFAULT_DATA.cta.buttons,
            },
          });
        } else {
          setDoc(docRef, DEFAULT_DATA);
          setFormData(DEFAULT_DATA);
        }
        setLoading(false);
        setHasChanges(false);
      },
      (error) => {
        console.error("Erreur Firebase:", error);
        setToast({ msg: "Erreur de connexion", type: "error" });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [open]);

  const handleChangePanel = useCallback(
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    },
    []
  );

  // --- Gestionnaires optimisés avec useCallback ---
  const handleSimpleSectionChange = useCallback(
    (section: "history" | "approach" | "cta", field: string, value: string) => {
      setFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [section]: {
            ...(prev[section] as object),
            [field]: value,
          },
        };
      });
      setHasChanges(true);
    },
    []
  );

  const handleCardChange = useCallback(
    (index: number, field: "title" | "description" | "color", value: string) => {
      setFormData((prev) => {
        if (!prev) return prev;
        const newCards = [...prev.cards];
        newCards[index] = { ...newCards[index], [field]: value };
        return { ...prev, cards: newCards };
      });
      setHasChanges(true);
    },
    []
  );

  const handleValueItemChange = useCallback(
    (index: number, field: "title" | "description" | "color", value: string) => {
      setFormData((prev) => {
        if (!prev) return prev;
        const newItems = [...prev.values.items];
        newItems[index] = { ...newItems[index], [field]: value };
        return {
          ...prev,
          values: { ...prev.values, items: newItems },
        };
      });
      setHasChanges(true);
    },
    []
  );

  const handleValuesHeaderChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          values: { ...prev.values, [field]: value },
        };
      });
      setHasChanges(true);
    },
    []
  );

  const handleAddCard = useCallback(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      const newCard: CardItem = { title: "", description: "", color: "#616637" };
      return { ...prev, cards: [...prev.cards, newCard] };
    });
    setHasChanges(true);
  }, []);

  const handleRemoveCard = useCallback((index: number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cards: prev.cards.filter((_, i) => i !== index),
      };
    });
    setHasChanges(true);
  }, []);

  const handleAddValueItem = useCallback(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      const newItem: ValueItem = { title: "", description: "", color: "#616637" };
      return {
        ...prev,
        values: {
          ...prev.values,
          items: [...prev.values.items, newItem],
        },
      };
    });
    setHasChanges(true);
  }, []);

  const handleRemoveValueItem = useCallback((index: number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        values: {
          ...prev.values,
          items: prev.values.items.filter((_, i) => i !== index),
        },
      };
    });
    setHasChanges(true);
  }, []);

  const handleCtaButtonChange = useCallback(
    (index: number, field: keyof CtaButton, value: string) => {
      setFormData((prev) => {
        if (!prev) return prev;
        const newButtons = [...prev.cta.buttons];
        newButtons[index] = { ...newButtons[index], [field]: value };
        return { ...prev, cta: { ...prev.cta, buttons: newButtons } };
      });
      setHasChanges(true);
    },
    []
  );

  const handleAddCtaButton = useCallback(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cta: {
          ...prev.cta,
          buttons: [
            ...prev.cta.buttons,
            {
              label: "Action",
              href: "#",
              bgColor: "#616637",
              textColor: "#ffffff",
            },
          ],
        },
      };
    });
    setHasChanges(true);
  }, []);

  const handleRemoveCtaButton = useCallback((index: number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cta: {
          ...prev.cta,
          buttons: prev.cta.buttons.filter((_, i) => i !== index),
        },
      };
    });
    setHasChanges(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData) return;
    setSaving(true);

    try {
      await updateDoc(doc(db, "website_content", "full_about"), {
        history: formData.history,
        cards: formData.cards,
        values: formData.values,
        approach: formData.approach,
        cta: formData.cta,
      });

      setToast({ msg: "Sauvegarde réussie !", type: "success" });
      setHasChanges(false);
    } catch (error: any) {
      console.error("Erreur sauvegarde:", error);
      setToast({ msg: error.message || "Erreur de sauvegarde", type: "error" });
    } finally {
      setSaving(false);
    }
  }, [formData]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      if (
        window.confirm(
          "Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?"
        )
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  // Loading state
  if (loading || !formData) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 300,
          }}
        >
          <Stack alignItems="center" spacing={2}>
            <CircularProgress sx={{ color: "#616637" }} />
            <Typography>Chargement...</Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        fullScreen={fullScreen}
        PaperProps={{
          sx: {
            borderRadius: fullScreen ? 0 : 4,
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          },
        }}
      >
        {/* --- HEADER --- */}
        <DialogTitle
          sx={{
            background:
              "linear-gradient(135deg, #818660 0%, #cdd1b3ff 50%, #6b7052 100%)",
            color: "#fff",
            py: { xs: 2, sm: 3 },
            px: { xs: 2, sm: 3 },
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              <Avatar
                sx={{
                  width: { xs: 40, sm: 50 },
                  height: { xs: 40, sm: 50 },
                  bgcolor: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <EditNoteIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
              </Avatar>
              <Box>
                <Typography
                  variant="h5"
                  fontWeight={800}
                  sx={{ fontSize: { xs: "1.1rem", sm: "1.5rem" } }}
                >
                  Éditer "À Propos"
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    mt: 0.5,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  Personnalisez le contenu de votre page
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              {hasChanges && (
                <Chip
                  label={isSmall ? "!" : "Non sauvegardé"}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                  }}
                />
              )}
              <IconButton
                onClick={handleClose}
                sx={{
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,0.15)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
                }}
                size={isSmall ? "small" : "medium"}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>
        </DialogTitle>

        {/* --- CONTENT --- */}
        <DialogContent sx={{ p: 0, bgcolor: "#f8fafc" }}>
          {/* SECTION 1: HISTOIRE */}
          <Accordion
            expanded={expanded === "panel1"}
            onChange={handleChangePanel("panel1")}
            elevation={0}
            sx={{
              borderBottom: "1px solid #e2e8f0",
              "&::before": { display: "none" },
              "&.Mui-expanded": {
                bgcolor: safeAlpha(SECTIONS_CONFIG[0].color, 0.02),
              },
            }}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon
                  sx={{
                    color:
                      expanded === "panel1"
                        ? SECTIONS_CONFIG[0].color
                        : "inherit",
                    fontSize: { xs: 20, sm: 24 },
                  }}
                />
              }
              sx={{ px: { xs: 2, sm: 3 }, py: 1 }}
            >
              <AccordionHeader
                config={SECTIONS_CONFIG[0]}
                isExpanded={expanded === "panel1"}
                isSmall={isSmall}
              />
            </AccordionSummary>
            <AccordionDetails
              sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 3, sm: 4 } }}
            >
              <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <StyledTextField
                    fullWidth
                    label="Sur-titre"
                    value={formData.history.subTitle}
                    onChange={(e: any) =>
                      handleSimpleSectionChange(
                        "history",
                        "subTitle",
                        e.target.value
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={5}>
                  <StyledTextField
                    fullWidth
                    label="Titre Principal"
                    value={formData.history.title}
                    onChange={(e: any) =>
                      handleSimpleSectionChange(
                        "history",
                        "title",
                        e.target.value
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <ColorPicker
                    label="Couleur"
                    value={formData.history.color}
                    onChange={(value) =>
                      handleSimpleSectionChange("history", "color", value)
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <StyledTextField
                    fullWidth
                    multiline
                    rows={isSmall ? 3 : 4}
                    label="Description"
                    value={formData.history.description}
                    onChange={(e: any) =>
                      handleSimpleSectionChange(
                        "history",
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Racontez l'histoire de votre entreprise..."
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* SECTION 2: CARDS */}
          <Accordion
            expanded={expanded === "panel2"}
            onChange={handleChangePanel("panel2")}
            elevation={0}
            sx={{
              borderBottom: "1px solid #e2e8f0",
              "&::before": { display: "none" },
              "&.Mui-expanded": {
                bgcolor: safeAlpha(SECTIONS_CONFIG[1].color, 0.02),
              },
            }}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon
                  sx={{
                    color:
                      expanded === "panel2"
                        ? SECTIONS_CONFIG[1].color
                        : "inherit",
                    fontSize: { xs: 20, sm: 24 },
                  }}
                />
              }
              sx={{ px: { xs: 2, sm: 3 }, py: 1 }}
            >
              <AccordionHeader
                config={SECTIONS_CONFIG[1]}
                isExpanded={expanded === "panel2"}
                isSmall={isSmall}
              />
            </AccordionSummary>
            <AccordionDetails
              sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 3, sm: 4 } }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mb: { xs: 2, sm: 3 },
                }}
              >
                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={handleAddCard}
                  variant="contained"
                  size={isSmall ? "small" : "small"}
                  sx={{
                    background: SECTIONS_CONFIG[1].gradient,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    boxShadow: `0 4px 14px ${safeAlpha(
                      SECTIONS_CONFIG[1].color,
                      0.4
                    )}`,
                  }}
                >
                  {isSmall ? "Ajouter" : "Ajouter une carte"}
                </Button>
              </Box>
              <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
                {formData.cards.map((card, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <ItemCard
                      onDelete={() => handleRemoveCard(index)}
                      color={card.color || SECTIONS_CONFIG[1].color}
                      index={index}
                    >
                      <Stack spacing={{ xs: 1.5, sm: 2 }}>
                        <StyledTextField
                          fullWidth
                          label="Titre"
                          value={card.title}
                          onChange={(e: any) =>
                            handleCardChange(index, "title", e.target.value)
                          }
                        />
                        <StyledTextField
                          fullWidth
                          multiline
                          rows={isSmall ? 2 : 3}
                          label="Description"
                          value={card.description}
                          onChange={(e: any) =>
                            handleCardChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                        />
                        <ColorPicker
                          label="Couleur de la carte"
                          value={card.color}
                          onChange={(value) =>
                            handleCardChange(index, "color", value)
                          }
                        />
                      </Stack>
                    </ItemCard>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* SECTION 3: VALEURS */}
          <Accordion
            expanded={expanded === "panel3"}
            onChange={handleChangePanel("panel3")}
            elevation={0}
            sx={{
              borderBottom: "1px solid #e2e8f0",
              "&::before": { display: "none" },
              "&.Mui-expanded": {
                bgcolor: safeAlpha(SECTIONS_CONFIG[2].color, 0.02),
              },
            }}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon
                  sx={{
                    color:
                      expanded === "panel3"
                        ? SECTIONS_CONFIG[2].color
                        : "inherit",
                    fontSize: { xs: 20, sm: 24 },
                  }}
                />
              }
              sx={{ px: { xs: 2, sm: 3 }, py: 1 }}
            >
              <AccordionHeader
                config={SECTIONS_CONFIG[2]}
                isExpanded={expanded === "panel3"}
                isSmall={isSmall}
              />
            </AccordionSummary>
            <AccordionDetails
              sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 3, sm: 4 } }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 2.5 },
                  mb: { xs: 2, sm: 3 },
                  borderRadius: { xs: 2, sm: 3 },
                  background: `linear-gradient(135deg, ${safeAlpha(
                    SECTIONS_CONFIG[2].color,
                    0.05
                  )} 0%, ${safeAlpha(SECTIONS_CONFIG[2].color, 0.02)} 100%)`,
                  border: `1px solid ${safeAlpha(
                    SECTIONS_CONFIG[2].color,
                    0.15
                  )}`,
                }}
              >
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <StyledTextField
                      fullWidth
                      label="Sur-titre"
                      value={formData.values.subTitle}
                      onChange={(e: any) =>
                        handleValuesHeaderChange("subTitle", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <StyledTextField
                      fullWidth
                      label="Titre de section"
                      value={formData.values.title}
                      onChange={(e: any) =>
                        handleValuesHeaderChange("title", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <ColorPicker
                      label="Couleur section"
                      value={formData.values.color}
                      onChange={(value) =>
                        handleValuesHeaderChange("color", value)
                      }
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
                    bgcolor: safeAlpha(SECTIONS_CONFIG[2].color, 0.1),
                    color: SECTIONS_CONFIG[2].color,
                    fontWeight: 600,
                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                    "& .MuiChip-icon": { color: SECTIONS_CONFIG[2].color },
                  }}
                />
              </Divider>

              <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
                {formData.values.items.map((item, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <ItemCard
                      onDelete={() => handleRemoveValueItem(index)}
                      color={item.color || SECTIONS_CONFIG[2].color}
                      index={index}
                    >
                      <Stack spacing={{ xs: 1.5, sm: 2 }}>
                        <StyledTextField
                          fullWidth
                          label="Nom de la valeur"
                          value={item.title}
                          onChange={(e: any) =>
                            handleValueItemChange(
                              index,
                              "title",
                              e.target.value
                            )
                          }
                        />
                        <StyledTextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Description"
                          value={item.description}
                          onChange={(e: any) =>
                            handleValueItemChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                        />
                        <ColorPicker
                          label="Couleur"
                          value={item.color}
                          onChange={(value) =>
                            handleValueItemChange(index, "color", value)
                          }
                        />
                      </Stack>
                    </ItemCard>
                  </Grid>
                ))}
                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    onClick={handleAddValueItem}
                    sx={{
                      p: { xs: 3, sm: 4 },
                      borderRadius: { xs: 2, sm: 3 },
                      border: "2px dashed",
                      borderColor: safeAlpha(SECTIONS_CONFIG[2].color, 0.3),
                      bgcolor: safeAlpha(SECTIONS_CONFIG[2].color, 0.02),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      minHeight: { xs: 120, sm: 150 },
                      "&:hover": {
                        borderColor: SECTIONS_CONFIG[2].color,
                        bgcolor: safeAlpha(SECTIONS_CONFIG[2].color, 0.05),
                        transform: { xs: "none", sm: "scale(1.02)" },
                      },
                    }}
                  >
                    <Stack alignItems="center" spacing={1}>
                      <AddCircleOutlineIcon
                        sx={{
                          fontSize: { xs: 32, sm: 40 },
                          color: SECTIONS_CONFIG[2].color,
                          opacity: 0.7,
                        }}
                      />
                      <Typography
                        color={SECTIONS_CONFIG[2].color}
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

          {/* SECTION 4: APPROCHE */}
          <Accordion
            expanded={expanded === "panel4"}
            onChange={handleChangePanel("panel4")}
            elevation={0}
            sx={{
              borderBottom: "1px solid #e2e8f0",
              "&::before": { display: "none" },
              "&.Mui-expanded": {
                bgcolor: safeAlpha(SECTIONS_CONFIG[3].color, 0.02),
              },
            }}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon
                  sx={{
                    color:
                      expanded === "panel4"
                        ? SECTIONS_CONFIG[3].color
                        : "inherit",
                    fontSize: { xs: 20, sm: 24 },
                  }}
                />
              }
              sx={{ px: { xs: 2, sm: 3 }, py: 1 }}
            >
              <AccordionHeader
                config={SECTIONS_CONFIG[3]}
                isExpanded={expanded === "panel4"}
                isSmall={isSmall}
              />
            </AccordionSummary>
            <AccordionDetails
              sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 3, sm: 4 } }}
            >
              <Stack spacing={{ xs: 1.5, sm: 2.5 }}>
                <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
                  <Grid item xs={12} sm={4}>
                    <StyledTextField
                      fullWidth
                      label="Sur-titre"
                      value={formData.approach.subTitle}
                      onChange={(e: any) =>
                        handleSimpleSectionChange(
                          "approach",
                          "subTitle",
                          e.target.value
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <StyledTextField
                      fullWidth
                      label="Titre Principal"
                      value={formData.approach.title}
                      onChange={(e: any) =>
                        handleSimpleSectionChange(
                          "approach",
                          "title",
                          e.target.value
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <ColorPicker
                      label="Couleur"
                      value={formData.approach.color}
                      onChange={(value) =>
                        handleSimpleSectionChange("approach", "color", value)
                      }
                    />
                  </Grid>
                </Grid>
                <StyledTextField
                  fullWidth
                  multiline
                  rows={isSmall ? 4 : 5}
                  label="Description détaillée"
                  value={formData.approach.description}
                  onChange={(e: any) =>
                    handleSimpleSectionChange(
                      "approach",
                      "description",
                      e.target.value
                    )
                  }
                  placeholder="Décrivez votre approche unique..."
                />
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* SECTION 5: CTA */}
          <Accordion
            expanded={expanded === "panel5"}
            onChange={handleChangePanel("panel5")}
            elevation={0}
            sx={{
              "&::before": { display: "none" },
              "&.Mui-expanded": {
                bgcolor: safeAlpha(SECTIONS_CONFIG[4].color, 0.02),
              },
            }}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon
                  sx={{
                    color:
                      expanded === "panel5"
                        ? SECTIONS_CONFIG[4].color
                        : "inherit",
                    fontSize: { xs: 20, sm: 24 },
                  }}
                />
              }
              sx={{ px: { xs: 2, sm: 3 }, py: 1 }}
            >
              <AccordionHeader
                config={SECTIONS_CONFIG[4]}
                isExpanded={expanded === "panel5"}
                isSmall={isSmall}
              />
            </AccordionSummary>
            <AccordionDetails
              sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 3, sm: 4 } }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 2.5 },
                  mb: { xs: 2, sm: 3 },
                  borderRadius: { xs: 2, sm: 3 },
                  background: `linear-gradient(135deg, ${safeAlpha(
                    SECTIONS_CONFIG[4].color,
                    0.05
                  )} 0%, ${safeAlpha(SECTIONS_CONFIG[4].color, 0.02)} 100%)`,
                  border: `1px solid ${safeAlpha(
                    SECTIONS_CONFIG[4].color,
                    0.15
                  )}`,
                }}
              >
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <StyledTextField
                      fullWidth
                      label="Titre d'appel"
                      value={formData.cta.title}
                      onChange={(e: any) =>
                        handleSimpleSectionChange(
                          "cta",
                          "title",
                          e.target.value
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <StyledTextField
                      fullWidth
                      label="Sous-titre"
                      value={formData.cta.subTitle}
                      onChange={(e: any) =>
                        handleSimpleSectionChange(
                          "cta",
                          "subTitle",
                          e.target.value
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <ColorPicker
                      label="Couleur section"
                      value={formData.cta.color}
                      onChange={(value) =>
                        handleSimpleSectionChange("cta", "color", value)
                      }
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
                    bgcolor: safeAlpha(SECTIONS_CONFIG[4].color, 0.1),
                    color: SECTIONS_CONFIG[4].color,
                    fontWeight: 600,
                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                    "& .MuiChip-icon": { color: SECTIONS_CONFIG[4].color },
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
                          boxShadow: `0 4px 20px ${safeAlpha(
                            safeBgColor,
                            0.15
                          )}`,
                        },
                      }}
                    >
                      <Grid
                        container
                        spacing={{ xs: 1.5, sm: 2 }}
                        alignItems="center"
                      >
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
                                onClick={() => handleRemoveCtaButton(index)}
                                sx={{ color: "#ef4444" }}
                              >
                                <DeleteOutlineIcon
                                  sx={{ fontSize: { xs: 18, sm: 20 } }}
                                />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <StyledTextField
                            fullWidth
                            label="Texte du bouton"
                            value={btn.label}
                            onChange={(e: any) =>
                              handleCtaButtonChange(
                                index,
                                "label",
                                e.target.value
                              )
                            }
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <StyledTextField
                            fullWidth
                            label="URL / Lien"
                            value={btn.href}
                            onChange={(e: any) =>
                              handleCtaButtonChange(
                                index,
                                "href",
                                e.target.value
                              )
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
                              handleCtaButtonChange(index, "bgColor", value)
                            }
                          />
                        </Grid>
                        <Grid item xs={6} sm={6} md={3}>
                          <ColorPicker
                            label="Couleur texte"
                            value={btn.textColor}
                            onChange={(value) =>
                              handleCtaButtonChange(index, "textColor", value)
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
                              sx={{
                                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              }}
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
                  onClick={handleAddCtaButton}
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
                    color: SECTIONS_CONFIG[4].color,
                    borderColor: SECTIONS_CONFIG[4].color,
                    "&:hover": {
                      borderColor: SECTIONS_CONFIG[4].color,
                      bgcolor: safeAlpha(SECTIONS_CONFIG[4].color, 0.05),
                    },
                  }}
                >
                  Ajouter un bouton
                </Button>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </DialogContent>

        {/* --- FOOTER --- */}
        <DialogActions
          sx={{
            p: { xs: 1.5, sm: 2.5 },
            bgcolor: "#fff",
            borderTop: "1px solid #e2e8f0",
            gap: { xs: 1, sm: 1.5 },
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Button
            onClick={handleClose}
            variant="outlined"
            fullWidth={isSmall}
            size={isSmall ? "small" : "medium"}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: { xs: 2, sm: 3 },
              order: { xs: 2, sm: 1 },
              borderColor: "#e2e8f0",
              color: "#64748b",
              "&:hover": { bgcolor: "#f8fafc", borderColor: "#cbd5e1" },
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            fullWidth={isSmall}
            size={isSmall ? "small" : "medium"}
            disabled={saving || !hasChanges}
            startIcon={
              saving ? (
                <CircularProgress size={16} sx={{ color: "white" }} />
              ) : (
                <CheckCircleIcon />
              )
            }
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: { xs: 2, sm: 4 },
              order: { xs: 1, sm: 2 },
              background: hasChanges
                ? "linear-gradient(135deg, #818660 0%, rgb(168, 171, 149) 50%, #989e7a 100%)"
                : "#9ca3af",
              boxShadow: hasChanges
                ? "0 4px 14px rgba(99, 102, 241, 0.4)"
                : "none",
              "&:hover": {
                boxShadow: hasChanges
                  ? "0 6px 20px rgba(99, 102, 241, 0.5)"
                  : "none",
              },
              "&:disabled": {
                background: "#d1d5db",
                color: "#9ca3af",
              },
            }}
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- TOAST --- */}
      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast(null)}
          severity={toast?.type || "info"}
          variant="filled"
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          {toast?.msg}
        </Alert>
      </Snackbar>
    </>
  );
};

// =============================================================================
// COMPOSANT DEMO
// =============================================================================
const ShowEditAbout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: { xs: "center", sm: "flex-end" },
      }}
    >
      <Button
        variant="contained"
        size={isMobile ? "small" : "medium"}
        startIcon={<EditNoteIcon />}
        onClick={() => setOpen(true)}
        sx={{
          background: "linear-gradient(135deg, #616637 0%, #8C915D 100%)",
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 2,
        }}
      >
        {isMobile ? "Éditer" : "Éditer About"}
      </Button>

      <EditAboutModal open={open} onClose={() => setOpen(false)} />
    </Box>
  );
};

export default ShowEditAbout;