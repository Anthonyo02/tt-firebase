// ============================================
// IMPORTS
// ============================================
import React, { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import imageCompression from "browser-image-compression";
import Cropper, { Area } from "react-easy-crop";
import axios from "axios";

import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Grid,
  CircularProgress,
  Typography,
  Avatar,
  Paper,
  Slide,
  InputAdornment,
  Stack,
  Divider,
  Slider,
} from "@mui/material";

import {
  Inventory2,
  Close,
  CloudUpload,
  CameraAlt,
  DeleteOutline,
  Done,
  Add,
  Clear,
  Crop,
  RotateLeft,
  RotateRight,
  ZoomIn,
  Check,
  CropSquare,
  CropLandscape,
  CropPortrait,
  CropFree,
  Refresh,
} from "@mui/icons-material";

import { TransitionProps } from "@mui/material/transitions";
// Assurez-vous que le chemin d'import est correct pour votre projet
import { useData, Materiel as MaterielType } from "@/context/DataContext"; 

// ============================================
// CONSTANTES & UTILITAIRES
// ============================================

// Transition pour le Dialog
const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Options de format pour le recadrage
const aspectRatioOptions = [
  { label: "Libre", value: undefined, icon: <CropFree fontSize="small" /> },
  { label: "1:1", value: 1, icon: <CropSquare fontSize="small" /> },
  { label: "16:9", value: 16 / 9, icon: <CropLandscape fontSize="small" /> },
  { label: "4:3", value: 4 / 3, icon: <CropPortrait fontSize="small" /> },
];

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    // Important pour éviter les erreurs CORS avec Cloudinary lors de l'édition
    image.setAttribute("crossOrigin", "anonymous"); 
    image.src = url;
  });

const getRadianAngle = (degreeValue: number) => (degreeValue * Math.PI) / 180;

const rotateSize = (width: number, height: number, rotation: number) => {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de créer le contexte canvas");

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");
  if (!croppedCtx) throw new Error("Impossible de créer le contexte canvas");

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return croppedCanvas.toDataURL("image/jpeg", 0.9);
}

// ============================================
// CLOUDINARY UPLOAD
// ============================================
// ============================================
// CLOUDINARY UPLOAD
// ============================================
const uploadToCloudinary = async (file: File | string): Promise<string> => {
  try {
    const formData = new FormData();

    // Gestion des différents types d'entrée
    if (typeof file === "string") {
      if (file.startsWith("data:")) {
        // Base64 → Blob
        const response = await fetch(file);
        const blob = await response.blob();
        formData.append("file", blob, "image.jpg");
      } else {
        // URL directe
        formData.append("file", file);
      }
    } else {
      // File object
      formData.append("file", file);
    }

    formData.append("upload_preset", "materiel_upload");
    formData.append("folder", "materiels");

    const cloudName = "dmvsypdvu";
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const response = await axios.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (!response.data.secure_url) {
      throw new Error("Pas d'URL retournée par Cloudinary");
    }

    return response.data.secure_url;
  } catch (error: any) {
    console.error("❌ Erreur Cloudinary:", error.response?.data || error.message);
    throw new Error("Échec de l'upload de l'image");
  }
};


// ============================================
// COMPONENT
// ============================================
interface Props {
  open: boolean;
  materiel: MaterielType | null;
  onClose: () => void;
  onSaved?: () => void;
}

