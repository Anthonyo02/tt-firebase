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
  serverTimestamp,
  orderBy,
  query 
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // Assure-toi que ce chemin est correct

// MUI Icons
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import PlayArrow from "@mui/icons-material/PlayArrow";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import Delete from "@mui/icons-material/Delete";
import AddPhotoAlternate from "@mui/icons-material/AddPhotoAlternate";
import PreviewIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

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
  Snackbar
} from "@mui/material";

// --- Types ---
interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imagePublicId?: string;
  iconName: string; // On stocke le nom, pas le composant
  colorTheme: string;
  createdAt?: any;
}

// --- Mapping des Icones (Firestore stocke des string) ---
const ICON_MAP: Record<string, React.ReactElement> = {
  "auto": <AutoAwesome />,
  "play": <PlayArrow />,
  "arrow": <ChevronLeft />,
  "star": <AutoAwesome sx={{ color: "gold" }} />
};

// --- Options de compression ---
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5, // Un peu plus grand pour un slide plein écran
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp",
};

export default function SiteWeb() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [tabValue, setTabValue] = useState(0); 
  
  // États pour le feedback utilisateur
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // --- 1. FIREBASE: Charger les données en temps réel ---
  useEffect(() => {
    const q = query(collection(db, "website_slides"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSlides = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SlideData));
      
      setSlides(fetchedSlides);
      setLoading(false);
    }, (error) => {
      console.error("Erreur Firebase:", error);
      setLoading(false);
    });

    return () => unsubscribe();
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
      // Compression
      const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
      
      // Trouver l'ancien ID pour le supprimer si besoin (ou l'API gère overwrite)
      const currentSlide = slides.find(s => s.id === id);
      
      const formData = new FormData();
      formData.append("file", compressedFile);
      if (currentSlide?.imagePublicId) {
        formData.append("publicId", currentSlide.imagePublicId);
      }

      // Appel API Upload Web
      const res = await fetch("/api/cloudinary/uploadweb", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Mise à jour Firestore immédiate
      await updateDoc(doc(db, "website_slides", id), {
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId
      });

      setToast({ msg: "Image mise à jour !", type: "success" });

    } catch (error) {
      console.error(error);
      setToast({ msg: "Erreur upload image", type: "error" });
    } finally {
      setUploadingId(null);
    }
  };

  // --- 3. ACTIONS FIREBASE ---

  // Ajouter un slide
  const handleAddSlide = async () => {
    try {
      const newSlide = {
        title: "Nouveau Slide",
        subtitle: "Description courte ici",
        imageUrl: "https://via.placeholder.com/1920x1080?text=Nouvelle+Image",
        iconName: "auto",
        colorTheme: "#1976d2",
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "website_slides"), newSlide);
      setToast({ msg: "Slide ajouté", type: "success" });
    } catch (e) {
      setToast({ msg: "Erreur ajout", type: "error" });
    }
  };

  // Supprimer un slide
  const handleDelete = async (id: string, publicId?: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce slide ?")) return;
    
    try {
      // 1. Supprimer de Firestore
      await deleteDoc(doc(db, "website_slides", id));

      // 2. Supprimer de Cloudinary (Async/Fire&Forget)
      if (publicId) {
        fetch("/api/cloudinary/deleteweb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId }),
        }).catch(console.error);
      }

      setToast({ msg: "Slide supprimé", type: "success" });
      if (currentSlide >= slides.length - 1) setCurrentSlide(0);

    } catch (e) {
      setToast({ msg: "Erreur suppression", type: "error" });
    }
  };

  // Mettre à jour les textes (Local state uniquement)
  const handleLocalChange = (id: string, field: keyof SlideData, value: string) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Sauvegarder les textes dans Firestore
  const handleSaveText = async (id: string) => {
    const slideToSave = slides.find(s => s.id === id);
    if (!slideToSave) return;

    setSavingId(id);
    try {
      await updateDoc(doc(db, "website_slides", id), {
        title: slideToSave.title,
        subtitle: slideToSave.subtitle,
        iconName: slideToSave.iconName,
        colorTheme: slideToSave.colorTheme
      });
      setToast({ msg: "Modifications enregistrées", type: "success" });
    } catch (e) {
      setToast({ msg: "Erreur sauvegarde", type: "error" });
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      
      {/* --- Tabs --- */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "white", position: "sticky", top: 0, zIndex: 1000 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} centered>
          <Tab icon={<PreviewIcon />} label="Aperçu du site" />
          <Tab icon={<EditIcon />} label="Modifier le contenu" />
        </Tabs>
      </Box>

      {/* --- APERÇU --- */}
      {tabValue === 0 && (
        <Box component="section" sx={{ position: "relative", height: { xs: 600, md: 700 }, overflow: "hidden", bgcolor: "black" }}>
          {slides.length > 0 ? slides.map((slide, index) => (
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
              {/* Fond Image */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${slide.imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)`,
                  }
                }}
              />

              {/* Contenu */}
              <Container sx={{ position: "relative", height: "100%", display: "flex", alignItems: "center" }}>
                <Box sx={{ maxWidth: 650, color: "white" }}>
                  <Box sx={{ 
                    width: 64, height: 64, borderRadius: "50%", 
                    display: "flex", alignItems: "center", justifyContent: "center",
                    bgcolor: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", mb: 3 
                  }}>
                    {React.cloneElement(ICON_MAP[slide.iconName] || <AutoAwesome />, { sx: { fontSize: 32, color: "white" } })}
                  </Box>
                  <Typography variant="h2" sx={{ fontWeight: "bold", mb: 2, fontSize: { xs: "2rem", md: "3.5rem" } }}>
                    {slide.title}
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                    {slide.subtitle}
                  </Typography>
                  <Button variant="contained" size="large" sx={{ borderRadius: 50, px: 4, bgcolor: slide.colorTheme }}>
                    En savoir plus
                  </Button>
                </Box>
              </Container>
            </Box>
          )) : (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "white" }}>
              <Typography>Aucun slide. Passez en mode édition.</Typography>
            </Box>
          )}

          {/* Navigation */}
          {slides.length > 1 && (
            <>
              <IconButton onClick={prevSlide} sx={{ position: "absolute", left: 16, top: "50%", color: "white" }}>
                <ChevronLeft fontSize="large" />
              </IconButton>
              <IconButton onClick={nextSlide} sx={{ position: "absolute", right: 16, top: "50%", color: "white" }}>
                <ChevronRight fontSize="large" />
              </IconButton>
            </>
          )}
        </Box>
      )}

      {/* --- ÉDITION --- */}
      {tabValue === 1 && (
        <Container sx={{ py: 6 }}>
          <Grid container spacing={3}>
            {slides.map((slide) => (
              <Grid item xs={12} md={6} key={slide.id}>
                <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
                  <Box sx={{ position: "relative", height: 250, bgcolor: "#eee" }}>
                    <img 
                      src={slide.imageUrl} 
                      alt="preview" 
                      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: uploadingId === slide.id ? 0.5 : 1 }} 
                    />
                    
                    {/* Spinner Upload */}
                    {uploadingId === slide.id && (
                      <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CircularProgress />
                      </Box>
                    )}

                    <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 1 }}>
                      {/* Upload Button */}
                      <IconButton 
                        component="label" 
                        sx={{ bgcolor: "white", "&:hover": { bgcolor: "#eee" } }}
                        disabled={!!uploadingId}
                      >
                        <input 
                          hidden 
                          accept="image/*" 
                          type="file" 
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(slide.id, e.target.files[0])} 
                        />
                        <CloudUploadIcon color="primary" />
                      </IconButton>

                      {/* Delete Button */}
                      <IconButton 
                        onClick={() => handleDelete(slide.id, slide.imagePublicId)} 
                        sx={{ bgcolor: "white", "&:hover": { bgcolor: "#fee" } }}
                      >
                        <Delete color="error" />
                      </IconButton>
                    </Box>
                  </Box>

                  <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField 
                      label="Titre" 
                      fullWidth 
                      variant="outlined" 
                      value={slide.title}
                      onChange={(e) => handleLocalChange(slide.id, "title", e.target.value)}
                    />
                    <TextField 
                      label="Sous-titre" 
                      fullWidth 
                      multiline
                      rows={2}
                      variant="outlined" 
                      value={slide.subtitle}
                      onChange={(e) => handleLocalChange(slide.id, "subtitle", e.target.value)}
                    />
                    
                    <Stack direction="row" spacing={2}>
                      <TextField
                        select
                        label="Icône"
                        value={slide.iconName}
                        onChange={(e) => handleLocalChange(slide.id, "iconName", e.target.value)}
                        fullWidth
                        size="small"
                      >
                         {Object.keys(ICON_MAP).map(key => (
                           <MenuItem key={key} value={key}>{key}</MenuItem>
                         ))}
                      </TextField>
                      <TextField
                        type="color"
                        label="Couleur Thème"
                        value={slide.colorTheme}
                        onChange={(e) => handleLocalChange(slide.id, "colorTheme", e.target.value)}
                        fullWidth
                        size="small"
                        sx={{ "& input": { height: "40px", cursor: "pointer" } }}
                      />
                    </Stack>

                    <Button 
                      variant="contained" 
                      startIcon={savingId === slide.id ? <CircularProgress size={20} color="inherit"/> : <SaveIcon />}
                      onClick={() => handleSaveText(slide.id)}
                      disabled={savingId === slide.id}
                      fullWidth
                    >
                      Enregistrer les textes
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            
            {/* Bouton Ajouter */}
            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                onClick={handleAddSlide}
                sx={{
                  height: "100%",
                  minHeight: 300,
                  border: "2px dashed #ccc",
                  borderRadius: 4,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  color: "#666",
                  "&:hover": { bgcolor: "#e3e3e3", borderColor: "#999" }
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.type || 'info'} variant="filled">
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}