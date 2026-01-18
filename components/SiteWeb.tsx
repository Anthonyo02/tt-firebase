"use client";

import React, { useState, useEffect, useCallback } from "react";
import imageCompression from "browser-image-compression";

// Firebase Imports
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { db2 } from "@/lib/firebase-site";

// MUI Icons
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import PlayArrow from "@mui/icons-material/PlayArrow";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import Delete from "@mui/icons-material/Delete";
import PreviewIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import StarIcon from "@mui/icons-material/Star";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import FavoriteIcon from "@mui/icons-material/Favorite";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

// MUI Components
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  MenuItem,
  Stack,
  Alert,
  Snackbar,
  Divider,
  Paper,
} from "@mui/material";

// --- Types correspondant au format attendu ---
interface CtaButton {
  label: string;
  href: string;
  color: "primary" | "outline" | "secondary";
}

interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  image: string; // ✅ Renommé depuis imageUrl
  imagePublicId?: string; // Pour Cloudinary
  icon: string; // ✅ Renommé depuis iconName
  overlayColor: string; // ✅ Renommé depuis colorTheme
  ctas: CtaButton[]; // ✅ Nouveau champ
  order: number; // ✅ Renommé depuis createdAt
}

// --- Mapping des Icônes ---
const ICON_MAP: Record<string, React.ReactElement> = {
  Sparkles: <AutoAwesome />,
  Star: <StarIcon />,
  Rocket: <RocketLaunchIcon />,
  Lightbulb: <LightbulbIcon />,
  Heart: <FavoriteIcon />,
  Play: <PlayArrow />,
};



// --- Options de couleur pour les boutons CTA ---
const CTA_COLOR_OPTIONS = [
  { value: "primary", label: "Primaire" },
  { value: "outline", label: "Contour" },
  { value: "secondary", label: "Secondaire" },
];

// --- Options de compression ---
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp" as const,
};

// --- Fonction helper pour convertir overlayColor en CSS ---
const getOverlayGradient = (overlayColor: string): string => {
  const colorMap: Record<string, string> = {
    "from-primary/80": "rgba(25, 118, 210, 0.8)",
    "from-secondary/80": "rgba(156, 39, 176, 0.8)",
    "from-blue-900/80": "rgba(13, 71, 161, 0.8)",
    "from-green-900/80": "rgba(27, 94, 32, 0.8)",
    "from-purple-900/80": "rgba(74, 20, 140, 0.8)",
    "from-black/70": "rgba(0, 0, 0, 0.7)",
  };
  return colorMap[overlayColor] || "rgba(0, 0, 0, 0.7)";
};

