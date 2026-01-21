"use client";
import React, { useState, useMemo, useCallback, memo, useEffect } from "react";
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
  CheckCircle,
  Schedule,
  Build,
  Restore,
  Landscape,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import MaterielFormModal from "../components/modals/MaterielFormModal";
import MaterielViewModal from "../components/modals/MaterielViewModal";
import ConfirmDialog from "../components/modals/ConfirmDialog";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { Materiel, useData } from "@/context/DataContext";
import storage from "../lib/localforage"; // ✅ Import LocalForage

// ============================================
// 🚀 SUPPRESSION CLOUDINARY EN BACKGROUND (Fire & Forget)
// ============================================
const deleteFromCloudinaryAsync = (publicId: string | undefined) => {
  if (!publicId) return;

  // Fire and forget - ne bloque pas l'UI
  fetch("/api/cloudinary/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId }),
  })
    .then((res) => res.json())
    .then((data) => console.log("🗑️ Cloudinary cleanup:", data))
    .catch((err) => console.warn("⚠️ Cloudinary cleanup failed:", err));
};

// ============================================
// 🚀 COMPOSANT LIGNE DE TABLE MEMOÏSÉ
// ============================================
const MaterielTableRow = memo(
  ({
    materiel,
    index,
    isAdmin,
    isPoor,
    onView,
    onMenuOpen,
    getStatusColor,
    getStatusIconBg,
    getMaterielImage,
    theme,
  }: any) => (
    <Grow in timeout={Math.min(300 + index * 30, 600)} key={materiel.id}>
      <TableRow
        hover
        sx={{
          cursor: "pointer",
          transition: "background 0.2s",
          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
          "&:last-child td": { border: 0 },
        }}
        onClick={() => onView(materiel)}
      >
        <TableCell sx={{ py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: getStatusIconBg(materiel.statut),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                overflow: "hidden",
              }}
            >
              {isPoor || !materiel.imageUrl ? (
                <Landscape fontSize="small" />
              ) : (
                <Box
                  component="img"
                  src={getMaterielImage(materiel.imageUrl)}
                  alt=""
                  loading="lazy"
                  sx={{ width: 40, height: 40, objectFit: "cover" }}
                />
              )}
            </Box>
            <Typography fontWeight={600} fontSize="0.9rem">
              {materiel.nom}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={
              `${materiel.reference} ${materiel.referenceNum || ""}`.trim() ||
              "N/A"
            }
            size="small"
            variant="outlined"
            sx={{ borderRadius: 2, fontWeight: 500 }}
          />
        </TableCell>
        <TableCell align="center">
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.info.main, 0.1),
              color: theme.palette.info.dark,
              fontWeight: 700,
              fontSize: "0.85rem",
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
            sx={{ borderRadius: 2, fontWeight: 600 }}
          />
        </TableCell>
        <TableCell align="right">
          {isAdmin ? (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onMenuOpen(e, materiel);
              }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          ) : (
            <Typography
              color="text.secondary"
              fontSize="0.8rem"
              sx={{
                maxWidth: 150,
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
  )
);

MaterielTableRow.displayName = "MaterielTableRow";

// ============================================
// 🚀 COMPOSANT CARD MOBILE MEMOÏSÉ
// ============================================
const MaterielCard = memo(
  ({
    materiel,
    index,
    isAdmin,
    isPoor,
    onView,
    onMenuOpen,
    getStatusColor,
    getStatusIconBg,
    getMaterielImage,
    theme,
  }: any) => (
    <Grid item xs={12} key={materiel.id}>
      <Grow in timeout={Math.min(200 + index * 50, 500)}>
        <Card
          elevation={0}
          sx={{
            cursor: "pointer",
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
            },
            "&:active": { transform: "scale(0.99)" },
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
          onClick={() => onView(materiel)}
        >
          <CardContent sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: getStatusIconBg(materiel.statut),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    overflow: "hidden",
                  }}
                >
                  {isPoor || !materiel.imageUrl ? (
                    <Landscape fontSize="small" />
                  ) : (
                    <Box
                      component="img"
                      src={getMaterielImage(materiel.imageUrl)}
                      alt=""
                      loading="lazy"
                      sx={{ width: 40, height: 40, objectFit: "cover" }}
                    />
                  )}
                </Box>
                <Box>
                  <Typography fontWeight={600} fontSize="0.95rem">
                    {materiel.nom}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
                    <Chip
                      label={materiel.reference}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.65rem" }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.dark,
                        fontWeight: 600,
                      }}
                    >
                      {materiel.quantites}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 0.5,
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onMenuOpen(e, materiel);
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
  )
);

