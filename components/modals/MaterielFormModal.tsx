"use client";

// ============================================
// IMPORTS
// ============================================
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
} from "react";
import imageCompression from "browser-image-compression";
import Cropper, { Area } from "react-easy-crop";

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
import { useData, Materiel as MaterielType } from "@/context/DataContext";

// ============================================
// CONSTANTES & UTILITAIRES
// ============================================

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Options de compression (rapide et léger pour accélérer l'upload final)
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.2,
  maxWidthOrHeight: 1024,
  useWebWorker: true,
  fileType: "image/webp",
  initialQuality: 0.7,
} as const;

const aspectRatioOptions = [
  { label: "Libre", value: undefined as number | undefined, icon: <CropFree fontSize="small" /> },
  { label: "1:1", value: 1, icon: <CropSquare fontSize="small" /> },
  { label: "16:9", value: 16 / 9, icon: <CropLandscape fontSize="small" /> },
  { label: "4:3", value: 4 / 3, icon: <CropPortrait fontSize="small" /> },
];

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.crossOrigin = "anonymous";
    image.src = url;
  });

const getRadianAngle = (degreeValue: number) => (degreeValue * Math.PI) / 180;

const rotateSize = (width: number, height: number, rotation: number) => {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

async function getCroppedImgBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  quality = 0.75,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas ctx error");

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

  canvas.width = Math.floor(bBoxWidth);
  canvas.height = Math.floor(bBoxHeight);

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");
  if (!croppedCtx) throw new Error("Cropped ctx error");

  croppedCanvas.width = Math.floor(pixelCrop.width);
  croppedCanvas.height = Math.floor(pixelCrop.height);

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob error"))),
      "image/webp",
      quality,
    );
  });
}

// ============================================
// CLOUDINARY
// ============================================

type CloudinaryUploadResult = {
  imageUrl: string;
  imagePublicId: string;
};

const uploadToCloudinary = async (blob: Blob): Promise<CloudinaryUploadResult> => {
  try {
    const formData = new FormData();
    formData.append("file", blob, "image.webp");
    formData.append("upload_preset", "not_signed");
    formData.append("folder", "materiels");

    const cloudName = "dmvsypdvu";
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const response = await fetch(url, { method: "POST", body: formData });

    if (!response.ok) {
      throw new Error("Échec de l'upload");
    }

    const data = await response.json();
    
    return {
      imageUrl: data.secure_url,
      imagePublicId: data.public_id,
    };
  } catch (error: any) {
    console.error("❌ Erreur Cloudinary:", error.message);
    throw new Error("Échec de l'upload de l'image");
  }
};

const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  if (!publicId) return;
  console.log("🗑️ Suppression Cloudinary:", publicId);
  fetch("/api/cloudinary/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId }),
  }).catch(console.error);
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

