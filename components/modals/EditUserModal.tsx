import React, { useState, useEffect } from "react";
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
  Avatar,
  IconButton,
  Typography,
  Paper,
  Slide,
} from "@mui/material";
import { Edit, Close } from "@mui/icons-material";
import { TransitionProps } from "@mui/material/transitions";

// 🔥 Firebase
import { db } from "../../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface User {
  id: string;
  nom: string;
  email: string;
  role: string;
}

interface EditUserModalProps {
  open: boolean;
  user: User;
  onClose: () => void;
  onSave: (user: User) => void;
}

// Transition pour le Dialog
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EditUserModal: React.FC<EditUserModalProps> = ({
  open,
  user,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState({
    id: user.id,
    nom: user.nom,
    email: user.email,
    role: user.role,
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Ré-initialiser le formulaire quand l'user ou l'ouverture du modal change
  useEffect(() => {
    if (user) {
      setForm({
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        password: "",
      });
      setError("");
    }
  }, [user, open]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const save = async () => {
    if (!form.id || !form.nom || !form.email || !form.role) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const userRef = doc(db, "users", form.id);

      const payload: any = {
        nom: form.nom,
        email: form.email,
        role: form.role,
      };

      // Ne mettre à jour le mot de passe que s'il a été saisi
      if (form.password) {
        payload.password = form.password; // ⚠️ à hasher côté back si prod
      }

      await updateDoc(userRef, payload);

      const updatedUser: User = {
        id: form.id,
        nom: form.nom,
        email: form.email,
        role: form.role,
      };

      // Notifier le parent + fermer
      onSave(updatedUser);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la mise à jour de l'utilisateur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!isLoading ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: 6,
        },
      }}
    >
      {/* HEADER AVEC GRADIENT */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
          position: "relative",
          overflow: "hidden",
          py: 3,
          px: 3,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 260,
            height: 260,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.08)",
            top: -80,
            right: -40,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 130,
            height: 130,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.06)",
            bottom: -30,
            left: "25%",
          }}
        />

        <IconButton
          onClick={onClose}
          disabled={isLoading}
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
            color: "white",
            bgcolor: "rgba(0,0,0,0.18)",
            "&:hover": {
              bgcolor: "rgba(0,0,0,0.28)",
            },
          }}
        >
          <Close />
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: "rgba(255,255,255,0.25)",
              width: 52,
              height: 52,
              boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
            }}
          >
            <Edit />
          </Avatar>

          <Box>
            <Typography variant="h6" fontWeight={700} color="white">
              Modifier l'utilisateur
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.85)">
              Mise à jour des informations du compte
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* CONTENU */}
      <DialogContent
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === "light" ? "grey.50" : "background.default",
          p: 3,
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Nom"
              value={form.nom}
              onChange={(e) => handleChange("nom", e.target.value)}
              fullWidth
            />

            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              fullWidth
            />

            <TextField
              label="Nouveau mot de passe (optionnel)"
              type="password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              fullWidth
              helperText="Laissez vide pour garder l'ancien mot de passe"
            />

            <FormControl fullWidth>
              <InputLabel>Rôle</InputLabel>
              <Select
                value={form.role}
                label="Rôle"
                onChange={(e) => handleChange("role", e.target.value)}
              >
                <MenuItem value="employer">Employé</MenuItem>
                <MenuItem value="admin">Administrateur</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>
      </DialogContent>

      {/* ACTIONS */}
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={onClose} disabled={isLoading} variant="outlined">
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={isLoading}
          startIcon={!isLoading ? <Edit /> : undefined}
          sx={{ minWidth: 130 }}
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Sauvegarder"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserModal;