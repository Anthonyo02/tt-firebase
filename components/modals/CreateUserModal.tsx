"use client";

import React, { useState } from "react";
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
  Alert,
  CircularProgress,
  Box,
  IconButton,
  InputAdornment,
  Fade,
  Slide,
  Typography,
  Chip,
  Avatar,
} from "@mui/material";
import {
  PersonAdd,
  Close,
  Email,
  Lock,
  Person,
  AdminPanelSettings,
  Work,
  Visibility,
  VisibilityOff,
  CheckCircle,
} from "@mui/icons-material";
import { TransitionProps } from "@mui/material/transitions";

// 🔥 Import du Contexte
import { useData } from "@/context/DataContext";

/* =======================
   THEME (GLOBAL IDENTITY)
======================= */
const PRIMARY = "#616637";
const PRIMARY_DARK = "#4e522c";
const PRIMARY_LIGHT = "#d9dcc3";
const PRIMARY_SOFT = "#f3f4ed";

/* =======================
   TRANSITION
======================= */
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  setReload: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  open,
  onClose,
  setReload,
}) => {
  // 🔥 Récupération des fonctions du contexte
  const { addUser, fetchUsers } = useData();

  const [form, setForm] = useState({
    id: "",
    nom: "",
    email: "",
    password: "",
    role: "employer",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const isPasswordValid = form.password.length >= 6;
  const doPasswordsMatch = form.password === confirmPassword;
  const isFormValid =
    form.nom.trim() !== "" &&
    isEmailValid &&
    isPasswordValid &&
    doPasswordsMatch &&
    form.role !== "";

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleClose = () => {
    if (!isLoading) {
      setForm({ id: "", nom: "", email: "", password: "", role: "employer" });
      setError("");
      setSuccess(false);
      setConfirmPassword("");
    }
  };

  // 🔥 Logique mise à jour avec LocalForage via Context
  const save = async () => {
    if (!isFormValid) {
      setError("Veuillez remplir correctement tous les champs");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      // 1. Sauvegarde dans Firestore via le Contexte
      const newUserPayload = {
        nom: form.nom,
        email: form.email,
        password: form.password,
        role: form.role,
        // createdAt est géré côté serveur ou dans addUser
      };

      console.log("💾 Ajout de l'utilisateur...");
      await addUser(newUserPayload);
      onClose();
      // 2. SYNCHRONISATION AVEC LOCALFORAGE
      // On force le fetch pour récupérer les données serveur et mettre à jour le cache local
      console.log("🔄 Synchronisation avec LocalForage...");
      await fetchUsers();

      // Succès
      setSuccess(true);
      if (setReload) setReload(); // Notifier le parent si nécessaire

      setTimeout(() => {
        setSuccess(false);
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error("❌ Erreur création user:", err);
      setError("Erreur lors de la création de l'utilisateur : " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!isLoading ? handleClose : undefined}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 30px 60px -15px rgba(0,0,0,0.35)",
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(10px)",
        },
      }}
    >
      {/* =======================
          HEADER
      ======================= */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
          overflow: "hidden",
          px: 3,
          py: 3,
          position: "relative",
          color: "white",
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
          onClick={handleClose}
          disabled={isLoading}
          sx={{
            position: "absolute",
            right: 14,
            top: 14,
            color: "white",
            bgcolor: "rgba(255,255,255,0.15)",
            transition: "all .3s ease",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.25)",
              transform: "rotate(90deg) scale(1.1)",
            },
          }}
        >
          <Close />
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: "rgba(255,255,255,0.2)",
              border: "2px solid rgba(255,255,255,0.35)",
            }}
          >
            <PersonAdd sx={{ fontSize: 28 }} />
          </Avatar>

          <Box>
            <Typography variant="h5" fontWeight={700}>
              Créer un compte
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              Ajouter un nouvel utilisateur
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* =======================
          CONTENT
      ======================= */}
      <DialogContent sx={{ p: 4 }}>
        {/* ERROR */}
        <Fade in={!!error}>
          <Box>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </Fade>

        {/* SUCCESS */}
        <Fade in={success}>
          <Box>
            {success && (
              <Alert
                severity="success"
                icon={<CheckCircle />}
                sx={{ mb: 3, borderRadius: 2 }}
              >
                <Typography fontWeight={600}>
                  Compte créé avec succès 🎉
                </Typography>
              </Alert>
            )}
          </Box>
        </Fade>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            label="Nom complet"
            value={form.nom}
            onChange={(e) => handleChange("nom", e.target.value)}
            fullWidth
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: PRIMARY }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Adresse email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            fullWidth
            disabled={isLoading}
            error={form.email !== "" && !isEmailValid}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: PRIMARY }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Mot de passe"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            fullWidth
            autoComplete="new-password"
            disabled={isLoading}
            helperText={
              form.password && !isPasswordValid ? "Minimum 6 caractères" : ""
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: PRIMARY }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Confirmer le mot de passe"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            autoComplete="new-password"
            disabled={isLoading}
            error={confirmPassword !== "" && !doPasswordsMatch}
            helperText={
              confirmPassword && !doPasswordsMatch
                ? "Les mots de passe ne correspondent pas"
                : ""
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: PRIMARY }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <FormControl fullWidth>
            <InputLabel>Rôle</InputLabel>
            <Select
              value={form.role}
              label="Rôle"
              onChange={(e) => handleChange("role", e.target.value)}
            >
              <MenuItem value="employer">
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Work sx={{ color: "#2e7d32" }} />
                  Employé
                  <Chip label="Standard" size="small" />
                </Box>
              </MenuItem>

              <MenuItem value="admin">
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <AdminPanelSettings sx={{ color: "#d32f2f" }} />
                  Administrateur
                  <Chip label="Full access" size="small" />
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      {/* =======================
          FOOTER
      ======================= */}
      <DialogActions
        sx={{
          p: 3,
          background:
            "linear-gradient(135deg, #818660 0%, #d6d8c5ff 50%, #6b7052 100%)",
        }}
      >
        <Button onClick={handleClose} disabled={isLoading}>
          Annuler
        </Button>

        <Button
          variant="contained"
          onClick={save}
          disabled={isLoading || success || !isFormValid}
          sx={{
            px: 4,
            py: 1.2,
            borderRadius: 2.5,
            fontWeight: 600,
            background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
            },
          }}
        >
          {isLoading ? (
            <CircularProgress size={22} sx={{ color: "white" }} />
          ) : success ? (
            "Créé"
          ) : (
            "Créer le compte"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateUserModal;