MaterielCard.displayName = "MaterielCard";

// ============================================
// 🚀 COMPOSANT PRINCIPAL OPTIMISÉ
// ============================================
const Materiels: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { materiels, deleteMateriel } = useData();
  const { isPoor } = useConnectionStatus();
  const [localUser, setLocalUser] = useState<{
    nom?: string;
    email?: string;
    role?: string;
  }>({});
  const isAdmin = localUser?.role === "admin";
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setLocalUser(JSON.parse(stored));
      } catch {
        setLocalUser({});
      }
    } else {
      setLocalUser({});
    }
  }, []);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editMateriel, setEditMateriel] = useState<Materiel | null>(null);
  const [viewMateriel, setViewMateriel] = useState<Materiel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Materiel | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    el: HTMLElement;
    materiel: Materiel;
  } | null>(null);
  const [searchCategorie, setSearchCategorie] = useState("");
  const [searchStatut, setSearchStatut] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Chargement asynchrone des catégories avec LocalForage
  const [categoriesFromStorage, setCategoriesFromStorage] = useState<string[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await storage.getItem<string[]>("categorie");
        if (cats) {
          setCategoriesFromStorage(cats);
        }
      } catch (error) {
        console.error("Erreur chargement catégories localForage", error);
      }
    };
    loadCategories();
  }, []);

  // ✅ Memoize filtered materiels
  const filteredMateriels = useMemo(() => {
    const searchLower = search.toLowerCase();
    const statutLower = searchStatut.toLowerCase();

    return materiels.filter((m) => {
      if (searchCategorie && m.comentaire !== searchCategorie) return false;
      if (statutLower && m.statut?.toLowerCase() !== statutLower) return false;
      if (searchLower) {
        return (
          m.nom.toLowerCase().includes(searchLower) ||
          m.reference.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [materiels, search, searchCategorie, searchStatut]);

  // ✅ Memoize stats
  const stats = useMemo(() => {
    const result = {
      total: 0,
      disponible: 0,
      enUtilisation: 0,
      maintenance: 0,
    };

    for (const m of materiels) {
      result.total++;
      const statut = m.statut?.toLowerCase();
      if (statut === "disponible") result.disponible++;
      else if (statut === "en utilisation") result.enUtilisation++;
      else if (statut === "maintenance") result.maintenance++;
    }

    return result;
  }, [materiels]);

  // ✅ Memoize helper functions
  const getMaterielImage = useCallback((url: string | null) => {
    if (!url) return "";
    if (url.includes("res.cloudinary.com")) return url;
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    return match
      ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`
      : "";
  }, []);

  const getStatusColor = useCallback((statut: string) => {
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
  }, []);

  const getStatusIconBg = useCallback(
    (statut: string) => {
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
    },
    [theme]
  );

  // ✅ Handlers memoïsés
  const handleMenuOpen = useCallback(
    (e: React.MouseEvent<HTMLElement>, materiel: Materiel) => {
      e.stopPropagation();
      setMenuAnchor({ el: e.currentTarget, materiel });
    },
    []
  );

  const handleMenuClose = useCallback(() => setMenuAnchor(null), []);

  const handleView = useCallback(
    (materiel: Materiel) => setViewMateriel(materiel),
    []
  );

  const handleResetFilters = useCallback(() => {
    setSearch("");
    setSearchCategorie("");
    setSearchStatut("");
  }, []);

  // ✅ 🚀 SUPPRESSION ULTRA-RAPIDE (Optimistic UI)
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget?.id) return;

    const materielToDelete = deleteTarget;

    // 1️⃣ FERMER IMMÉDIATEMENT LE DIALOG (UI instantanée)
    setDeleteTarget(null);
    setIsLoading(true);
    try {
      // 2️⃣ Supprimer de Firestore (opération principale)
      await deleteMateriel(materielToDelete.id);

      // 3️⃣ Supprimer de Cloudinary EN BACKGROUND (fire & forget)
      deleteFromCloudinaryAsync(materielToDelete.imagePublicId);
      setIsLoading(false);
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
      // TODO: Afficher un toast d'erreur si nécessaire
    }
  }, [deleteTarget, deleteMateriel]);

  // ✅ Props communes pour les rows/cards
  const commonProps = useMemo(
    () => ({
      isAdmin,
      isPoor,
      onView: handleView,
      onMenuOpen: handleMenuOpen,
      getStatusColor,
      getStatusIconBg,
      getMaterielImage,
      theme,
    }),
    [
      isAdmin,
      isPoor,
      handleView,
      handleMenuOpen,
      getStatusColor,
      getStatusIconBg,
      getMaterielImage,
      theme,
    ]
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.03
        )} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
        p: { xs: 2, md: 4 },
      }}
    >
      {/* ============ HEADER ============ */}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
              <Typography variant="h4" sx={{ fontWeight: 800, color: "white" }}>
                Matériels
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.9)" }}>
                Gérez votre inventaire
              </Typography>
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
                "&:hover": {
                  bgcolor: "#f8f8f6",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.2s",
              }}
            >
              Nouveau matériel
            </Button>
          )}
        </Box>

        {/* Stats */}
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
          ].map((stat, i) => (
            <Grid item xs={6} sm={6} xl={3} key={i}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: i === 0 ? "rgba(255,255,255,0.2)" : stat.color,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "white", lineHeight: 1.2 }}
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

      {/* ============ FILTRES ============ */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          p: 2,
          bgcolor: alpha(theme.palette.background.paper, 0.9),
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Catégorie"
              value={searchCategorie}
              onChange={(e) => setSearchCategorie(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            >
              <MenuItem value="">Toutes</MenuItem>
              {categoriesFromStorage.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={5} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Statut"
              value={searchStatut}
              onChange={(e) => setSearchStatut(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="Disponible">Disponible</MenuItem>
              <MenuItem value="En utilisation">En utilisation</MenuItem>
              <MenuItem value="Maintenance">Maintenance</MenuItem>
            </TextField>
          </Grid>
          <Grid
            item
            xs={1}
            md={2}
            sx={{ display: "flex", justifyContent: "flex-end" }}
          >
            <IconButton onClick={handleResetFilters} size="small">
              <Restore />
            </IconButton>
          </Grid>
        </Grid>
      </Paper>

      {/* ============ TABLE DESKTOP ============ */}
      {!isMobile && filteredMateriels.length > 0 && (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            maxHeight: 500,
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, py: 2 }}>Nom</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Référence</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Qté
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {isAdmin ? "Actions" : "Description"}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMateriels.map((materiel, index) => (
                <MaterielTableRow
                  key={materiel.id}
                  materiel={materiel}
                  index={index}
                  {...commonProps}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ============ CARDS MOBILE ============ */}
      {isMobile && filteredMateriels.length > 0 && (
        <Grid
          container
          spacing={1.5}
          sx={{ maxHeight: 500, overflowY: "auto" }}
        >
          {filteredMateriels.map((materiel, index) => (
            <MaterielCard
              key={materiel.id}
              materiel={materiel}
              index={index}
              {...commonProps}
            />
          ))}
        </Grid>
      )}

      {/* ============ EMPTY STATE ============ */}
      {filteredMateriels.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            textAlign: "center",
            py: 8,
            borderRadius: 4,
            border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
          }}
        >
          <Inventory2
            sx={{
              fontSize: 48,
              color: alpha(theme.palette.primary.main, 0.3),
              mb: 2,
            }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun matériel trouvé
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {search
              ? "Modifiez vos critères de recherche"
              : "Ajoutez votre premier matériel"}
          </Typography>
          {isAdmin && !search && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowForm(true)}
            >
              Ajouter
            </Button>
          )}
        </Paper>
      )}

      {/* ============ MENU CONTEXTUEL ============ */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2, minWidth: 160 },
        }}
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
          <ListItemText>Voir</ListItemText>
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
          <ListItemText>Modifier</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteTarget(menuAnchor?.materiel || null);
            handleMenuClose();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Supprimer</ListItemText>
        </MenuItem>
      </Menu>

      {/* ============ MODALS ============ */}
      {(showForm || editMateriel) && (
        <MaterielFormModal
          open={showForm || Boolean(editMateriel)}
          materiel={editMateriel}
          onClose={() => {
            setShowForm(false);
            setEditMateriel(null);
          }}
        />
      )}

      {viewMateriel && (
        <MaterielViewModal
          open={Boolean(viewMateriel)}
          materiel={viewMateriel}
          onClose={() => setViewMateriel(null)}
          setEdit={() => {
            setViewMateriel(null);
            setEditMateriel(viewMateriel);
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer le matériel"
        message={`Supprimer "${deleteTarget?.nom}" ?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isLoading}
      />
    </Box>
  );
};

export default Materiels;