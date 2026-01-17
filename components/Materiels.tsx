"use client";
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useMediaQuery,
  useTheme,
  alpha,
  Fade,
  Grow,
  Tooltip,
  Badge,
  Avatar,
} from "@mui/material";
import {
  Add,
  Search,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Inventory2,
  FilterList,
  ViewModule,
  ViewList,
  CheckCircle,
  Schedule,
  Build,
  YoutubeSearchedFor,
  Restore,
  Landscape,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import MaterielFormModal from "../components/modals/MaterielFormModal";
import MaterielViewModal from "../components/modals/MaterielViewModal";
import ConfirmDialog from "../components/modals/ConfirmDialog";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { Materiel, useData } from "@/context/DataContext";

const Materiels: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { materiels, deleteMateriel } = useData();
  const { isAdmin } = useAuth();
  const { isPoor } = useConnectionStatus();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editMateriel, setEditMateriel] = useState<Materiel | null>(null);
  const [viewMateriel, setViewMateriel] = useState<Materiel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Materiel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{
    el: HTMLElement;
    materiel: Materiel;
  } | null>(null);
  const [searchCategorie, setSearchCategorie] = useState<string>("");
  const [searchStatut, setSearchStatut] = useState<string>("");

  const getMaterielImage = (url: string | null) => {
    if (!url) return ""; // pas d'image

    // Cloudinary (URL directe)
    if (url.includes("res.cloudinary.com")) return url;

    // Google Drive
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match)
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;

    return "";
  };
  // Récupère les catégories depuis le localStorage
  const categoriesFromStorage = JSON.parse(
    localStorage.getItem("categorie") || "[]"
  ) as string[];

  const filteredMateriels = materiels.filter((m:any) => {
    const matchesNameOrRef =
      m.nom.toLowerCase().includes(search.toLowerCase()) ||
      m.reference.toLowerCase().includes(search.toLowerCase());

    const matchesCategorie =
      searchCategorie === "" || m.comentaire === searchCategorie;

    const matchesStatut =
      searchStatut === "" ||
      m.statut?.toLowerCase() === searchStatut.toLowerCase();

    return matchesNameOrRef && matchesCategorie && matchesStatut;
  });

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    materiel: Materiel
  ) => {
    event.stopPropagation();
    setMenuAnchor({ el: event.currentTarget, materiel });
  };


  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const confirmDelete = async (id: string) => {
    await deleteMateriel(id);
  };

  // ✅ Code couleur conservé
  const getStatusColor = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case "disponible":
        return "success";
      case "en utilisation":
        return "warning";
      case "maintenance":
        return "error";
      default:
        return "default";
    }
  };

  // Couleurs personnalisées pour les icônes selon le statut
  const getStatusIconBg = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case "disponible":
        return theme.palette.success.main;
      case "en utilisation":
        return theme.palette.warning.main;
      case "maintenance":
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const stats = {
    total: materiels.length,
    disponible: materiels.filter(
      (m:any) => m.statut?.toLowerCase() === "disponible"
    ).length,
    enUtilisation: materiels.filter(
      (m:any) => m.statut?.toLowerCase() === "en utilisation"
    ).length,
    maintenance: materiels.filter(
      (m :any) => m.statut?.toLowerCase() === "maintenance"
    ).length,
  };
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.03
        )} 100%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
        p: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          borderRadius: { xs: 0, md: 4 },
          mx: { xs: -2, md: 0 },
          mt: { xs: -2, md: 0 },
          mb: 4,
          p: { xs: 3, md: 4 },
          background:
            "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Cercles décoratifs */}
        <Box
          sx={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.1)",
            top: -100,
            right: -50,
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
            left: "30%",
          }}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Inventory2 sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: "white",
                    textShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  }}
                >
                  Matériels
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.9)" }}>
                  Gérez votre inventaire de matériels
                </Typography>
              </Box>
            </Box>
          </Box>

          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowForm(true)}
              disabled={isPoor}
              sx={{
                bgcolor: "white",
                color: "primary",
                fontWeight: 600,
                px: 3,
                py: 1.2,
                borderRadius: 2.5,
                textTransform: "none",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                "&:hover": {
                  bgcolor: "#f8f8f6",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Nouveau matériel
            </Button>
          )}
        </Box>

        {/* Stats Cards */}
        <Grid
          container
          spacing={2}
          sx={{ mt: 3, position: "relative", zIndex: 1 }}
        >
          {[
            {
              label: "Total",
              value: stats.total,
              icon: <Inventory2 />,
              color: "#fff",
            },
            {
              label: "Disponibles",
              value: stats.disponible,
              icon: <CheckCircle />,
              color: "#6b8e5a",
            },
            {
              label: "En utilisation",
              value: stats.enUtilisation,
              icon: <Schedule />,
              color: "#b89c60",
            },
            {
              label: "Maintenance",
              value: stats.maintenance,
              icon: <Build />,
              color: "#a67c52",
            },
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} xl={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.2)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor:
                        index === 0 ? "rgba(255,255,255,0.2)" : stat.color,
                      boxShadow: `0 4px 12px ${stat.color}40`,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, color: "white" }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Header amélioré */}

      {/* Barre de recherche stylisée */}
      <Fade in timeout={600}>
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            borderRadius: 4, // un peu plus arrondi
            overflow: "hidden",
            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            boxShadow: `0 6px 24px ${alpha(theme.palette.primary.main, 0.08)}`,
            p: 1,
            transition: "all 0.3s ease",
            "&:hover": {
              boxShadow: `0 8px 28px ${alpha(
                theme.palette.primary.main,
                0.15
              )}`,
            },
            bgcolor: alpha(theme.palette.background.paper, 0.9),
          }}
        >
          <Grid
            container
            alignItems="center"
            justifyContent={"space-between"}
            p={1}
            gap={2}
          >
            {/* Input de recherche */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="🔍 Rechercher un matériel par nom ou référence..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 3 },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "text.secondary", ml: 1 }} />
                    </InputAdornment>
                  ),
                  sx: {
                    // borderRadius: 4,
                    bgcolor: alpha(theme.palette.background.default, 0.15),
                    "&:hover": {
                      bgcolor: alpha(theme.palette.background.default, 0.2),
                    },
                    "&.Mui-focused": {
                      bgcolor: alpha(theme.palette.background.default, 0.25),
                    },
                  },
                }}
              />
            </Grid>

            {/* Select catégorie */}
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Catégorie"
                value={searchCategorie}
                onChange={(e) => setSearchCategorie(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 3 },
                }}
              >
                <MenuItem value="">Toutes</MenuItem>
                {categoriesFromStorage.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Select statut */}
            <Grid item xs={9} md={3}>
              <TextField
                select
                fullWidth
                label="Statut"
                value={searchStatut}
                onChange={(e) => setSearchStatut(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 3 },
                }}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="Disponible">Disponible</MenuItem>
                <MenuItem value="En utilisation">En utilisation</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
              </TextField>
            </Grid>

            {/* Bouton réinitialiser */}
            <Grid item xs={2} md={1}>
              <IconButton
                sx={{
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                  boxShadow: 2,
                }}
                onClick={() => {
                  setSearch("");
                  setSearchCategorie("");
                  setSearchStatut("");
                }}
              >
                <Restore />
              </IconButton>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      {/* Table View pour Desktop */}
      {!isMobile && filteredMateriels.length > 0 && (
        <Fade in timeout={700}>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: `0 4px 30px ${alpha(
                theme.palette.primary.main,
                0.06
              )}`,
              overflow: "hidden",
            }}
          >
            <TableContainer
              sx={{
                maxHeight: 470, // hauteur du body
                overflowY: "auto",
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      background: `linear-gradient(90deg, ${alpha(
                        theme.palette.primary.main,
                        0.05
                      )} 0%, ${alpha(
                        theme.palette.secondary.main,
                        0.05
                      )} 100%)`,
                    }}
                  >
                    <TableCell
                      sx={{ fontWeight: 700, py: 2.5, fontSize: "0.9rem" }}
                    >
                      Nom
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, py: 2.5, fontSize: "0.9rem" }}
                    >
                      Référence
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, py: 2.5, fontSize: "0.9rem" }}
                    >
                      Quantité
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, py: 2.5, fontSize: "0.9rem" }}
                    >
                      Statut
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, py: 2.5, fontSize: "0.9rem" }}
                    >
                      {isAdmin ? "Actions" : "Description"}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMateriels.map((materiel, index) => (
                    <Grow in timeout={300 + index * 50} key={materiel.id}>
                      <TableRow
                        hover
                        sx={{
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                            transform: "scale(1.001)",
                          },
                          "&:last-child td": { border: 0 },
                        }}
                        onClick={() => setViewMateriel(materiel)}
                      >
                        <TableCell sx={{ py: 2.5 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                width: 44,
                                minWidth: 44,
                                minHeight: 44,
                                height: 44,
                                borderRadius: 2.5,
                                background: `linear-gradient(135deg, ${getStatusIconBg(
                                  materiel.statut
                                )} 0%, ${alpha(
                                  getStatusIconBg(materiel.statut),
                                  0.7
                                )} 100%)`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                              }}
                            >
                              {isPoor ||
                              !navigator.onLine ||
                              !materiel.imageUrl ? (
                                <Landscape fontSize="small" />
                              ) : (
                                <Box
                                  component="img"
                                  src={getMaterielImage(materiel.imageUrl)}
                                  alt={materiel.nom}
                                  sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "50%",
                                  }}
                                />
                              )}
                            </Box>
                            <Typography fontWeight={600} fontSize="0.95rem">
                              {materiel.nom}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              materiel.reference +
                                " " +
                                (materiel.referenceNum || "") || "N/A"
                            }
                            size="small"
                            variant="outlined"
                            sx={{
                              borderRadius: 2,
                              fontWeight: 500,
                              borderColor: alpha(
                                theme.palette.primary.main,
                                0.3
                              ),
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 36,
                              height: 36,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              color: theme.palette.info.dark,
                              fontWeight: 700,
                            }}
                          >
                            {materiel.quantites}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={materiel.statut || "Disponible"}
                            size="small"
                            color={getStatusColor(materiel.statut) as any}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 600,
                              px: 1,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {isAdmin ? (
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, materiel)}
                              sx={{
                                bgcolor: "action.hover",
                                "&:hover": {
                                  bgcolor: "action.selected",
                                },
                              }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          ) : (
                            <Typography
                              fontWeight={500}
                              color="text.secondary"
                              fontSize="0.875rem"
                              sx={{
                                maxWidth: 200,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {materiel.description}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    </Grow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TableContainer>
        </Fade>
      )}

      {/* Card View pour Mobile */}
      {isMobile && (
        <Grid
          container
          spacing={2}
          sx={{
            maxHeight: 470, // hauteur du body
            overflowY: "auto",
          }}
        >
          {filteredMateriels.map((materiel, index) => (
            <Grid item xs={12} key={materiel.id}>
              <Grow in timeout={300 + index * 100}>
                <Card
                  elevation={0}
                  sx={{
                    cursor: "pointer",
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: `0 4px 20px ${alpha(
                      theme.palette.primary.main,
                      0.06
                    )}`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 8px 30px ${alpha(
                        theme.palette.primary.main,
                        0.12
                      )}`,
                    },
                    "&:active": {
                      transform: "scale(0.98)",
                    },
                    overflow: "hidden",
                    position: "relative",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      bgcolor: getStatusIconBg(materiel.statut),
                    },
                  }}
                  onClick={() => setViewMateriel(materiel)}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Box
                          sx={{
                            width: 44,
                            minWidth: 44,
                            minHeight: 44,
                            height: 44,
                            borderRadius: 2.5,
                            background: `linear-gradient(135deg, ${getStatusIconBg(
                              materiel.statut
                            )} 0%, ${alpha(
                              getStatusIconBg(materiel.statut),
                              0.7
                            )} 100%)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                          }}
                        >
                          {isPoor || !navigator.onLine || !materiel.imageUrl ? (
                            <Landscape fontSize="small" />
                          ) : (
                            <Box
                              component="img"
                              src={getMaterielImage(materiel.imageUrl)}
                              alt={materiel.nom}
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                              }}
                            />
                          )}
                        </Box>
                        <Box>
                          <Typography fontWeight={700} fontSize="1rem">
                            {materiel.nom}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mt: 0.5,
                            }}
                          >
                            <Chip
                              label={
                                materiel.reference + " " + materiel.referenceNum
                              }
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 22,
                                fontSize: "0.7rem",
                                borderRadius: 1.5,
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                color: theme.palette.info.dark,
                                fontWeight: 600,
                              }}
                            >
                              {materiel.quantites} unités
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 1,
                        }}
                      >
                        <Chip
                          label={materiel.statut || "Disponible"}
                          size="small"
                          color={getStatusColor(materiel.statut) as any}
                          sx={{ borderRadius: 2, fontWeight: 600 }}
                        />
                        {isAdmin && (
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, materiel)}
                            sx={{
                              bgcolor: "action.hover",
                              "&:hover": {
                                bgcolor: "action.selected",
                              },
                            }}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {filteredMateriels.length === 0 && (
        <Fade in timeout={500}>
          <Paper
            elevation={0}
            sx={{
              textAlign: "center",
              py: 10,
              px: 4,
              borderRadius: 4,
              border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.grey[100],
                0.5
              )} 0%, ${alpha(theme.palette.grey[50], 0.5)} 100%)`,
            }}
          >
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <Inventory2
                sx={{
                  fontSize: 48,
                  color: alpha(theme.palette.primary.main, 0.5),
                }}
              />
            </Box>
            <Typography
              variant="h5"
              fontWeight={700}
              color="text.secondary"
              gutterBottom
            >
              Aucun matériel trouvé
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
            >
              {search
                ? "Essayez de modifier vos critères de recherche"
                : "Commencez par ajouter votre premier matériel à l'inventaire"}
            </Typography>
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowForm(true)}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 600,
                  boxShadow: `0 4px 15px ${alpha(
                    theme.palette.primary.main,
                    0.4
                  )}`,
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: `0 6px 20px ${alpha(
                      theme.palette.primary.main,
                      0.5
                    )}`,
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Ajouter un matériel
              </Button>
            )}
          </Paper>
        </Fade>
      )}

      {/* Context Menu stylisé */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: 3,
            minWidth: 180,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 10px 40px ${alpha("#000", 0.15)}`,
            "& .MuiMenuItem-root": {
              py: 1.5,
              px: 2,
              mx: 1,
              my: 0.5,
              borderRadius: 2,
              transition: "all 0.2s ease",
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem
          onClick={() => {
            setViewMateriel(menuAnchor?.materiel || null);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <Visibility fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 500 }}>
            Voir
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setEditMateriel(menuAnchor?.materiel || null);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 500 }}>
            Modifier
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteTarget(menuAnchor?.materiel || null);
            handleMenuClose();
          }}
          sx={{
            color: "error.main",
            "&:hover": {
              bgcolor: alpha(theme.palette.error.main, 0.1),
            },
          }}
        >
          <ListItemIcon>
            <Delete fontSize="small" sx={{ color: "error.main" }} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 500 }}>
            Supprimer
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Modals */}
      <MaterielFormModal
        open={showForm || Boolean(editMateriel)}
        materiel={editMateriel}
        onClose={() => {
          setShowForm(false);
          setEditMateriel(null);
        }}
      />

      <MaterielViewModal
        open={Boolean(viewMateriel)}
        materiel={viewMateriel}
        onClose={() => setViewMateriel(null)}
        setEdit={() => {
          if (!viewMateriel) return;

          setViewMateriel(null); // ferme la modal View
          setEditMateriel(viewMateriel); // ouvre la modal Edit
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        isLoading={isLoading}
        title="Supprimer le matériel"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.nom}" ?`}
        onConfirm={async () => {
          setIsLoading(true);
          if (deleteTarget?.id) {
            await confirmDelete(deleteTarget.id);
            setIsLoading(false);
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
};

export default Materiels;
