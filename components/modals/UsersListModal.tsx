"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemAvatar,
  IconButton,
  Chip,
  Typography,
  Alert,
  Button,
  DialogActions,
  Box,
  Avatar,
  Tooltip,
  Fade,
  Divider,
  Badge,
  Paper,
  InputBase,
} from "@mui/material";
import {
  Edit,
  Delete,
  People,
  Close,
  Search,
  PersonAdd,
  AdminPanelSettings,
  Person,
} from "@mui/icons-material";
import EditUserModal from "./EditUserModal";
import ConfirmDialog from "./ConfirmDialog";

// 🔥 Import du Contexte
import { useData } from "@/context/DataContext";
import { getAuth } from "firebase/auth";

// ✅ Interface User
interface User {
  id: string;
  nom: string;
  email: string;
  role: string;
  createdAt?: number;
}

interface UsersListModalProps {
  open: boolean;
  reload: boolean;
  openCreate: () => void;
  onClose: () => void;
  setReload: () => void;
}

const UsersListModal: React.FC<UsersListModalProps> = ({
  open,
  onClose,
  openCreate,
}) => {
  const { users, deleteUser: contextDeleteUser, fetchUsers } = useData();

  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const avatarColors = [
    "#1976d2", "#388e3c", "#f57c00", "#7b1fa2",
    "#c2185b", "#0097a7", "#5d4037", "#455a64",
  ];

  const getAvatarColor = (name: string) => {
    const index = name.charCodeAt(0) % avatarColors.length;
    return avatarColors[index];
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sortedUsers = useMemo(() => {
    const list = users as User[];
    return [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [users]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(sortedUsers);
    } else {
      const filtered = sortedUsers.filter(
        (user) =>
          user.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, sortedUsers]);

  // 🔹 Suppression Firestore + Firebase Auth
const handleDelete = async () => {
  if (!deleteUser) return;
  setIsLoading(true);
  try {
    // 1. Récupérer le token de l'admin connecté
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error("Vous devez être connecté pour effectuer cette action.");
    }

    const token = await currentUser.getIdToken();

    // 2. Appel à l'API avec le token
    const response = await fetch("/api/users/delete", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // Ajout du header Authorization
      },
      body: JSON.stringify({ uid: deleteUser.id }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erreur lors de la suppression");

    // Mettre à jour le contexte
    await fetchUsers();
    setDeleteUser(null);
  } catch (err: any) {
    console.error(err);
    setError(err.message || "Erreur lors de la suppression");
  } finally {
    setIsLoading(false);
  }
};

  const handleUserUpdated = async (updatedUser: User) => {
    console.log("✅ Utilisateur mis à jour:", updatedUser);
    await fetchUsers();
    setEditUser(null);
  };

  const adminCount = sortedUsers.filter((u) => u.role === "admin").length;
  const employeeCount = sortedUsers.filter((u) => u.role !== "admin").length;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
            maxHeight: "78vh",
          },
        }}
      >
        {/* ===== HEADER ===== */}
        <Box
          sx={{
            background:
              "linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
            position: "relative",
            overflow: "hidden",
            color: "white",
            p: 2,
            height: 250,
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
              alignItems: "flex-start",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  width: 50,
                  height: 50,
                }}
              >
                <People fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Utilisateurs
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Gérer les accès et les rôles
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={onClose} sx={{ color: "white" }}>
              <Close />
            </IconButton>
          </Box>

          {/* Stats */}
          <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
            <Chip
              icon={<AdminPanelSettings sx={{ color: "white !important" }} />}
              label={`${adminCount} Admin${adminCount > 1 ? "s" : ""}`}
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                fontWeight: "bold",
              }}
            />
            <Chip
              icon={<Person sx={{ color: "white !important" }} />}
              label={`${employeeCount} Employé${employeeCount > 1 ? "s" : ""}`}
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                fontWeight: "bold",
              }}
            />
          </Box>
        </Box>

        {/* ===== SEARCH BAR ===== */}
        <Box sx={{ px: 3, py: 2 }}>
          <Paper
            sx={{
              display: "flex",
              alignItems: "center",
              px: 2,
              py: 1,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "grey.300",
              bgcolor: "primary",
            }}
          >
            <Search sx={{ color: "grey.500", mr: 1 }} />
            <InputBase
              placeholder="Rechercher un utilisateur..."
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ fontSize: 14 }}
            />
            {searchQuery && (
              <IconButton size="small" onClick={() => setSearchQuery("")}>
                <Close fontSize="small" />
              </IconButton>
            )}
          </Paper>
        </Box>

        <Divider />

        {/* ===== CONTENT ===== */}
        <DialogContent sx={{ p: 0 }}>
          {error && (
            <Alert
              severity="error"
              sx={{ m: 2, borderRadius: 2 }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          )}

          {filteredUsers.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 8,
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "grey.200",
                  mb: 2,
                }}
              >
                <People sx={{ fontSize: 40, color: "grey.400" }} />
              </Avatar>
              <Typography color="text.secondary" variant="h6">
                {searchQuery ? "Aucun résultat trouvé" : "Aucun utilisateur"}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {searchQuery
                  ? "Essayez avec d'autres termes"
                  : "Créez votre premier utilisateur"}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 2 }}>
              {filteredUsers.map((user, index) => (
                <Fade in key={user.id} timeout={300 + index * 100}>
                  <Paper
                    elevation={2}
                    sx={{
                      mb: 1.5,
                      borderRadius: 2,
                      border: "0.2px solid",
                      borderColor: "grey.700",
                      overflow: "hidden",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "primary.main",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <ListItem sx={{ py: 1 }}>
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                          }}
                          badgeContent={
                            user.role === "admin" ? (
                              <Avatar
                                sx={{
                                  width: 20,
                                  height: 20,
                                  bgcolor: "#f44336",
                                  border: "2px solid white",
                                }}
                              >
                                <AdminPanelSettings sx={{ fontSize: 12 }} />
                              </Avatar>
                            ) : null
                          }
                        >
                          <Avatar
                            sx={{
                              bgcolor: getAvatarColor(user.nom),
                              fontWeight: "bold",
                              width: 48,
                              height: 48,
                            }}
                          >
                            {getInitials(user.nom)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Typography fontWeight="600" variant="body1">
                            {user.nom}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            {user.email}
                          </Typography>
                        }
                        sx={{ ml: 1 }}
                      />

                      <ListItemSecondaryAction>
                        <Tooltip title="Modifier" arrow>
                          <IconButton
                            size="small"
                            onClick={() => setEditUser(user)}
                            sx={{
                              mr: 0.5,
                              bgcolor: "primary.50",
                              "&:hover": { bgcolor: "primary.100" },
                            }}
                          >
                            <Edit fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Supprimer" arrow>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteUser(user)}
                            sx={{
                              bgcolor: "error.50",
                              "&:hover": { bgcolor: "error.100" },
                            }}
                          >
                            <Delete fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Paper>
                </Fade>
              ))}
            </List>
          )}
        </DialogContent>

        {/* ===== FOOTER ===== */}
        <Divider />
        <DialogActions
          sx={{
            p: 2.5,
            background: "linear-gradient(135deg, #616637 0%, #666666ff 100%)",
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: "none",
              color: "white",
            }}
          >
            Fermer
          </Button>

          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={openCreate}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: "none",
              background:
                "linear-gradient(135deg, #81883fff 0%, #888888ff 100%)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #616637 0%, #666666ff 100%)",
                border: "0.2px solid ",
                borderColor: "white.100",
              },
            }}
          >
            Nouvel utilisateur
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== ✅ EDIT MODAL ===== */}
      {editUser && (
        <EditUserModal
          open={true}
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={handleUserUpdated}
        />
      )}

      {/* ===== DELETE CONFIRM ===== */}
      <ConfirmDialog
        open={Boolean(deleteUser)}
        isLoading={isLoading}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer ${deleteUser?.nom} ?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteUser(null)}
      />
    </>
  );
};

export default UsersListModal;
