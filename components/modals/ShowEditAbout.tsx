
"use client"
import React, { useState } from "react";
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
  MenuItem,
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
} from "@mui/material";

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

// --- Interfaces ---
interface CardItem {
  title: string;
  description: string;
}

interface CtaButton {
  label: string;
  href: string;
  color: "primary" | "secondary" | "outline";
}

interface PageContent {
  history: { subTitle: string; title: string; description: string };
  cards: CardItem[];
  values: { subTitle: string; title: string; items: CardItem[] };
  approach: { subTitle: string; title: string; description: string };
  cta: { title: string; subTitle: string; buttons: CtaButton[] };
}

interface EditAboutModalProps {
  open: boolean;
  onClose: () => void;
}

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

const CTA_COLOR_OPTIONS = [
  { value: "primary", label: "Primaire", color: "#6366f1" },
  { value: "outline", label: "Contour", color: "#64748b" },
  { value: "secondary", label: "Secondaire", color: "#ec4899" },
];

const EditAboutModal: React.FC<EditAboutModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [expanded, setExpanded] = useState<string | false>("panel1");

  const handleChangePanel =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const [formData, setFormData] = useState<PageContent>({
    history: {
      subTitle: "NOTRE HISTOIRE",
      title: "Tolo-Tady Communication",
      description:
        "Tolo-Tady Communication est une agence de communication malgache...",
    },
    cards: [
      {
        title: "Notre Vision",
        description: "Devenir l'agence de référence...",
      },
      {
        title: "Notre Mission",
        description: "Accompagner les acteurs du changement...",
      },
    ],
    values: {
      subTitle: "CE QUI NOUS GUIDE",
      title: "Nos valeurs",
      items: [
        {
          title: "Engagement",
          description: "Nous croyons en une communication qui a du sens.",
        },
        {
          title: "Proximité",
          description: "Nous travaillons main dans la main.",
        },
      ],
    },
    approach: {
      subTitle: "NOTRE DIFFÉRENCE",
      title: "Une approche humaine",
      description:
        "Chez Tolo-Tady, nous croyons que la meilleure communication...",
    },
    cta: {
      title: "Envie de travailler avec nous ?",
      subTitle: "Découvrez nos services ou contactez-nous.",
      buttons: [
        { label: "Nos services", href: "/services", color: "primary" },
        { label: "Nous contacter", href: "/contact", color: "outline" },
      ],
    },
  });

  // --- Gestionnaires ---
  const handleSimpleSectionChange = (
    section: keyof PageContent,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData({
      ...formData,
      [section]: {
        ...(formData[section] as object),
        [e.target.name]: e.target.value,
      },
    });
  };

  const handleArrayItemChange = (
    section: "cards" | "values",
    index: number,
    field: "title" | "description",
    value: string,
  ) => {
    if (section === "cards") {
      const newCards = [...formData.cards];
      newCards[index] = { ...newCards[index], [field]: value };
      setFormData({ ...formData, cards: newCards });
    } else {
      const newItems = [...formData.values.items];
      newItems[index] = { ...newItems[index], [field]: value };
      setFormData({
        ...formData,
        values: { ...formData.values, items: newItems },
      });
    }
  };

  const handleAddItem = (section: "cards" | "values") => {
    const newItem = { title: "", description: "" };
    if (section === "cards")
      setFormData({ ...formData, cards: [...formData.cards, newItem] });
    else
      setFormData({
        ...formData,
        values: {
          ...formData.values,
          items: [...formData.values.items, newItem],
        },
      });
  };

  const handleRemoveItem = (section: "cards" | "values", index: number) => {
    if (section === "cards")
      setFormData({
        ...formData,
        cards: formData.cards.filter((_, i) => i !== index),
      });
    else
      setFormData({
        ...formData,
        values: {
          ...formData.values,
          items: formData.values.items.filter((_, i) => i !== index),
        },
      });
  };

  const handleValuesHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      values: { ...formData.values, [e.target.name]: e.target.value },
    });
  };

  const handleCtaButtonChange = (
    index: number,
    field: keyof CtaButton,
    value: string,
  ) => {
    const newButtons = [...formData.cta.buttons];
    (newButtons[index] as any)[field] = value;
    setFormData({ ...formData, cta: { ...formData.cta, buttons: newButtons } });
  };

  const handleAddCtaButton = () => {
    setFormData({
      ...formData,
      cta: {
        ...formData.cta,
        buttons: [
          ...formData.cta.buttons,
          { label: "Action", href: "#", color: "primary" },
        ],
      },
    });
  };

  const handleRemoveCtaButton = (index: number) => {
    setFormData({
      ...formData,
      cta: {
        ...formData.cta,
        buttons: formData.cta.buttons.filter((_, i) => i !== index),
      },
    });
  };

  const handleSubmit = () => {
    console.log("=== SAUVEGARDE ===", formData);
    onClose();
  };

  // --- Styled TextField ---
  const StyledTextField = (props: any) => (
    <TextField
      {...props}
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

  // --- Accordion Header Component ---
  const AccordionHeader = ({
    config,
    isExpanded,
  }: {
    config: (typeof SECTIONS_CONFIG)[0];
    isExpanded: boolean;
  }) => (
    <Box sx={{ display: "flex", alignItems: "center", width: "100%", py: 0.5 }}>
      <Avatar
        sx={{
          width: 42,
          height: 42,
          mr: 2,
          background: isExpanded ? config.gradient : alpha(config.color, 0.1),
          color: isExpanded ? "#fff" : config.color,
          transition: "all 0.3s ease",
          boxShadow: isExpanded
            ? `0 4px 14px ${alpha(config.color, 0.4)}`
            : "none",
        }}
      >
        {config.icon}
      </Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{
            color: isExpanded ? config.color : "text.primary",
            transition: "color 0.3s ease",
          }}
        >
          {config.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {config.sub}
        </Typography>
      </Box>
      {isExpanded && (
        <Chip
          label="En cours"
          size="small"
          sx={{
            bgcolor: alpha(config.color, 0.1),
            color: config.color,
            fontWeight: 600,
            mr: 1,
          }}
        />
      )}
    </Box>
  );

  // --- Item Card Component ---
  const ItemCard = ({ children, onDelete, color, index }: any) => (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(color, 0.2),
        bgcolor: alpha(color, 0.02),
        position: "relative",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: color,
          boxShadow: `0 4px 20px ${alpha(color, 0.15)}`,
          transform: "translateY(-2px)",
          "& .delete-btn": { opacity: 1 },
        },
      }}
    >
      <Badge
        badgeContent={index + 1}
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          "& .MuiBadge-badge": {
            bgcolor: color,
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.7rem",
          },
        }}
      />
      <IconButton
        className="delete-btn"
        size="small"
        onClick={onDelete}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          opacity: 0.4,
          transition: "all 0.2s",
          color: "#ef4444",
          "&:hover": { bgcolor: alpha("#ef4444", 0.1) },
        }}
      >
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
      <Box sx={{ pt: 3 }}>{children}</Box>
    </Paper>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          py: 3,
          px: 3,
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
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: -80,
            left: -40,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                width: 50,
                height: 50,
                bgcolor: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              <EditNoteIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                Éditer "À Propos"
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Personnalisez le contenu de votre page
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.15)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
            }}
          >
            <CloseIcon />
          </IconButton>
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
              bgcolor: alpha(SECTIONS_CONFIG[0].color, 0.02),
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
                }}
              />
            }
            sx={{ px: 3, py: 1 }}
          >
            <AccordionHeader
              config={SECTIONS_CONFIG[0]}
              isExpanded={expanded === "panel1"}
            />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 4 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={4}>
                <StyledTextField
                  fullWidth
                  size="small"
                  label="Sur-titre"
                  name="subTitle"
                  value={formData.history.subTitle}
                  onChange={(e: any) => handleSimpleSectionChange("history", e)}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <StyledTextField
                  fullWidth
                  size="small"
                  label="Titre Principal"
                  name="title"
                  value={formData.history.title}
                  onChange={(e: any) => handleSimpleSectionChange("history", e)}
                />
              </Grid>
              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  name="description"
                  value={formData.history.description}
                  onChange={(e: any) => handleSimpleSectionChange("history", e)}
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
              bgcolor: alpha(SECTIONS_CONFIG[1].color, 0.02),
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
                }}
              />
            }
            sx={{ px: 3, py: 1 }}
          >
            <AccordionHeader
              config={SECTIONS_CONFIG[1]}
              isExpanded={expanded === "panel2"}
            />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
              <Button
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => handleAddItem("cards")}
                variant="contained"
                size="small"
                sx={{
                  background: SECTIONS_CONFIG[1].gradient,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: `0 4px 14px ${alpha(SECTIONS_CONFIG[1].color, 0.4)}`,
                }}
              >
                Ajouter une carte
              </Button>
            </Box>
            <Grid container spacing={2.5}>
              {formData.cards.map((card, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <ItemCard
                    onDelete={() => handleRemoveItem("cards", index)}
                    color={SECTIONS_CONFIG[1].color}
                    index={index}
                  >
                    <Stack spacing={2}>
                      <StyledTextField
                        fullWidth
                        size="small"
                        label="Titre"
                        value={card.title}
                        onChange={(e: any) =>
                          handleArrayItemChange(
                            "cards",
                            index,
                            "title",
                            e.target.value,
                          )
                        }
                      />
                      <StyledTextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        value={card.description}
                        onChange={(e: any) =>
                          handleArrayItemChange(
                            "cards",
                            index,
                            "description",
                            e.target.value,
                          )
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
              bgcolor: alpha(SECTIONS_CONFIG[2].color, 0.02),
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
                }}
              />
            }
            sx={{ px: 3, py: 1 }}
          >
            <AccordionHeader
              config={SECTIONS_CONFIG[2]}
              isExpanded={expanded === "panel3"}
            />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(SECTIONS_CONFIG[2].color, 0.05)} 0%, ${alpha(SECTIONS_CONFIG[2].color, 0.02)} 100%)`,
                border: `1px solid ${alpha(SECTIONS_CONFIG[2].color, 0.15)}`,
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    size="small"
                    label="Sur-titre"
                    name="subTitle"
                    value={formData.values.subTitle}
                    onChange={handleValuesHeaderChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    size="small"
                    label="Titre de section"
                    name="title"
                    value={formData.values.title}
                    onChange={handleValuesHeaderChange}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Divider sx={{ mb: 3 }}>
              <Chip
                icon={<DiamondIcon sx={{ fontSize: 16 }} />}
                label="Liste des valeurs"
                size="small"
                sx={{
                  bgcolor: alpha(SECTIONS_CONFIG[2].color, 0.1),
                  color: SECTIONS_CONFIG[2].color,
                  fontWeight: 600,
                  "& .MuiChip-icon": { color: SECTIONS_CONFIG[2].color },
                }}
              />
            </Divider>

            <Grid container spacing={2.5}>
              {formData.values.items.map((item, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <ItemCard
                    onDelete={() => handleRemoveItem("values", index)}
                    color={SECTIONS_CONFIG[2].color}
                    index={index}
                  >
                    <Stack spacing={2}>
                      <StyledTextField
                        fullWidth
                        size="small"
                        label="Nom de la valeur"
                        value={item.title}
                        onChange={(e: any) =>
                          handleArrayItemChange(
                            "values",
                            index,
                            "title",
                            e.target.value,
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
                          handleArrayItemChange(
                            "values",
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                      />
                    </Stack>
                  </ItemCard>
                </Grid>
              ))}
              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={0}
                  onClick={() => handleAddItem("values")}
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    border: "2px dashed",
                    borderColor: alpha(SECTIONS_CONFIG[2].color, 0.3),
                    bgcolor: alpha(SECTIONS_CONFIG[2].color, 0.02),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: SECTIONS_CONFIG[2].color,
                      bgcolor: alpha(SECTIONS_CONFIG[2].color, 0.05),
                      transform: "scale(1.02)",
                    },
                  }}
                >
                  <Stack alignItems="center" spacing={1}>
                    <AddCircleOutlineIcon
                      sx={{
                        fontSize: 40,
                        color: SECTIONS_CONFIG[2].color,
                        opacity: 0.7,
                      }}
                    />
                    <Typography
                      color={SECTIONS_CONFIG[2].color}
                      fontWeight={600}
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
              bgcolor: alpha(SECTIONS_CONFIG[3].color, 0.02),
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
                }}
              />
            }
            sx={{ px: 3, py: 1 }}
          >
            <AccordionHeader
              config={SECTIONS_CONFIG[3]}
              isExpanded={expanded === "panel4"}
            />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 4 }}>
            <Stack spacing={2.5}>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={4}>
                  <StyledTextField
                    fullWidth
                    size="small"
                    label="Sur-titre"
                    name="subTitle"
                    value={formData.approach.subTitle}
                    onChange={(e: any) =>
                      handleSimpleSectionChange("approach", e)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={8}>
                  <StyledTextField
                    fullWidth
                    size="small"
                    label="Titre Principal"
                    name="title"
                    value={formData.approach.title}
                    onChange={(e: any) =>
                      handleSimpleSectionChange("approach", e)
                    }
                  />
                </Grid>
              </Grid>
              <StyledTextField
                fullWidth
                multiline
                rows={5}
                label="Description détaillée"
                name="description"
                value={formData.approach.description}
                onChange={(e: any) => handleSimpleSectionChange("approach", e)}
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
              bgcolor: alpha(SECTIONS_CONFIG[4].color, 0.02),
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
                }}
              />
            }
            sx={{ px: 3, py: 1 }}
          >
            <AccordionHeader
              config={SECTIONS_CONFIG[4]}
              isExpanded={expanded === "panel5"}
            />
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(SECTIONS_CONFIG[4].color, 0.05)} 0%, ${alpha(SECTIONS_CONFIG[4].color, 0.02)} 100%)`,
                border: `1px solid ${alpha(SECTIONS_CONFIG[4].color, 0.15)}`,
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    size="small"
                    label="Titre d'appel"
                    name="title"
                    value={formData.cta.title}
                    onChange={(e: any) => handleSimpleSectionChange("cta", e)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    size="small"
                    label="Sous-titre"
                    name="subTitle"
                    value={formData.cta.subTitle}
                    onChange={(e: any) => handleSimpleSectionChange("cta", e)}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Divider sx={{ mb: 3 }}>
              <Chip
                icon={<TouchAppIcon sx={{ fontSize: 16 }} />}
                label="Boutons d'action"
                size="small"
                sx={{
                  bgcolor: alpha(SECTIONS_CONFIG[4].color, 0.1),
                  color: SECTIONS_CONFIG[4].color,
                  fontWeight: 600,
                  "& .MuiChip-icon": { color: SECTIONS_CONFIG[4].color },
                }}
              />
            </Divider>

            <Stack spacing={2.5}>
              {formData.cta.buttons.map((btn, index) => {
                const btnColor =
                  CTA_COLOR_OPTIONS.find((o) => o.value === btn.color)?.color ||
                  "#6366f1";
                return (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: alpha(btnColor, 0.3),
                      borderLeft: `5px solid ${btnColor}`,
                      bgcolor: alpha(btnColor, 0.02),
                      transition: "all 0.2s ease",
                      "&:hover": {
                        boxShadow: `0 4px 20px ${alpha(btnColor, 0.15)}`,
                      },
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                          }}
                        >
                          <Chip
                            label={`Bouton ${index + 1}`}
                            size="small"
                            sx={{
                              bgcolor: btnColor,
                              color: "#fff",
                              fontWeight: 700,
                            }}
                          />
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveCtaButton(index)}
                              sx={{ color: "#ef4444" }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <StyledTextField
                          fullWidth
                          size="small"
                          label="Texte du bouton"
                          value={btn.label}
                          onChange={(e: any) =>
                            handleCtaButtonChange(
                              index,
                              "label",
                              e.target.value,
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <StyledTextField
                          select
                          fullWidth
                          size="small"
                          label="Style"
                          value={btn.color}
                          onChange={(e: any) =>
                            handleCtaButtonChange(
                              index,
                              "color",
                              e.target.value,
                            )
                          }
                        >
                          {CTA_COLOR_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    bgcolor: opt.color,
                                  }}
                                />
                                {opt.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </StyledTextField>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <StyledTextField
                          fullWidth
                          size="small"
                          label="URL / Lien"
                          value={btn.href}
                          onChange={(e: any) =>
                            handleCtaButtonChange(index, "href", e.target.value)
                          }
                          InputProps={{
                            startAdornment: (
                              <LinkIcon
                                fontSize="small"
                                sx={{ mr: 1, opacity: 0.4 }}
                              />
                            ),
                          }}
                        />
                      </Grid>
                      {/* Aperçu */}
                      <Grid item xs={12}>
                        <Box
                          sx={{
                            pt: 1,
                            borderTop: "1px dashed",
                            borderColor: "divider",
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mr: 2 }}
                          >
                            Aperçu :
                          </Typography>
                          <Button
                            variant={
                              btn.color === "outline" ? "outlined" : "contained"
                            }
                            size="small"
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontWeight: 600,
                              ...(btn.color !== "outline" && {
                                bgcolor: btnColor,
                              }),
                              ...(btn.color === "outline" && {
                                borderColor: btnColor,
                                color: btnColor,
                              }),
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
                sx={{
                  borderStyle: "dashed",
                  borderWidth: 2,
                  borderRadius: 3,
                  py: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  color: SECTIONS_CONFIG[4].color,
                  borderColor: SECTIONS_CONFIG[4].color,
                  "&:hover": {
                    borderColor: SECTIONS_CONFIG[4].color,
                    bgcolor: alpha(SECTIONS_CONFIG[4].color, 0.05),
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
          p: 2.5,
          bgcolor: "#fff",
          borderTop: "1px solid #e2e8f0",
          gap: 1.5,
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="caption" color="text.secondary">
            💡 Toutes les modifications sont prévisualisées en temps réel
          </Typography>
        </Box>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
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
          startIcon={<CheckCircleIcon />}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 4,
            background:
              "linear-gradient(135deg, #818660 0%, rgb(168, 171, 149) 50%, #989e7a 100%)",
            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
            "&:hover": {
              boxShadow: "0 6px 20px rgba(99, 102, 241, 0.5)",
            },
          }}
        >
          Sauvegarder
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// --- Demo Component ---

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
      >
        {isMobile ? "All" : "Éditer About"}
      </Button>

      <EditAboutModal open={open} onClose={() => setOpen(false)} />
    </Box>
  );
};


export default ShowEditAbout;
