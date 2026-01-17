import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  Slide,
  Avatar,
  Paper,
  LinearProgress,
  Skeleton,
  useTheme,
  alpha,
  Grid,
  Stack,
} from "@mui/material";
import {
  Inventory2,
  Close,
  CheckCircle,
  Schedule,
  Build,
  Numbers,
  Description,
  Category,
  LocalOffer,
  ImageOutlined,
  Warning,
  QrCode2,
  TrendingUp,
  Edit,
  Clear,
} from "@mui/icons-material";
import { TransitionProps } from "@mui/material/transitions";
import { Materiel } from "@/context/DataContext";
import { useConnection } from "@/context/ConnectionContext";

/* =======================
   TRANSITION
======================= */
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/* =======================
   UTILITAIRES GOOGLE DRIVE
======================= */
// const extractDriveId = (url: string | null): string | null => {
//   if (!url) return null;
//   const match = url.match(/id=([a-zA-Z0-9_-]+)/);
//   return match ? match[1] : null;
// };

// const getDriveThumbnail = (url: string | null): string => {
//   const id = extractDriveId(url);
//   return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w400` : "";
// };

/* =======================
   PROPS
======================= */
interface MaterielViewModalProps {
  open: boolean;
  materiel: Materiel | null;
  onClose: () => void;
  setEdit: () => void;
}

/* =======================
   COMPOSANT PRINCIPAL
======================= */
const MaterielViewModal: React.FC<MaterielViewModalProps> = ({
  open,
  materiel,
  onClose,
  setEdit,
}) => {
  const theme = useTheme();
  const { isPoor } = useConnection();
  const isDark = theme.palette.mode === "dark";

  /* =======================
     CONFIGURATION DES STATUTS
  ======================= */
  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { color: string; bgColor: string; icon: React.ReactNode; label: string }
    > = {
      disponible: {
        color: theme.palette.success.main,
        bgColor: alpha(theme.palette.success.main, 0.12),
        icon: <CheckCircle sx={{ fontSize: 18 }} />,
        label: "Disponible",
      },
      "en utilisation": {
        color: theme.palette.warning.main,
        bgColor: alpha(theme.palette.warning.main, 0.12),
        icon: <Schedule sx={{ fontSize: 18 }} />,
        label: "En utilisation",
      },
      maintenance: {
        color: theme.palette.error.main,
        bgColor: alpha(theme.palette.error.main, 0.12),
        icon: <Build sx={{ fontSize: 18 }} />,
        label: "Maintenance",
      },
      "hors service": {
        color: theme.palette.error.dark,
        bgColor: alpha(theme.palette.error.main, 0.12),
        icon: <Warning sx={{ fontSize: 18 }} />,
        label: "Hors service",
      },
    };

    return (
      configs[status?.toLowerCase()] || {
        color: theme.palette.info.main,
        bgColor: alpha(theme.palette.info.main, 0.12),
        icon: <Category sx={{ fontSize: 18 }} />,
        label: status || "Non défini",
      }
    );
  };

  const [openImage, setOpenImage] = useState(false);

if (!materiel) return null;

