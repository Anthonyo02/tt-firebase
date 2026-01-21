"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff, Email, Lock } from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext"; // Assure-toi que le chemin est correct
import logo from "@/public/images/logo.png";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Redirection automatique si déjà connecté
  useEffect(() => {
    if (user) {
      router.replace("/"); // redirige vers la page principale
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    try {
      const result = await login(email, password);

      if (result.success) {
        router.push("/"); // redirige après login
      } else {
        setError(result.error || "Erreur inconnue");
      }
    } catch (err) {
      console.error("Login unexpected error:", err);
      setError("Une erreur inattendue est survenue");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: (theme) =>
          theme.palette.mode === "light"
            ? "linear-gradient(135deg, #818660 0%, #C6C9B9 50%, #D9CBC0 100%)"
            : "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo & titre */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box sx={{ width: 90, height: 90, mx: "auto", mb: 2 }}>
              <Image src={logo} alt="logo" width={90} height={90} priority />
            </Box>

            <Typography variant="h4" fontWeight={700} gutterBottom>
              T~T Stock
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connectez-vous pour gérer vos projets
            </Typography>
          </Box>

          {/* Message d'erreur */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
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

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading || !email || !password}
              sx={{ mt: 3 }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
