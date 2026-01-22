"use client";

import React, { useEffect, useState } from "react";
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

// 🔥 Firebase Auth
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

// 🔥 Context Firestore
import { useData } from "@/context/DataContext";

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

// Transition
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
  const { updateUser, fetchUsers } = useData();

  const [form, setForm] = useState({
    id: "",
    nom: "",
    email: "",
    role: "",
    oldPassword: "",
    newPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔄 Init
  useEffect(() => {
    if (user && open) {
      setForm({
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        oldPassword: "",
        newPassword: "",
      });
      setError("");
    }
  }, [user, open]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  // 💾 SAVE
  const save = async () => {
    if (!form.nom || !form.role) {
      setError("Veuillez remplir les champs obligatoires.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("Utilisateur non connecté.");
      }

      /* 🔐 CHANGEMENT MOT DE PASSE */
      if (form.oldPassword || form.newPassword) {
        if (!form.oldPassword || !form.newPassword) {
          throw new Error("Les deux mots de passe sont requis.");
        }

        const credential = EmailAuthProvider.credential(
          currentUser.email!,
          form.oldPassword
        );

        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, form.newPassword);
      }

      /* 🗂️ UPDATE FIRESTORE */
      await updateUser(form.id, {
        nom: form.nom,
        role: form.role,
      });

      await fetchUsers();

      onSave({
        id: form.id,
        nom: form.nom,
        email: form.email,
        role: form.role,
      });

      onClose();
    } catch (err: any) {
      console.error(err);

      if (err.code === "auth/wrong-password") {
        setError("Ancien mot de passe incorrect.");
      } else if (err.code === "auth/weak-password") {
        setError("Mot de passe trop faible (6 caractères minimum).");
      } else {
        setError(err.message || "Erreur lors de la mise à jour.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!isLoading ? onClose : undefined}
      fullWidth
      maxWidth="sm"
      TransitionComponent={Transition}
    >
      {/* HEADER */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
          p: 3,
          position: "relative",
        }}
      >
        <IconButton
          onClick={onClose}
          disabled={isLoading}
          sx={{ position: "absolute", top: 8, right: 8, color: "white" }}
        >
          <Close />
        </IconButton>

        <Box display="flex" gap={2} alignItems="center">
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.3)" }}>
            <Edit />
          </Avatar>
          <Box>
            <Typography color="white" fontWeight={700}>
              Modifier le profil
            </Typography>
            <Typography color="rgba(255,255,255,0.8)" variant="body2">
              Informations & sécurité
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* CONTENT */}
      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Nom"
              value={form.nom}
              onChange={(e) => handleChange("nom", e.target.value)}
              fullWidth
            />

            <TextField
              label="Email"
              value={form.email}
              disabled
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Rôle</InputLabel>
              <Select
                value={form.role}
                label="Rôle"
                onChange={(e) => handleChange("role", e.target.value)}
              >
                <MenuItem value="admin">Administrateur</MenuItem>
                <MenuItem value="employer">Employé</MenuItem>
              </Select>
            </FormControl>

            {/* 🔐 SÉCURITÉ */}
            <TextField
              label="Ancien mot de passe"
              type="password"
              value={form.oldPassword}
              onChange={(e) =>
                handleChange("oldPassword", e.target.value)
              }
              fullWidth
            />

            <TextField
              label="Nouveau mot de passe"
              type="password"
              value={form.newPassword}
              onChange={(e) =>
                handleChange("newPassword", e.target.value)
              }
              fullWidth
              helperText="Laissez vide si vous ne voulez pas changer"
            />
          </Box>
        </Paper>
      </DialogContent>

      {/* ACTIONS */}
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={isLoading} variant="outlined">
          Annuler
        </Button>
        <Button
          onClick={save}
          disabled={isLoading}
          variant="contained"
          startIcon={!isLoading && <Edit />}
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