const imageUrl = materiel.imageUrl;
const statusConfig = getStatusConfig(materiel.statut);


  /* =======================
     IMAGE THUMBNAIL COMPONENT
  ======================= */
  const ImageThumbnail: React.FC = () => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const hasImage = imageUrl && imageUrl.length > 0;

    return (
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: 3,
          overflow: "hidden",
          flexShrink: 0,
          border: `2px solid ${alpha(theme.palette.divider, 0.3)}`,
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          position: "relative",
          cursor: hasImage ? "pointer" : "default",
        }}
        onClick={() => hasImage && setOpenImage(true)}
      >
        {hasImage && !error && (
          <>
            {!loaded && (
              <Skeleton
                variant="rectangular"
                sx={{ width: "100%", height: "100%", position: "absolute" }}
              />
            )}
            <Box
              component="img"
              src={imageUrl}
              alt={materiel.nom}
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: loaded ? "block" : "none",
              }}
            />
          </>
        )}
        {(!hasImage || error) && (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ImageOutlined
              sx={{ fontSize: 32, color: theme.palette.text.disabled }}
            />
          </Box>
        )}
      </Box>
    );
  };

  /* =======================
     INFO ITEM COMPONENT
  ======================= */
  const InfoItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    color?: string;
  }> = ({ icon, label, value, color }) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.background.default, 0.5),
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderColor: alpha(theme.palette.primary.main, 0.15),
        },
      }}
    >
      <Avatar
        sx={{
          width: 36,
          height: 36,
          bgcolor: color
            ? alpha(color, 0.15)
            : alpha(theme.palette.primary.main, 0.1),
          color: color || theme.palette.primary.main,
        }}
      >
        {icon}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", fontWeight: 500, letterSpacing: 0.3 }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          fontWeight={600}
          color="text.primary"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );

  /* =======================
     QUANTITY SECTION
  ======================= */
  const QuantitySection: React.FC = () => {
    const quantity = Number(materiel.quantites) || 0;
    const maxStock = 100;
    const percentage = Math.min((quantity / maxStock) * 100, 100);

    const getColor = () => {
      if (percentage > 50) return theme.palette.success.main;
      if (percentage > 20) return theme.palette.warning.main;
      return theme.palette.error.main;
    };

    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: alpha(getColor(), 0.08),
          border: `1px solid ${alpha(getColor(), 0.2)}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TrendingUp sx={{ fontSize: 20, color: getColor() }} />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Stock
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: getColor() }}>
            {quantity}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: alpha(getColor(), 0.15),
            "& .MuiLinearProgress-bar": {
              borderRadius: 3,
              bgcolor: getColor(),
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{ color: getColor(), mt: 0.5, display: "block" }}
        >
          {percentage > 50
            ? "Niveau optimal"
            : percentage > 20
            ? "Stock limité"
            : "Stock critique"}
        </Typography>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 20px 60px ${alpha(
            theme.palette.common.black,
            isDark ? 0.5 : 0.15
          )}`,
          bgcolor: theme.palette.background.paper,
        },
      }}
      BackdropProps={{
        sx: {
          bgcolor: alpha(theme.palette.common.black, isDark ? 0.7 : 0.5),
          backdropFilter: "blur(8px)",
        },
      }}
    >
      {/* ===== HEADER COMPACT ===== */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          background:
            "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 250,
            height: 250,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.1)",
            top: -100,
            right: "auto",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 150,
            height: 150,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.08)",
            bottom: -30,
            left: "60%",
          }}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          {/* Image Thumbnail */}
          <ImageThumbnail />

          {/* Title & Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              color="text.primary"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                mb: 0.5,
              }}
            >
              {materiel.nom}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip
                size="small"
                icon={<QrCode2 sx={{ fontSize: 14 }} />}
                label={
                  materiel.reference + " " + materiel.referenceNum || "N/A"
                }
                variant="outlined"
                sx={{
                  height: 24,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  borderColor: alpha(theme.palette.divider, 0.5),
                }}
              />
            </Stack>

            {/* Status Badge */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                bgcolor: statusConfig.bgColor,
                color: statusConfig.color,
              }}
            >
              {statusConfig.icon}
              <Typography variant="caption" fontWeight={700}>
                {statusConfig.label}
              </Typography>
            </Box>
          </Box>

          {/* Close Button */}
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.action.active, 0.08),
              "&:hover": {
                bgcolor: alpha(theme.palette.error.main, 0.1),
                color: theme.palette.error.main,
              },
              transition: "all 0.2s ease",
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* ===== CONTENT ===== */}
      <DialogContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          {/* Quantity Section */}
          <QuantitySection />

          {/* Info Grid */}
          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <InfoItem
                icon={<Numbers sx={{ fontSize: 18 }} />}
                label="Quantité"
                value={`${materiel.quantites} unités`}
                color={theme.palette.info.main}
              />
            </Grid>
            <Grid item xs={6}>
              <InfoItem
                icon={<Category sx={{ fontSize: 18 }} />}
                label="Catégorie"
                value={materiel.comentaire || "Non définie"}
                color={theme.palette.secondary.main}
              />
            </Grid>
          </Grid>

          {/* Description */}
          {materiel.description && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: alpha(theme.palette.background.default, 0.6),
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Description
                  sx={{ fontSize: 18, color: theme.palette.text.secondary }}
                />
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                  letterSpacing={0.5}
                >
                  DESCRIPTION
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.primary"
                sx={{ lineHeight: 1.6, pl: 3.5 }}
              >
                {materiel.description}
              </Typography>
            </Paper>
          )}
        </Stack>
      </DialogContent>

      {/* ===== FOOTER ===== */}
      <DialogActions
        sx={{
          p: { xs: 2.5, sm: 3 }, // Padding responsive
          pt: 2, // Moins d'espace en haut
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.background.paper, 0.95), // Fond légèrement opaque
          display: "flex",
          flexDirection: { xs: "column-reverse", sm: "row" }, // Mobile : boutons empilés (Edit en haut)
          gap: 2, // Espace entre les boutons
          alignItems: "center",
          justifyContent: "flex-end", // Alignés à droite sur desktop
          boxShadow: "0 -2px 10px rgba(0,0,0,0.05)", // Ombre subtile en haut
        }}
      >
        {/* Bouton ANNULER (Secondaire) */}
        <Grid container item xs={12} justifyContent={"space-between"}>
          <Grid container item xs={5}>
            {" "}
            <Button
              onClick={onClose}
              variant="outlined"
              color="inherit"
              endIcon={<Clear />}
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: 2, // Coins arrondis
                fontWeight: 600,
                fontSize: "0.95rem",
                textTransform: "none", // Pas de majuscules
                borderColor: theme.palette.grey[300],
                color: theme.palette.text.secondary,
                "&:hover": {
                  bgcolor: theme.palette.action.hover,
                  borderColor: theme.palette.grey[400],
                  transform: "translateY(-1px)",
                },
                "&:active": {
                  transform: "translateY(0)",
                  boxShadow: "none",
                },
                transition: "all 0.2s ease",
                flex: { xs: 1, sm: "auto" }, // Pleine largeur sur mobile
              }}
            >
              Fermer
            </Button>
          </Grid>
          <Grid container item xs={5}>
            <Button
              onClick={setEdit}
              variant="contained"
              color="primary"
              disableElevation
              endIcon={<Edit />}
              sx={{
                py: 1.5,
                px: 5,
                borderRadius: 2,
                fontWeight: 700, // Texte plus épais
                fontSize: "1rem",
                textTransform: "none",
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,

                // Hover
                "&:hover": {
                  bgcolor: theme.palette.primary.dark,
                  transform: "translateY(-2px)",
                  boxShadow: `0 8px 20px ${alpha(
                    theme.palette.primary.main,
                    0.35
                  )}`,
                },

                // Active (clic)
                "&:active": {
                  transform: "translateY(0)",
                  boxShadow: `0 2px 8px ${alpha(
                    theme.palette.primary.main,
                    0.25
                  )}`,
                },

                // Focus
                "&:focus-visible": {
                  outline: `2px solid ${alpha(
                    theme.palette.primary.main,
                    0.5
                  )}`,
                  outlineOffset: 2,
                },

                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", // Animation plus fluide
                flex: { xs: 1, sm: "auto" }, // Pleine largeur sur mobile
              }}
            >
              Edit
            </Button>
          </Grid>
        </Grid>

        {/* Bouton EDIT (Principal) */}
      </DialogActions>
      {/* ===== IMAGE VIEWER FULLSCREEN ===== */}
      <Dialog
        open={openImage}
        onClose={() => setOpenImage(false)}
        maxWidth="md"
        fullWidth
        // sx={{border:"red solid 2px"}}
        BackdropProps={{
          sx: {
            bgcolor: "primary",
            backdropFilter: "blur(4px)",
          },
        }}
        PaperProps={{
          sx: {
            bgcolor: "transparent",
            boxShadow: "none",
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          {/* Close button */}
          <IconButton
            onClick={() => setOpenImage(false)}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              bgcolor: alpha("#000", 0.6),
              color: "#fff",
              "&:hover": {
                bgcolor: alpha("#000", 0.8),
              },
            }}
          >
            <Close />
          </IconButton>

          {/* Image */}
          <Box
            // component="img"
            // src={imageUrl}
            // alt={materiel.nom}
            sx={{
              // maxWidth: "10%",
              // maxHeight: "80vh",
              borderRadius: 3,
              objectFit: "contain",
              boxShadow: `0 20px 60px ${alpha("#000", 0.6)}`,
            }}
          />
          <img src={imageUrl} alt="" style={{ width: "70%" }} />
          <Typography
            bgcolor={"#00000038"}
            p={2}
            borderRadius={2}
            variant="h3"
            position={"absolute"}
            top={35}
            left={"5vw"}
          >
            {materiel.nom}
          </Typography>
        </Box>
      </Dialog>
    </Dialog>
  );
};

export default MaterielViewModal;
