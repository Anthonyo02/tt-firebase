import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Avatar,
  Divider,
  IconButton,
  Paper,
  Badge,
  InputAdornment,
  Grid,
  alpha,
  useTheme,
  Fade,
  Slide,
  Chip,
  Collapse,
} from "@mui/material";
import {
  Edit,
  Person,
  Email,
  Close,
  ArrowBack,
  Visibility,
  VisibilityOff,
  Lock,
  CheckCircle,
  Settings,
  VpnKey,
  Save,
} from "@mui/icons-material";
import { useData } from "@/context/DataContext";
import { TransitionProps } from "@mui/material/transitions";

interface User {
  id: string;
  nom: string;
  email: string;
  role: string;
}

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  user,
}) => {
  const theme = useTheme();
  const { updateUser } = useData();

  const [form, setForm] = useState({
    id: "",
    nom: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showEditMdp, setShowEditMdp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!user) return;

    setForm({
      id: user.id,
      nom: user.nom,
      email: user.email,
      password: "",
      confirmPassword: "",
      role: user.role,
    });
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSave = async () => {
    if (!form.nom || !form.email) {
      setError("Nom et Email sont obligatoires");
      return;
    }

    if (form.password && form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);

    try {
      await updateUser(form.id, {
        nom: form.nom,
        email: form.email,
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      });

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setShowEdit(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la mise à jour du profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowEdit(false);
    setShowEditMdp(false);
    setError("");
    setSuccess(false);
    onClose();
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleConfig = (role: string) => {
    const configs: Record<
      string,
      { color: string; gradient: string; label: string }
    > = {
      admin: {
        color: theme.palette.error.main,
        gradient: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
        label: "Administrateur",
      },
      manager: {
        color: theme.palette.warning.main,
        gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
        label: "Manager",
      },
      employer: {
        color: theme.palette.info.main,
        gradient: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
        label: "Employé",
      },
    };
    return (
      configs[role] || {
        color: theme.palette.grey[500],
        gradient: `linear-gradient(135deg, ${theme.palette.grey[500]} 0%, ${theme.palette.grey[700]} 100%)`,
        label: role,
      }
    );
  };

  const roleConfig = getRoleConfig(user?.role);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 25px 80px ${alpha("#000000ff", 0.25)}`,
        },
      }}
    >
      {/* HEADER avec gradient */}
      <Box
        sx={{
          position: "relative",
          background:
            "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
          color: "white",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: alpha("#fff", 0.1),
          },
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: -30,
            left: -30,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: alpha("#fff", 0.05),
          },
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2.5,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {showEdit && (
              <Fade in>
                <IconButton
                  onClick={() => {
                    setShowEdit(false);
                    setShowEditMdp(false);
                  }}
                  sx={{
                    color: "white",
                    bgcolor: alpha("#fff", 0.15),
                    backdropFilter: "blur(10px)",
                    "&:hover": {
                      bgcolor: alpha("#fff", 0.25),
                    },
                  }}
                >
                  <ArrowBack />
                </IconButton>
              </Fade>
            )}
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                bgcolor: alpha("#fff", 0.2),
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showEdit ? <Edit /> : <Settings />}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {showEdit ? "Modifier le profil" : "Mon Profil"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {showEdit
                  ? "Mettez à jour vos informations"
                  : "Gérez vos paramètres"}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleClose}
            sx={{
              color: "white",
              bgcolor: alpha("#fff", 0.1),
              "&:hover": {
                bgcolor: alpha("#fff", 0.2),
                transform: "rotate(90deg)",
              },
              transition: "all 0.3s ease",
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </Box>

      {!showEdit ? (
        /* ================= VIEW MODE ================= */
        <Fade in timeout={400}>
          <Box sx={{ p: 4 }}>
            {/* Profile Card */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                textAlign: "center",
                p: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background:
                  "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
                position: "relative",
                overflow: "hidden",
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
              {/* Avatar avec Badge */}
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                badgeContent={
                  <Chip
                    label={roleConfig.label}
                    size="small"
                    sx={{
                      background: roleConfig.gradient,
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      height: 24,
                      boxShadow: `0 4px 12px ${alpha(roleConfig.color, 0.4)}`,
                    }}
                  />
                }
              >
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    fontSize: 36,
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: `0 8px 30px ${alpha(
                      theme.palette.primary.main,
                      0.4
                    )}`,
                    border: `4px solid ${alpha("#fff", 0.9)}`,
                  }}
                >
                  {getInitials(user?.nom)}
                </Avatar>
              </Badge>

              <Typography variant="h5" fontWeight={800} mt={2.5} mb={0.5}>
                {user?.nom}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Membre actif
              </Typography>
            </Paper>

            <Divider sx={{ my: 3 }}>
              <Chip
                label="Informations"
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                }}
              />
            </Divider>

            {/* Info Cards */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                {
                  label: "Adresse Email",
                  value: user?.email,
                  icon: <Email />,
                  color: theme.palette.info.main,
                },
                {
                  label: "Rôle",
                  value: roleConfig.label,
                  icon: <Person />,
                  color: roleConfig.color,
                },
              ].map((info, i) => (
                <Paper
                  key={i}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 2.5,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      bgcolor: alpha(info.color, 0.04),
                      borderColor: alpha(info.color, 0.2),
                      transform: "translateX(8px)",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: alpha(info.color, 0.1),
                      color: info.color,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {info.icon}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={500}
                      textTransform="uppercase"
                      letterSpacing={0.5}
                    >
                      {info.label}
                    </Typography>
                    <Typography fontWeight={600} fontSize="1rem">
                      {info.value}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>

            {/* Edit Button */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<Edit />}
              onClick={() => setShowEdit(true)}
              sx={{
                mt: 4,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                fontSize: "1rem",
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 8px 25px ${alpha(
                  theme.palette.primary.main,
                  0.35
                )}`,
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 12px 35px ${alpha(
                    theme.palette.primary.main,
                    0.45
                  )}`,
                },
                transition: "all 0.3s ease",
              }}
            >
              Modifier mon profil
            </Button>
          </Box>
        </Fade>
      ) : (
        /* ================= EDIT MODE ================= */
        <Fade in timeout={400}>
          <Box>
            <DialogContent sx={{ p: 4 }}>
              {/* Alerts */}
              <Collapse in={!!error}>
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  }}
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              </Collapse>

              <Collapse in={success}>
                <Alert
                  severity="success"
                  icon={<CheckCircle />}
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    border: `1px solid ${alpha(
                      theme.palette.success.main,
                      0.2
                    )}`,
                  }}
                >
                  Profil mis à jour avec succès !
                </Alert>
              </Collapse>

              {/* Mini Avatar */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 4,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Avatar
                  sx={{
                    width: 50,
                    height: 50,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    fontWeight: 700,
                  }}
                >
                  {getInitials(form.nom)}
                </Avatar>
                <Box>
                  <Typography fontWeight={600}>
                    {form.nom || "Votre nom"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {form.email || "votre@email.com"}
                  </Typography>
                </Box>
              </Box>

              {/* Form Fields */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  label="Nom complet"
                  value={form.nom}
                  onChange={(e) => handleChange("nom", e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: theme.palette.primary.main }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: `0 4px 15px ${alpha(
                          theme.palette.primary.main,
                          0.1
                        )}`,
                      },
                      "&.Mui-focused": {
                        boxShadow: `0 4px 20px ${alpha(
                          theme.palette.primary.main,
                          0.15
                        )}`,
                      },
                    },
                  }}
                />

                <TextField
                  label="Adresse email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: theme.palette.info.main }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: `0 4px 15px ${alpha(
                          theme.palette.info.main,
                          0.1
                        )}`,
                      },
                      "&.Mui-focused": {
                        boxShadow: `0 4px 20px ${alpha(
                          theme.palette.info.main,
                          0.15
                        )}`,
                      },
                    },
                  }}
                />

                {/* Password Toggle */}
                <Paper
                  elevation={0}
                  onClick={() => setShowEditMdp((prev) => !prev)}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    cursor: "pointer",
                    border: `1px dashed ${alpha(
                      theme.palette.warning.main,
                      showEditMdp ? 0.5 : 0.3
                    )}`,
                    bgcolor: alpha(
                      theme.palette.warning.main,
                      showEditMdp ? 0.08 : 0.03
                    ),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      borderColor: alpha(theme.palette.warning.main, 0.5),
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: alpha(theme.palette.warning.main, 0.2),
                        color: theme.palette.warning.dark,
                      }}
                    >
                      <VpnKey fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600} fontSize="0.9rem">
                        {showEditMdp
                          ? "Annuler le changement"
                          : "Changer le mot de passe"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {showEditMdp
                          ? "Cliquez pour annuler"
                          : "Cliquez pour modifier"}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={showEditMdp ? "Actif" : "Modifier"}
                    size="small"
                    color={showEditMdp ? "warning" : "default"}
                    sx={{ fontWeight: 600 }}
                  />
                </Paper>

                {/* Password Fields */}
                <Collapse in={showEditMdp}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2.5,
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.warning.main, 0.05),
                      border: `1px solid ${alpha(
                        theme.palette.warning.main,
                        0.15
                      )}`,
                    }}
                  >
                    <TextField
                      label="Nouveau mot de passe"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      autoComplete="new-password"
                      onChange={(e) => handleChange("password", e.target.value)}
                      helperText="Laissez vide pour conserver l'ancien"
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: theme.palette.warning.main }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword((p) => !p)}
                              edge="end"
                              sx={{
                                color: showPassword
                                  ? theme.palette.primary.main
                                  : theme.palette.text.secondary,
                              }}
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2.5,
                          bgcolor: "white",
                        },
                      }}
                    />

                    <TextField
                      label="Confirmer le mot de passe"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) =>
                        handleChange("confirmPassword", e.target.value)
                      }
                      fullWidth
                      error={
                        !!form.password &&
                        !!form.confirmPassword &&
                        form.password !== form.confirmPassword
                      }
                      helperText={
                        form.password &&
                        form.confirmPassword &&
                        form.password !== form.confirmPassword
                          ? "Les mots de passe ne correspondent pas"
                          : form.password &&
                            form.confirmPassword &&
                            form.password === form.confirmPassword
                          ? "✓ Les mots de passe correspondent"
                          : ""
                      }
                      FormHelperTextProps={{
                        sx: {
                          color:
                            form.password === form.confirmPassword &&
                            form.password
                              ? theme.palette.success.main
                              : undefined,
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: theme.palette.warning.main }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword((p) => !p)}
                              edge="end"
                            >
                              {showConfirmPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2.5,
                          bgcolor: "white",
                        },
                      }}
                    />
                  </Box>
                </Collapse>
              </Box>
            </DialogContent>

            <DialogActions
              sx={{
                p: 3,
                pt: 0,
                gap: 2,
              }}
            >
              <Button
                onClick={() => {
                  setShowEdit(false);
                  setShowEditMdp(false);
                }}
                variant="outlined"
                sx={{
                  borderRadius: 2.5,
                  px: 3,
                  py: 1,
                  borderColor: alpha(theme.palette.divider, 0.3),
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                Annuler
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isLoading || success}
                startIcon={
                  isLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : success ? (
                    <CheckCircle />
                  ) : (
                    <Save />
                  )
                }
                sx={{
                  borderRadius: 2.5,
                  px: 4,
                  py: 1,
                  fontWeight: 600,
                  background: success
                    ? theme.palette.success.main
                    : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 4px 15px ${alpha(
                    success
                      ? theme.palette.success.main
                      : theme.palette.primary.main,
                    0.35
                  )}`,
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: `0 6px 20px ${alpha(
                      theme.palette.primary.main,
                      0.45
                    )}`,
                  },
                  transition: "all 0.3s ease",
                }}
              >
                {success ? "Sauvegardé !" : "Sauvegarder"}
              </Button>
            </DialogActions>
          </Box>
        </Fade>
      )}
    </Dialog>
  );
};

export default SettingsModal;