const MaterielFormModal: React.FC<Props> = ({
  open,
  materiel,
  onClose,
  onSaved,
}) => {
  const { addMateriel, updateMateriel, categorie, references, materiels } = useData();

  // FORM
  const [form, setForm] = useState<MaterielType>({
    id: "",
    nom: "",
    quantites: 1,
    reference: "",
    referenceNum: "",
    description: "",
    statut: "disponible",
    comentaire: "",
    imageUrl: "",
    imagePublicId: "",
  });

  // UI
  const [isLoading, setIsLoading] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [showNewRef, setShowNewRef] = useState(false);

  // Validation
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [referenceNumError, setReferenceNumError] = useState<string | null>(null);

  // IMAGE
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // CROPPER
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(1);

  const [existingCount, setExistingCount] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isGoogleDriveImage = imagePreview?.includes("drive.google.com");

  // Cleanup
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
      if (tempImageUrl?.startsWith("blob:")) URL.revokeObjectURL(tempImageUrl);
    };
  }, [imagePreview, tempImageUrl]);

  // Init form
  useEffect(() => {
    if (!open) return;

    if (materiel) {
      setForm(materiel);
      setImagePreview(materiel.imageUrl || null);
      setImageBlob(null);
      setImageRemoved(false);
      setReferenceError(null);
      setReferenceNumError(null);
      setImageError(null);
    } else {
      resetForm();
    }
  }, [open, materiel]);

  const resetForm = () => {
    setForm({
      id: "",
      nom: "",
      quantites: 1,
      reference: "",
      referenceNum: "",
      description: "",
      statut: "disponible",
      comentaire: "",
      imageUrl: "",
      imagePublicId: "",
    });

    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    if (tempImageUrl?.startsWith("blob:")) URL.revokeObjectURL(tempImageUrl);

    setImagePreview(null);
    setImageBlob(null);
    setImageRemoved(false);
    setShowNewCat(false);
    setShowNewRef(false);
    setReferenceError(null);
    setReferenceNumError(null);
    setImageError(null);
    setExistingCount(0);
    resetCropper();
  };

  const resetCropper = () => {
    if (tempImageUrl?.startsWith("blob:")) URL.revokeObjectURL(tempImageUrl);
    setShowCropper(false);
    setTempImageUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setAspectRatio(1);
  };

  const handleChange = (field: keyof MaterielType, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const getNextSuffixForReference = useCallback(
    (reference: string): string => {
      if (!reference || !materiels || materiels.length === 0) return "1";
      const related = materiels.filter((m) => m.reference === reference && m.id !== materiel?.id);
      if (related.length === 0) return "1";
      const nums = related
        .map((m) => {
          const match = m.referenceNum?.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter((n) => n > 0);
      return nums.length ? String(Math.max(...nums) + 1) : "1";
    },
    [materiels, materiel?.id],
  );

  const handleReferenceSelectChange = (value: string) => {
    setForm((prev) => ({ ...prev, reference: value }));
    if (value && materiels) {
      const count = materiels.filter((m) => m.reference === value && m.id !== materiel?.id).length;
      setExistingCount(count);
      const next = getNextSuffixForReference(value);
      setForm((prev) => ({ ...prev, referenceNum: next }));
    } else {
      setExistingCount(0);
      setForm((prev) => ({ ...prev, referenceNum: "" }));
    }
  };

  const handleNewReferenceChange = (value: string) => {
    const formatted = value.startsWith("T-T") ? value : `T-T${value}`;
    setForm((prev) => ({ ...prev, reference: formatted }));
    setReferenceError(null);
    const next = getNextSuffixForReference(formatted);
    setForm((prev) => ({ ...prev, referenceNum: next }));
  };

  const toggleNewRef = () => {
    setShowNewRef((v) => !v);
    setForm((prev) => ({ ...prev, reference: "", referenceNum: "" }));
  };

  const handleReferenceNumChange = (value: string) => {
    const sanitized = value.replace(/[^a-zA-Z0-9]/g, "");
    handleChange("referenceNum", sanitized);
  };

  // IMAGE HANDLERS
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleImageFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleImageFile(file);
  };

  const handleImageFile = async (file: File) => {
    setImageError(null);
    if (!file.type.startsWith("image/")) {
      setImageError("Image invalide.");
      return;
    }

    setIsCompressing(true);
    
    try {
      const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
      if (tempImageUrl?.startsWith("blob:")) URL.revokeObjectURL(tempImageUrl);
      const url = URL.createObjectURL(compressed);
      setTempImageUrl(url);
      setShowCropper(true);
    } catch (err) {
      console.error(err);
      setImageError("Erreur compression.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleEditImage = async () => {
    if (!imagePreview) return;
    setIsLoadingImage(true);
    try {
      if (tempImageUrl?.startsWith("blob:")) URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl(imagePreview);
      setShowCropper(true);
    } catch (e) {
      console.error(e);
      setImageError("Erreur chargement.");
    } finally {
      setIsLoadingImage(false);
    }
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // APPLY CROP - Ne fait PLUS l'upload, prépare juste le blob
  const handleApplyCrop = async () => {
    if (!tempImageUrl || !croppedAreaPixels) return;

    setIsCompressing(true);
    try {
      const croppedBlob = await getCroppedImgBlob(tempImageUrl, croppedAreaPixels, rotation);

      // Preview local instantané
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
      const previewUrl = URL.createObjectURL(croppedBlob);
      
      setImageBlob(croppedBlob); // On stocke le blob pour le save
      setImagePreview(previewUrl);
      setImageRemoved(false);

      resetCropper();
    } catch (err) {
      console.error(err);
      setImageError("Erreur recadrage.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCancelCrop = () => resetCropper();

  const handleRemoveImage = () => {
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageBlob(null);
    setImageRemoved(true);
  };

  const handleClickUpload = () => fileInputRef.current?.click();
  const handleClickCamera = () => cameraInputRef.current?.click();

  // --------------------------------------------
  // SAVE - C'est ici que l'upload se fait !
  // --------------------------------------------
  const handleSave = async () => {
    if (!form.nom) return;
    setIsLoading(true);

    try {
      let finalImageUrl = form.imageUrl || "";
      let finalImagePublicId = form.imagePublicId || "";
      const oldPublicId = materiel?.imagePublicId || form.imagePublicId;

      if (imageRemoved) {
        // Cas 1 : Suppression explicite
        console.log("🚫 Image supprimée");
        finalImageUrl = "";
        finalImagePublicId = "";
        
        // Supprimer l'ancienne image de Cloudinary
        if (oldPublicId) {
          deleteFromCloudinary(oldPublicId);
        }
      } 
      else if (imageBlob) {
        // Cas 2 : Nouvelle image (blob) en attente d'upload
        console.log("📤 Upload vers Cloudinary...");
        
        // C'est ici qu'on upload maintenant
        const uploadResult = await uploadToCloudinary(imageBlob);
        
        finalImageUrl = uploadResult.imageUrl;
        finalImagePublicId = uploadResult.imagePublicId;

        console.log("✅ Upload terminé");

        // Supprimer l'ancienne image si on en a mis une nouvelle
        if (oldPublicId && oldPublicId !== finalImagePublicId) {
          deleteFromCloudinary(oldPublicId);
        }
      }
      // Cas 3 : Pas de changement d'image, on garde les valeurs du form (initiales)

      // Payload final
      const payload: MaterielType = {
        ...form,
        imageUrl: finalImageUrl,
        imagePublicId: finalImagePublicId,
      };

      console.log("💾 Sauvegarde dans Firebase...", payload);

      if (materiel?.id) {
        await updateMateriel(materiel.id, payload);
      } else {
        await addMateriel(payload);
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error("❌ ERREUR SAUVEGARDE:", err);
      setImageError("Erreur lors de la sauvegarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => !!form.nom && !isCompressing && !isLoading;

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
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
        <Box
          sx={{
            background: "linear-gradient(135deg, #818660 0%, #cdd1b3ff 50%, #6b7052 100%)",
            position: "relative",
            overflow: "hidden",
            py: { xs: 3, sm: 5 },
            px: 3,
          }}
        >
          <IconButton
            onClick={onClose}
            disabled={isLoading}
            sx={{ position: "absolute", right: 12, top: 12, color: "white" }}
          >
            <Close />
          </IconButton>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}>
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
            {/* Image */}
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
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <CircularProgress size={40} sx={{ mb: 1 }} />
                    <Typography variant="caption" color="text.secondary">Traitement...</Typography>
                  </Box>
                ) : imagePreview ? (
                  <Box sx={{ position: "relative", width: "100%", minHeight: 90, maxHeight: 90, borderRadius: 2, overflow: "hidden" }}>
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />

                    <Box sx={{ position: "absolute", top: 4, right: 4, display: "flex", bgcolor: "rgba(255,255,255,0.95)", borderRadius: 1, p: 0.3, boxShadow: 2 }}>
                      <IconButton size="small" onClick={handleEditImage} color="primary"><Crop fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={handleClickUpload} color="primary"><CloudUpload fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={handleClickCamera} color="primary"><CameraAlt fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={handleRemoveImage} color="error"><DeleteOutline fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                ) : (
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
                      <IconButton color="primary" onClick={handleClickUpload} sx={{ flexDirection: "column" }} size="small">
                        <CloudUpload sx={{ fontSize: 28 }} />
                        <Typography variant="caption" fontSize="0.65rem">Fichier</Typography>
                      </IconButton>
                      <IconButton color="primary" onClick={handleClickCamera} sx={{ flexDirection: "column" }} size="small">
                        <CameraAlt sx={{ fontSize: 28 }} />
                        <Typography variant="caption" fontSize="0.65rem">Caméra</Typography>
                      </IconButton>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" fontSize="0.65rem">Glissez une image ici</Typography>
                  </Stack>
                )}
                {imageError && <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>{imageError}</Typography>}
              </Paper>
            </Grid>

            {/* Description */}
            <Grid item xs={12} md={8}>
              <TextField
                label="Description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                multiline
                rows={3.5}
                fullWidth
                placeholder="Caractéristiques..."
              />
            </Grid>

            {/* Nom & Qté */}
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
                onChange={(e) => handleChange("quantites", Math.max(1, Number(e.target.value)))}
                fullWidth
                required
                inputProps={{ min: 1 }}
              />
            </Grid>

            {/* Catégorie */}
            <Grid item xs={12}>
              {showNewCat || categorie.length === 0 ? (
                <TextField
                  label="Nouvelle Catégorie"
                  value={form.comentaire}
                  onChange={(e) => handleChange("comentaire", e.target.value)}
                  InputProps={{
                    endAdornment: categorie.length > 0 && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowNewCat(false)}><Clear fontSize="small" /></IconButton>
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
                        <IconButton size="small" sx={{ mr: 1 }} onClick={() => setShowNewCat(true)}><Add fontSize="small" /></IconButton>
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                  SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 150 } } } }}
                >
                  {categorie.map((cat) => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                </TextField>
              )}
            </Grid>

            {/* Référence */}
            <Grid item xs={8}>
              {showNewRef || references.length === 0 ? (
                <TextField
                  label="Nouvelle Réference"
                  value={form.reference.replace(/^T-T/, "")}
                  onChange={(e) => handleNewReferenceChange(e.target.value)}
                  error={!!referenceError}
                  helperText={referenceError}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">T-T</InputAdornment>,
                    endAdornment: references.length > 0 && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={toggleNewRef}><Clear fontSize="small" /></IconButton>
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
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
                        <IconButton size="small" sx={{ mr: 1 }} onClick={toggleNewRef}><Add fontSize="small" /></IconButton>
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                  SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 150 } } } }}
                >
                  {references.map((ref) => <MenuItem key={ref} value={ref}>{ref}</MenuItem>)}
                </TextField>
              )}
            </Grid>

            {/* Suffixe */}
            <Grid item xs={4}>
              <TextField
                label="Suffixe"
                value={form.referenceNum}
                onChange={(e) => handleReferenceNumChange(e.target.value)}
                disabled={!form.reference}
                error={!!referenceNumError}
                helperText={referenceNumError || (form.reference && !form.referenceNum ? "Requis" : "")}
                fullWidth
              />
            </Grid>

            {/* Statut */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={form.statut}
                  label="Statut"
                  onChange={(e) => handleChange("statut", e.target.value)}
                  MenuProps={{ PaperProps: { style: { maxHeight: 150 } } }}
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
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileInputChange} style={{ display: "none" }} />
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileInputChange} style={{ display: "none" }} />

        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: "column-reverse", sm: "row" }, gap: 1 }}>
          <Button onClick={onClose} disabled={isLoading} variant="outlined" fullWidth sx={{ width: { sm: "auto" } }}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!isFormValid()}
            startIcon={isLoading ? null : <Done />}
            sx={{ minWidth: 120, width: { xs: "100%", sm: "auto" } }}
          >
            {isLoading ? <CircularProgress size={20} color="inherit" /> : materiel ? "Sauvegarder" : "Créer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CROPPER */}
      <Dialog
        open={showCropper}
        onClose={handleCancelCrop}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", m: { xs: 1, sm: 2 } } }}
      >
        <Box sx={{ background: "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)", py: 2, px: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6" color="white" fontWeight={600}>Recadrer & Rotation</Typography>
          <IconButton onClick={handleCancelCrop} sx={{ color: "white" }}><Close /></IconButton>
        </Box>

        <DialogContent sx={{ p: 0, bgcolor: "#1a1a2e" }}>
          <Box sx={{ position: "relative", width: "100%", height: { xs: 280, sm: 350, md: 400 }, bgcolor: "#16213e" }}>
            {tempImageUrl && (
              <Cropper
                image={tempImageUrl}
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

          <Box sx={{ p: 2, bgcolor: "#0f0f23" }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                  {aspectRatioOptions.map((opt) => (
                    <Button
                      key={opt.label}
                      variant={aspectRatio === opt.value ? "contained" : "outlined"}
                      size="small"
                      startIcon={opt.icon}
                      onClick={() => setAspectRatio(opt.value)}
                      sx={{
                        color: aspectRatio === opt.value ? "white" : "rgba(255,255,255,0.7)",
                        borderColor: "rgba(255,255,255,0.3)",
                        background: aspectRatio === opt.value ? "#818660" : "transparent",
                      }}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </Stack>
              </Grid>

              <Grid item xs={12}><Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 1 }} /></Grid>

              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <ZoomIn sx={{ color: "white", fontSize: 20 }} />
                  <Slider value={zoom} min={1} max={3} step={0.1} onChange={(_, v) => setZoom(v as number)} />
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton onClick={() => setRotation((r) => r - 90)} size="small" sx={{ color: "white" }}><RotateLeft fontSize="small" /></IconButton>
                  <IconButton onClick={() => setRotation((r) => r + 90)} size="small" sx={{ color: "white" }}><RotateRight fontSize="small" /></IconButton>
                  <Slider value={rotation} min={-180} max={180} step={1} onChange={(_, v) => setRotation(v as number)} />
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: "#0f0f23", gap: 2, flexDirection: { xs: "column-reverse", sm: "row" } }}>
          <Button onClick={handleCancelCrop} variant="outlined" fullWidth sx={{ color: "white", borderColor: "rgba(255,255,255,0.3)", width: { sm: "auto" } }}>
            Annuler
          </Button>
          <Button
            onClick={handleApplyCrop}
            variant="contained"
            fullWidth
            startIcon={isCompressing ? <CircularProgress size={16} color="inherit" /> : <Check />}
            disabled={isCompressing || !croppedAreaPixels}
            sx={{ background: "#818660", width: { sm: "auto" }, minWidth: 140 }}
          >
            {isCompressing ? "Traitement..." : "Appliquer"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MaterielFormModal;