export default function SiteWeb() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [tabValue, setTabValue] = useState(0);

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // --- 1. FIREBASE: Charger les données en temps réel ---
  useEffect(() => {
    console.log("🔄 Initialisation du listener Firebase...");

    const slidesRef = collection(db2, "website_slides");
    const q = query(slidesRef, orderBy("order", "asc")); // ✅ Tri par "order"

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("📦 Données reçues:", snapshot.docs.length, "documents");

        const fetchedSlides = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          console.log("📄 Document:", docSnap.id, data);

          return {
            id: docSnap.id,
            title: data.title || "Sans titre",
            subtitle: data.subtitle || "",
            image: data.image || "/imgcarousel/placeholder.png", // ✅
            imagePublicId: data.imagePublicId || "",
            icon: data.icon || "Sparkles", // ✅
            overlayColor: data.overlayColor || "#616637", // ✅
            ctas: data.ctas || [
              // ✅
              { label: "En savoir plus", href: "#", color: "primary" },
            ],
            order: data.order || 0, // ✅
          } as SlideData;
        });

        console.log("✅ Slides chargés:", fetchedSlides);
        setSlides(fetchedSlides);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Erreur Firebase:", error.message);
        setToast({ msg: `Erreur: ${error.message}`, type: "error" });
        setLoading(false);
      },
    );

    return () => {
      console.log("🛑 Cleanup listener");
      unsubscribe();
    };
  }, []);

  // --- Logique du Carousel ---
  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (tabValue === 1 || slides.length === 0) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, tabValue, slides.length]);

  // --- 2. CLOUDINARY: Upload ---
  const handleImageUpload = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);

      const currentSlideData = slides.find((s) => s.id === id);

      const formData = new FormData();
      formData.append("file", compressedFile);
      if (currentSlideData?.imagePublicId) {
        formData.append("publicId", currentSlideData.imagePublicId);
      }

      const res = await fetch("/api/cloudinary/uploadweb", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await updateDoc(doc(db2, "website_slides", id), {
        image: data.imageUrl, // ✅ Champ renommé
        imagePublicId: data.imagePublicId,
      });

      setToast({ msg: "Image mise à jour !", type: "success" });
    } catch (error: any) {
      console.error(error);
      setToast({ msg: error.message || "Erreur upload image", type: "error" });
    } finally {
      setUploadingId(null);
    }
  };

  // --- 3. ACTIONS FIREBASE ---
  const handleAddSlide = async () => {
    try {
      // Calculer le prochain order
      const maxOrder = slides.reduce((max, s) => Math.max(max, s.order), 0);

      const newSlide = {
        title: "Nouveau Slide",
        subtitle: "Description courte ici",
        image: "/imgcarousel/placeholder.png", // ✅
        icon: "Sparkles", // ✅
        overlayColor: "from-primary/80", // ✅
        ctas: [
          // ✅
          { label: "En savoir plus", href: "#", color: "primary" },
          { label: "Contact", href: "/contact", color: "outline" },
        ],
        order: maxOrder + 1, // ✅
      };

      const docRef = await addDoc(collection(db2, "website_slides"), newSlide);
      console.log("✅ Slide créé avec ID:", docRef.id);
      setToast({ msg: "Slide ajouté", type: "success" });
    } catch (e: any) {
      console.error("Erreur ajout:", e);
      setToast({ msg: e.message || "Erreur ajout", type: "error" });
    }
  };

  const handleDelete = async (id: string, publicId?: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce slide ?")) return;

    try {
      await deleteDoc(doc(db2, "website_slides", id));

      if (publicId) {
        fetch("/api/cloudinary/deleteweb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId }),
        }).catch(console.error);
      }

      setToast({ msg: "Slide supprimé", type: "success" });
      if (currentSlide >= slides.length - 1) setCurrentSlide(0);
    } catch (e: any) {
      setToast({ msg: e.message || "Erreur suppression", type: "error" });
    }
  };

  // --- Modification locale des champs simples ---
  const handleLocalChange = (
    id: string,
    field: keyof SlideData,
    value: any,
  ) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  // --- Modification des CTAs ---
  const handleCtaChange = (
    slideId: string,
    ctaIndex: number,
    field: keyof CtaButton,
    value: string,
  ) => {
    setSlides((prev) =>
      prev.map((slide) => {
        if (slide.id !== slideId) return slide;

        const newCtas = [...slide.ctas];
        newCtas[ctaIndex] = { ...newCtas[ctaIndex], [field]: value };
        return { ...slide, ctas: newCtas };
      }),
    );
  };

  const handleAddCta = (slideId: string) => {
    setSlides((prev) =>
      prev.map((slide) => {
        if (slide.id !== slideId) return slide;
        return {
          ...slide,
          ctas: [
            ...slide.ctas,
            { label: "Nouveau bouton", href: "#", color: "outline" as const },
          ],
        };
      }),
    );
  };

  const handleRemoveCta = (slideId: string, ctaIndex: number) => {
    setSlides((prev) =>
      prev.map((slide) => {
        if (slide.id !== slideId) return slide;
        return {
          ...slide,
          ctas: slide.ctas.filter((_, idx) => idx !== ctaIndex),
        };
      }),
    );
  };

  // --- Sauvegarde Firebase ---
  const handleSaveSlide = async (id: string) => {
    const slideToSave = slides.find((s) => s.id === id);
    if (!slideToSave) return;

    setSavingId(id);
    try {
      await updateDoc(doc(db2, "website_slides", id), {
        title: slideToSave.title,
        subtitle: slideToSave.subtitle,
        icon: slideToSave.icon, // ✅
        overlayColor: slideToSave.overlayColor, // ✅
        ctas: slideToSave.ctas, // ✅
        order: slideToSave.order, // ✅
      });
      setToast({ msg: "Modifications enregistrées", type: "success" });
    } catch (e: any) {
      setToast({ msg: e.message || "Erreur sauvegarde", type: "error" });
    } finally {
      setSavingId(null);
    }
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography>Chargement des slides...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      {/* --- Tabs --- */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "white",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} centered>
          <Tab icon={<PreviewIcon />} label="Aperçu du site" />
          <Tab icon={<EditIcon />} label="Modifier le contenu" />
        </Tabs>
      </Box>

      {/* --- APERÇU --- */}
      {tabValue === 0 && (
        <Box
          component="section"
          sx={{
            position: "relative",
            height: { xs: 600, md: 700 },
            overflow: "hidden",
            bgcolor: "black",
          }}
        >
          {slides.length > 0 ? (
            slides.map((slide, index) => (
              <Box
                key={slide.id}
                sx={{
                  position: "absolute",
                  inset: 0,
                  transition: "opacity 0.7s ease-in-out",
                  opacity: index === currentSlide ? 1 : 0,
                  pointerEvents: index === currentSlide ? "auto" : "none",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${slide.image})`, // ✅
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(to right, ${getOverlayGradient(slide.overlayColor)} 0%, rgba(0,0,0,0.3) 100%)`, // ✅
                    },
                  }}
                />

                <Container
                  sx={{
                    position: "relative",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ maxWidth: 650, color: "white" }}>
                    {/* Icône */}
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "rgba(255,255,255,0.2)",
                        backdropFilter: "blur(10px)",
                        mb: 3,
                      }}
                    >
                      {React.cloneElement(
                        ICON_MAP[slide.icon] || <AutoAwesome />,
                        { sx: { fontSize: 32, color: "white" } },
                      )}
                    </Box>

                    {/* Titre */}
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: "bold",
                        mb: 2,
                        fontSize: { xs: "2rem", md: "3.5rem" },
                      }}
                    >
                      {slide.title}
                    </Typography>

                    {/* Sous-titre */}
                    <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                      {slide.subtitle}
                    </Typography>

                    {/* CTAs dynamiques ✅ */}
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      {slide.ctas.map((cta, ctaIdx) => (
                        <Button
                          key={ctaIdx}
                          variant={
                            cta.color === "outline" ? "outlined" : "contained"
                          }
                          color={
                            cta.color === "outline" ? "inherit" : "primary"
                          }
                          size="large"
                          href={cta.href}
                          sx={{
                            borderRadius: 50,
                            px: 4,
                            ...(cta.color === "outline" && {
                              borderColor: "white",
                              color: "white",
                              "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                            }),
                          }}
                        >
                          {cta.label}
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                </Container>
              </Box>
            ))
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                color: "white",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Typography>Aucun slide trouvé.</Typography>
              <Button
                variant="contained"
                onClick={() => setTabValue(1)}
                startIcon={<AddIcon />}
              >
                Créer un slide
              </Button>
            </Box>
          )}

          {slides.length > 1 && (
            <>
              <IconButton
                onClick={prevSlide}
                sx={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  color: "white",
                  bgcolor: "rgba(0,0,0,0.3)",
                }}
              >
                <ChevronLeft fontSize="large" />
              </IconButton>
              <IconButton
                onClick={nextSlide}
                sx={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  color: "white",
                  bgcolor: "rgba(0,0,0,0.3)",
                }}
              >
                <ChevronRight fontSize="large" />
              </IconButton>

              {/* Indicateurs */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 20,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: 1,
                }}
              >
                {slides.map((_, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor:
                        idx === currentSlide
                          ? "white"
                          : "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                  />
                ))}
              </Box>
            </>
          )}
        </Box>
      )}

      {/* --- ÉDITION --- */}
      {tabValue === 1 && (
        <Container sx={{ py: 6 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            📊 {slides.length} slide(s) chargé(s) depuis Firebase
          </Alert>

          <Grid container spacing={3}>
            {slides.map((slide) => (
              <Grid item xs={12} key={slide.id}>
                <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
                  <Grid container>
                    {/* Image à gauche */}
                    <Grid item xs={12} md={5}>
                      <Box
                        sx={{
                          position: "relative",
                          height: { xs: 250, md: "100%" },
                          minHeight: 300,
                          bgcolor: "#eee",
                        }}
                      >
                        <img
                          src={slide.image}
                          alt="preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: uploadingId === slide.id ? 0.5 : 1,
                          }}
                        />

                        {uploadingId === slide.id && (
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CircularProgress />
                          </Box>
                        )}

                        <Box
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            display: "flex",
                            gap: 1,
                          }}
                        >
                          <IconButton
                            component="label"
                            sx={{
                              bgcolor: "white",
                              "&:hover": { bgcolor: "#eee" },
                            }}
                            disabled={!!uploadingId}
                          >
                            <input
                              hidden
                              accept="image/*"
                              type="file"
                              onChange={(e) =>
                                e.target.files?.[0] &&
                                handleImageUpload(slide.id, e.target.files[0])
                              }
                            />
                            <CloudUploadIcon color="primary" />
                          </IconButton>

                          <IconButton
                            onClick={() =>
                              handleDelete(slide.id, slide.imagePublicId)
                            }
                            sx={{
                              bgcolor: "white",
                              "&:hover": { bgcolor: "#fee" },
                            }}
                          >
                            <Delete color="error" />
                          </IconButton>
                        </Box>

                        {/* Order badge */}
                        <Typography
                          sx={{
                            position: "absolute",
                            bottom: 8,
                            left: 8,
                            bgcolor: "primary.main",
                            color: "white",
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            fontWeight: "bold",
                          }}
                        >
                          #{slide.order}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Formulaire à droite */}
                    <Grid item xs={12} md={7}>
                      <CardContent
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                          p: 3,
                        }}
                      >
                        {/* Titre & Sous-titre */}
                        <TextField
                          label="Titre"
                          fullWidth
                          variant="outlined"
                          value={slide.title}
                          onChange={(e) =>
                            handleLocalChange(slide.id, "title", e.target.value)
                          }
                        />
                        <TextField
                          label="Sous-titre"
                          fullWidth
                          multiline
                          rows={2}
                          variant="outlined"
                          value={slide.subtitle}
                          onChange={(e) =>
                            handleLocalChange(
                              slide.id,
                              "subtitle",
                              e.target.value,
                            )
                          }
                        />

                        {/* Icône, Overlay, Order */}
                        <Stack direction="row" spacing={2}>
                          <TextField
                            select
                            label="Icône"
                            value={slide.icon}
                            onChange={(e) =>
                              handleLocalChange(
                                slide.id,
                                "icon",
                                e.target.value,
                              )
                            }
                            fullWidth
                            size="small"
                          >
                            {Object.keys(ICON_MAP).map((key) => (
                              <MenuItem key={key} value={key}>
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  gap={1}
                                >
                                  {React.cloneElement(ICON_MAP[key], {
                                    fontSize: "small",
                                  })}
                                  {key}
                                </Stack>
                              </MenuItem>
                            ))}
                          </TextField>

                          <TextField
                            type="color"
                            label="Couleur Overlay"
                            value={slide.overlayColor}
                            onChange={(e) =>
                              handleLocalChange(
                                slide.id,
                                "overlayColor",
                                e.target.value,
                              )
                            }
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            sx={{
                              "& input": {
                                height: 22,
                                cursor: "pointer",
                                padding: 1,
                              },
                            }}
                          />

                          <TextField
                            type="number"
                            label="Ordre"
                            value={slide.order}
                            onChange={(e) =>
                              handleLocalChange(
                                slide.id,
                                "order",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            size="small"
                            // sx={{ width: 100 }}
                          />
                        </Stack>

                        <Divider sx={{ my: 1 }} />

                        {/* CTAs */}
                        <Typography variant="subtitle2" fontWeight="bold">
                          Boutons d'action (CTAs)
                        </Typography>

                        {slide.ctas.map((cta, ctaIdx) => (
                          <Paper key={ctaIdx} variant="outlined" sx={{ p: 2 }}>
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                            >
                              <TextField
                                label="Label"
                                value={cta.label}
                                onChange={(e) =>
                                  handleCtaChange(
                                    slide.id,
                                    ctaIdx,
                                    "label",
                                    e.target.value,
                                  )
                                }
                                size="small"
                                sx={{ flex: 1 }}
                              />
                              <TextField
                                label="Lien (href)"
                                value={cta.href}
                                onChange={(e) =>
                                  handleCtaChange(
                                    slide.id,
                                    ctaIdx,
                                    "href",
                                    e.target.value,
                                  )
                                }
                                size="small"
                                sx={{ flex: 1 }}
                              />
                              <TextField
                                select
                                label="Style"
                                value={cta.color}
                                onChange={(e) =>
                                  handleCtaChange(
                                    slide.id,
                                    ctaIdx,
                                    "color",
                                    e.target.value,
                                  )
                                }
                                size="small"
                                sx={{ width: 120 }}
                              >
                                {CTA_COLOR_OPTIONS.map((opt) => (
                                  <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </MenuItem>
                                ))}
                              </TextField>
                              <IconButton
                                color="error"
                                onClick={() =>
                                  handleRemoveCta(slide.id, ctaIdx)
                                }
                                disabled={slide.ctas.length <= 1}
                              >
                                <DeleteOutlineIcon />
                              </IconButton>
                            </Stack>
                          </Paper>
                        ))}

                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddCta(slide.id)}
                          size="small"
                        >
                          Ajouter un bouton
                        </Button>

                        <Divider sx={{ my: 1 }} />

                        {/* Bouton Sauvegarder */}
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={
                            savingId === slide.id ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              <SaveIcon />
                            )
                          }
                          onClick={() => handleSaveSlide(slide.id)}
                          disabled={savingId === slide.id}
                          fullWidth
                          size="large"
                        >
                          Enregistrer les modifications
                        </Button>
                      </CardContent>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            ))}

            {/* Bouton Ajouter */}
            <Grid item xs={12}>
              <Button
                fullWidth
                onClick={handleAddSlide}
                sx={{
                  height: 120,
                  border: "2px dashed #ccc",
                  borderRadius: 4,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  color: "#666",
                  "&:hover": { bgcolor: "#e3e3e3", borderColor: "#999" },
                }}
              >
                <AddIcon sx={{ fontSize: 48 }} />
                <Typography>Ajouter un nouveau slide</Typography>
              </Button>
            </Grid>
          </Grid>
        </Container>
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast?.type || "info"} variant="filled">
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