const MaterielFormModal: React.FC<Props> = ({ open, materiel, onClose, onSaved }) => {
  const { addMateriel, updateMateriel, categorie, references } = useData();

  // FORM STATE
  const [form, setForm] = useState<MaterielType>({
    id: "",
    nom: "",
    quantites: 1,
    reference: "",
    referenceNum: "",
    description: "",
    statut: "disponible",
    comentaire: "", // Note: 'comentaire' semble être utilisé pour la Catégorie dans votre code
    imageUrl: "",
  });

  // UI STATES
  const [isLoading, setIsLoading] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [showNewRef, setShowNewRef] = useState(false);
  
  // Validation States
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [referenceNumError, setReferenceNumError] = useState<string | null>(null);

  // IMAGE STATE
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // CROPPER STATE
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Vérifie si l'image vient de Google Drive (pour l'affichage du badge)
  const isGoogleDriveImage = imagePreview?.includes("drive.google.com");

  // EFFECTS
  useEffect(() => {
    if (open) {
      if (materiel) {
        setForm(materiel);
        setImagePreview(materiel.imageUrl || null);
        setImageBase64(null);
      } else {
        resetForm();
      }
    }
  }, [materiel, open]);

  const resetForm = () => {
    setForm({
      id: "",
      nom: "",
      quantites: 1,
      reference: "",
      referenceNum: "",
      description: "",
      statut: "disponible",
      comentaire: "", // Catégorie
      imageUrl: "",
    });
    setImagePreview(null);
    setImageBase64(null);
    setShowNewCat(false);
    setShowNewRef(false);
    setReferenceError(null);
    setReferenceNumError(null);
    resetCropper();
  };

  const resetCropper = () => {
    setShowCropper(false);
    setTempImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setAspectRatio(1);
  };

  const resetCropperControls = () => {
    setZoom(1);
    setRotation(0);
    setCrop({ x: 0, y: 0 });
  };

  const handleChange = (field: keyof MaterielType, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // --- LOGIQUE REFERENCE ---
  const handleReferenceSelectChange = (value: string) => {
    setForm((prev) => ({ ...prev, reference: value }));
  };

  const handleNewReferenceChange = (value: string) => {
    // Ajoute le préfixe T-T si nécessaire ou stocke la valeur brute
    const formatted = value.startsWith("T-T") ? value : `T-T${value}`;
    setForm((prev) => ({ ...prev, reference: formatted }));
    setReferenceError(null);
  };

  const toggleNewRef = () => {
    setShowNewRef(!showNewRef);
    setForm((prev) => ({ ...prev, reference: "" }));
  };

  const handleReferenceNumChange = (value: string) => {
    setForm((prev) => ({ ...prev, referenceNum: value }));
    setReferenceNumError(null);
  };

  // --- LOGIQUE IMAGE ---
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    if (e.target) e.target.value = "";
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleImageFile = async (file: File) => {
    setImageError(null);

    if (!file.type.startsWith("image/")) {
      setImageError("Veuillez sélectionner une image valide.");
      return;
    }

    setIsCompressing(true);
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setTempImage(base64);
        setShowCropper(true);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error(err);
      setImageError("Erreur lors de la compression de l'image.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleEditImage = async () => {
    // Si on veut recadrer l'image déjà présente (URL ou Base64)
    if (imagePreview) {
      setIsLoadingImage(true);
      try {
        // Si c'est une URL externe, on doit s'assurer de pouvoir la charger dans un canvas (CORS)
        // La fonction getCroppedImg le fait déjà en partie via createImage
        setTempImage(imagePreview);
        setShowCropper(true);
      } catch (e) {
        console.error(e);
        setImageError("Impossible de charger l'image pour édition.");
      } finally {
        setIsLoadingImage(false);
      }
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleApplyCrop = async () => {
    if (!tempImage || !croppedAreaPixels) return;
    setIsCompressing(true);
    try {
      const croppedImage = await getCroppedImg(tempImage, croppedAreaPixels, rotation);
      setImageBase64(croppedImage);
      setImagePreview(croppedImage);
      resetCropper();
    } catch (err) {
      console.error(err);
      setImageError("Erreur lors du recadrage.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCancelCrop = () => {
    resetCropper();
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setForm((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleClickUpload = () => fileInputRef.current?.click();
  const handleClickCamera = () => cameraInputRef.current?.click();

  // --- SAUVEGARDE ---
  // --- SAUVEGARDE AVEC DEBUG ---
  const handleSave = async () => {
    console.log("--- DÉBUT SAUVEGARDE ---");
    console.log("1. Nom:", form.nom);
    console.log("2. Image existante (form.imageUrl):", form.imageUrl);
    console.log("3. Nouvelle image à uploader (imageBase64):", imageBase64 ? "OUI (taille: " + imageBase64.length + ")" : "NON");

    if (!form.nom) {
        console.error("Nom manquant");
        return;
    }
    setIsLoading(true);

    try {
      let finalImageUrl = form.imageUrl;

      // Si on a une image locale (nouvelle ou modifiée)
      if (imageBase64) {
        console.log("4. Tentative d'upload vers Cloudinary...");
        finalImageUrl = await uploadToCloudinary(imageBase64);
        console.log("5. SUCCÈS CLOUDINARY ! URL reçue :", finalImageUrl);
      } else {
        console.log("4. Pas de nouvelle image, on garde l'ancienne ou vide.");
      }

      const payload = { ...form, imageUrl: finalImageUrl };
      console.log("6. Payload envoyé à Firebase :", payload);

      if (materiel?.id) {
        await updateMateriel(materiel.id, payload);
      } else {
        await addMateriel(payload);
      }

      console.log("7. Sauvegarde Firebase terminée");
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error("ERREUR FATALE PENDANT LA SAUVEGARDE :", err);
      setImageError("Erreur lors de l'enregistrement.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => !!form.nom && !isCompressing && !isLoading;

  return (
    <>
      {/* DIALOG PRINCIPAL */}
      <Dialog
        open={open && !showCropper}
        onClose={!isLoading ? onClose : undefined}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            borderRadius: { xs: 2, sm: 4 },
            m: { xs: 2, sm: 4 },
            width: { xs: "100%", sm: "600px" },
          },
        }}
      >
        {/* En-tête */}
        <Box
          sx={{
            background:
              "linear-gradient(135deg, #818660 0%, #cdd1b3ff 50%, #6b7052 100%)",
            position: "relative",
            overflow: "hidden",
            py: { xs: 3, sm: 5 },
            px: 3,
          }}
        >
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
          <IconButton
            onClick={onClose}
            disabled={isLoading}
            sx={{ position: "absolute", right: 12, top: 12, color: "white" }}
          >
            <Close />
          </IconButton>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}
            >
              <Inventory2 />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700} color="white">
                {materiel ? "Modifier le matériel" : "Nouveau matériel"}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                Gestion des équipements
              </Typography>
            </Box>
          </Box>
        </Box>

        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Grid container spacing={2}>
            {/* SECTION IMAGE */}
            <Grid item xs={12} md={4}>
              <Paper
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{
                  border: "2px dashed",
                  borderColor: isDragOver ? "primary.main" : "divider",
                  borderRadius: 3,
                  p: 2,
                  textAlign: "center",
                  transition: "border-color 0.3s",
                  minHeight: 110,
                  maxHeight: 110,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isDragOver ? "action.hover" : "background.paper",
                }}
              >
                {isCompressing || isLoadingImage ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <CircularProgress size={40} sx={{ mb: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      {isLoadingImage ? "Chargement..." : "Traitement..."}
                    </Typography>
                  </Box>
                ) : imagePreview ? (
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      minHeight: 90,
                      maxHeight: 90,
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        display: "flex",
                        bgcolor: "rgba(255,255,255,0.95)",
                        borderRadius: 1,
                        p: 0.3,
                        boxShadow: 2,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={handleEditImage}
                        color="primary"
                        title="Recadrer / Rotation"
                        disabled={isLoadingImage}
                      >
                        <Crop fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={handleClickUpload}
                        color="primary"
                        title="Changer l'image"
                      >
                        <CloudUpload fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={handleClickCamera}
                        color="primary"
                        title="Prendre une photo"
                      >
                        <CameraAlt fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={handleRemoveImage}
                        color="error"
                        title="Supprimer"
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Box>
                    {isGoogleDriveImage && (
                      <Typography
                        variant="caption"
                        sx={{
                          position: "absolute",
                          bottom: 4,
                          left: 4,
                          bgcolor: "rgba(0,0,0,0.6)",
                          color: "white",
                          px: 0.5,
                          borderRadius: 0.5,
                          fontSize: "0.6rem",
                        }}
                      >
                        Google Drive
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Stack spacing={0.5}>
                    <Stack
                      direction="row"
                      spacing={2}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <IconButton
                        color="primary"
                        onClick={handleClickUpload}
                        sx={{ flexDirection: "column" }}
                        size="small"
                      >
                        <CloudUpload sx={{ fontSize: 28 }} />
                        <Typography variant="caption" fontSize="0.65rem">
                          Fichier
                        </Typography>
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={handleClickCamera}
                        sx={{ flexDirection: "column" }}
                        size="small"
                      >
                        <CameraAlt sx={{ fontSize: 28 }} />
                        <Typography variant="caption" fontSize="0.65rem">
                          Caméra
                        </Typography>
                      </IconButton>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                      Glissez une image ici
                    </Typography>
                  </Stack>
                )}
                {imageError && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {imageError}
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* DESCRIPTION */}
            <Grid item xs={12} md={8}>
              <TextField
                label="Description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                multiline
                rows={3.5}
                fullWidth
                placeholder="Caractéristiques, numéro de série..."
              />
            </Grid>

            {/* NOM & QUANTITÉ */}
            <Grid item xs={12} sm={8} md={9}>
              <TextField
                label="Nom du matériel"
                value={form.nom}
                onChange={(e) => handleChange("nom", e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                label="Quantité"
                type="number"
                value={form.quantites}
                onChange={(e) =>
                  handleChange("quantites", Math.max(1, Number(e.target.value)))
                }
                fullWidth
                required
                inputProps={{ min: 1 }}
              />
            </Grid>

            {/* CATÉGORIE (mappé sur le champ commentaire selon votre code) */}
            <Grid item xs={12}>
              {showNewCat || categorie.length === 0 ? (
                <TextField
                  label="Nouvelle Catégorie"
                  value={form.comentaire}
                  onChange={(e) => handleChange("comentaire", e.target.value)}
                  InputProps={{
                    endAdornment: categorie.length > 0 && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowNewCat(false)}
                        >
                          <Clear fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                />
              ) : (
                <TextField
                  select
                  label="Catégorie"
                  value={form.comentaire}
                  onChange={(e) => handleChange("comentaire", e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          sx={{ mr: 1 }}
                          onClick={() => setShowNewCat(true)}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        style: {
                          maxHeight: "150px",
                          overflowY: "auto",
                        },
                      },
                    },
                  }}
                >
                  {categorie.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Grid>

            {/* RÉFÉRENCE */}
            <Grid item xs={8}>
              {showNewRef || references.length === 0 ? (
                <TextField
                  label="Nouvelle Réference"
                  value={form.reference.replace(/^T-T/, "")}
                  onChange={(e) => handleNewReferenceChange(e.target.value)}
                  error={!!referenceError}
                  helperText={referenceError}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">T-T</InputAdornment>
                    ),
                    endAdornment: references.length > 0 && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={toggleNewRef}>
                          <Clear fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                  FormHelperTextProps={{
                    sx: {
                      position: "absolute",
                      bottom: -20,
                      fontSize: "0.7rem",
                    },
                  }}
                />
              ) : (
                <TextField
                  select
                  label="Réference"
                  value={form.reference}
                  onChange={(e) => handleReferenceSelectChange(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          sx={{ mr: 1 }}
                          onClick={toggleNewRef}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        style: {
                          maxHeight: "150px",
                          overflowY: "auto",
                        },
                      },
                    },
                  }}
                >
                  {references.map((ref) => (
                    <MenuItem key={ref} value={ref}>
                      {ref}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Grid>

            {/* RÉFÉRENCE NUM */}
            <Grid item xs={4}>
              <TextField
                label="Suffixe"
                value={form.referenceNum}
                onChange={(e) => handleReferenceNumChange(e.target.value)}
                disabled={!form.reference}
                error={!!referenceNumError}
                helperText={
                  referenceNumError ||
                  (form.reference && !form.referenceNum ? "Requis" : "")
                }
                fullWidth
                placeholder="Ex: 001, A"
                FormHelperTextProps={{
                  sx: {
                    position: "absolute",
                    bottom: -20,
                    fontSize: "0.7rem",
                  },
                }}
              />
            </Grid>

            {/* STATUT */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={form.statut}
                  label="Statut"
                  onChange={(e) => handleChange("statut", e.target.value)}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: "150px",
                        overflowY: "auto",
                      },
                    },
                  }}
                >
                  <MenuItem value="disponible">Disponible</MenuItem>
                  <MenuItem value="en utilisation">En utilisation</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        {/* Inputs cachés */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          style={{ display: "none" }}
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleFileInputChange}
          style={{ display: "none" }}
        />

        <DialogActions
          sx={{
            p: { xs: 2, sm: 3 },
            flexDirection: { xs: "column-reverse", sm: "row" },
            gap: 1,
          }}
        >
          <Button
            onClick={onClose}
            disabled={isLoading}
            variant="outlined"
            fullWidth
            sx={{ width: { sm: "auto" } }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!isFormValid()}
            startIcon={isLoading ? null : <Done />}
            sx={{ minWidth: 120, width: { xs: "100%", sm: "auto" } }}
          >
            {isLoading || isCompressing ? (
              <CircularProgress size={20} color="inherit" />
            ) : materiel ? (
              "Sauvegarder"
            ) : (
              "Créer"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG CROPPER */}
      <Dialog
        open={showCropper}
        onClose={handleCancelCrop}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            m: { xs: 1, sm: 2 },
          },
        }}
      >
        <Box
          sx={{
            background:
              "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
            position: "relative",
            overflow: "hidden",
            py: 2,
            px: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
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
          <Typography variant="h6" color="white" fontWeight={600}>
            ✂️ Recadrer & Rotation
          </Typography>
          <IconButton onClick={handleCancelCrop} sx={{ color: "white" }}>
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0, bgcolor: "#1a1a2e" }}>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: { xs: 280, sm: 350, md: 400 },
              bgcolor: "#16213e",
            }}
          >
            {tempImage && (
              <Cropper
                image={tempImage}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            )}
          </Box>

          <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#0f0f23" }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography
                  color="white"
                  variant="subtitle2"
                  sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}
                >
                  📐 Format
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ flexWrap: "wrap", gap: 1, "& > *": { flexShrink: 0 } }}
                >
                  {aspectRatioOptions.map((option) => (
                    <Button
                      key={option.label}
                      variant={aspectRatio === option.value ? "contained" : "outlined"}
                      size="small"
                      startIcon={option.icon}
                      onClick={() => setAspectRatio(option.value)}
                      sx={{
                        color:
                          aspectRatio === option.value
                            ? "white"
                            : "rgba(255,255,255,0.7)",
                        borderColor: "rgba(255,255,255,0.3)",
                        background:
                          aspectRatio === option.value
                            ? "linear-gradient(135deg, #818660 0%, #d0d3c2ff 50%, #6b7052 100%)"
                            : "transparent",
                        "&:hover": {
                          borderColor: "white",
                          bgcolor: "rgba(255,255,255,0.1)",
                        },
                        minWidth: { xs: 70, sm: 90 },
                        px: { xs: 1, sm: 2 },
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 1 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <ZoomIn sx={{ color: "white", fontSize: 20 }} />
                  <Typography color="white" variant="body2" sx={{ minWidth: 45 }}>
                    Zoom
                  </Typography>
                  <Slider
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(_, value) => setZoom(value as number)}
                    sx={{
                      color: "#818660",
                      "& .MuiSlider-thumb": { bgcolor: "white", width: 16, height: 16 },
                      "& .MuiSlider-track": { height: 4 },
                      "& .MuiSlider-rail": { height: 4, bgcolor: "rgba(255,255,255,0.2)" },
                    }}
                  />
                  <Typography color="white" variant="body2" sx={{ minWidth: 40, textAlign: "right" }}>
                    {zoom.toFixed(1)}x
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton
                      onClick={() => setRotation((r) => r - 90)}
                      size="small"
                      sx={{
                        color: "white",
                        bgcolor: "rgba(255,255,255,0.1)",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                        width: 32,
                        height: 32,
                      }}
                    >
                      <RotateLeft fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => setRotation((r) => r + 90)}
                      size="small"
                      sx={{
                        color: "white",
                        bgcolor: "rgba(255,255,255,0.1)",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                        width: 32,
                        height: 32,
                      }}
                    >
                      <RotateRight fontSize="small" />
                    </IconButton>
                  </Box>
                  <Slider
                    value={rotation}
                    min={-180}
                    max={180}
                    step={1}
                    onChange={(_, value) => setRotation(value as number)}
                    sx={{
                      color: "#9ba17b",
                      "& .MuiSlider-thumb": { bgcolor: "white", width: 16, height: 16 },
                      "& .MuiSlider-track": { height: 4 },
                      "& .MuiSlider-rail": { height: 4, bgcolor: "rgba(255,255,255,0.2)" },
                    }}
                  />
                  <Typography color="white" variant="body2" sx={{ minWidth: 40, textAlign: "right" }}>
                    {rotation}°
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Button
                  size="small"
                  startIcon={<Refresh fontSize="small" />}
                  onClick={resetCropperControls}
                  sx={{
                    color: "rgba(255,255,255,0.6)",
                    "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.1)" },
                  }}
                >
                  Réinitialiser
                </Button>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            bgcolor: "#0f0f23",
            gap: 2,
            flexDirection: { xs: "column-reverse", sm: "row" },
          }}
        >
          <Button
            onClick={handleCancelCrop}
            variant="outlined"
            fullWidth
            sx={{
              color: "white",
              borderColor: "rgba(255,255,255,0.3)",
              "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.05)" },
              width: { sm: "auto" },
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleApplyCrop}
            variant="contained"
            fullWidth
            startIcon={
              isCompressing ? <CircularProgress size={16} color="inherit" /> : <Check />
            }
            disabled={isCompressing || !croppedAreaPixels}
            sx={{
              background: "linear-gradient(135deg, #818660 0%, #dadcd3ff 50%, #6b7052 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #dadcd3ff 0%, #9ba17b 50%, #6b7052 100%)",
              },
              "&:disabled": { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" },
              width: { sm: "auto" },
              minWidth: 140,
            }}
          >
            {isCompressing ? "Traitement..." : "Appliquer"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MaterielFormModal;