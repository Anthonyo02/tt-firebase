import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Box,
  IconButton,
  Slide,
  Avatar,
} from "@mui/material";
import {
  Warning,
  Close,
  DeleteForever,
  CheckCircle,
  ErrorOutline,
} from "@mui/icons-material";
import { TransitionProps } from "@mui/material/transitions";

interface ConfirmDialogProps {
  open: boolean;
  isLoading: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

// Transition animation
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  isLoading,
  onConfirm,
  onCancel,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  isDestructive = true,
}) => {
  // Couleurs selon le type
  const colors = isDestructive
    ? {
        gradient: "linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)",
        light: "#fff5f5",
        main: "#ef4444",
        dark: "#dc2626",
        shadow: "rgba(239, 68, 68, 0.4)",
      }
    : {
        gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
        light: "#fffbeb",
        main: "#f59e0b",
        dark: "#d97706",
        shadow: "rgba(245, 158, 11, 0.4)",
      };

  return (
    <Dialog
      open={open}
      onClose={!isLoading ? onCancel : undefined}
      maxWidth="xs"
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
        },
      }}
    >
      {/* Header avec icône animée */}
      <Box
        sx={{
          position: "relative",
          pt: 4,
          pb: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "linear-gradient(135deg, #81883fff 0%, #888888ff 100%)",
        }}
      >
        {/* Bouton fermer */}
        <IconButton
          onClick={onCancel}
          disabled={isLoading}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "#9ca3af",
            "&:hover": {
              bgcolor: "rgba(0,0,0,0.05)",
              color: "#6b7280",
            },
          }}
        >
          <Close fontSize="small" />
        </IconButton>

        {/* Icône avec animation */}
        <Avatar
          sx={{
            width: 72,
            height: 72,
            background: colors.gradient,
            boxShadow: `0 10px 30px ${colors.shadow}`,
            animation: "pulse 2s ease-in-out infinite",
            "@keyframes pulse": {
              "0%, 100%": {
                transform: "scale(1)",
                boxShadow: `0 10px 30px ${colors.shadow}`,
              },
              "50%": {
                transform: "scale(1.05)",
                boxShadow: `0 15px 40px ${colors.shadow}`,
              },
            },
          }}
        >
          {isDestructive ? (
            <DeleteForever sx={{ fontSize: 36 }} />
          ) : (
            <Warning sx={{ fontSize: 36 }} />
          )}
        </Avatar>

        {/* Cercles décoratifs */}
        <Box
          sx={{
            position: "absolute",
            width: 100,
            height: 100,
            borderRadius: "50%",
            border: `2px solid ${colors.main}20`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "ripple 2s ease-in-out infinite",
            "@keyframes ripple": {
              "0%": {
                transform: "translate(-50%, -50%) scale(0.8)",
                opacity: 1,
              },
              "100%": {
                transform: "translate(-50%, -50%) scale(1.4)",
                opacity: 0,
              },
            },
          }}
        />
      </Box>

      <DialogContent sx={{ textAlign: "center", px: 4, py: 3 }}>
        {/* Titre */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "primary",
            mb: 1.5,
          }}
        >
          {title}
        </Typography>

        {/* Message */}
        <Typography
          sx={{
            color: "text.secondary",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          {message}
        </Typography>

        {/* Avertissement supplémentaire pour destructif */}
        {isDestructive && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor:"primary",
              // border: "1px solid #fecaca",
              boxShadow:"1px 1px 3px #616637",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            <ErrorOutline sx={{ color: "#ef4444", fontSize: 18 }} />
            <Typography
              sx={{
                color: "#dc2626",
                fontSize: "0.8rem",
                fontWeight: 500,
              }}
            >
              Cette action est irréversible
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          pt: 1,
          gap: 1.5,
          justifyContent: "center",
        }}
      >
        {/* Bouton Annuler */}
        <Button
          onClick={onCancel}
          disabled={isLoading}
          sx={{
            flex: 1,
            py: 1.5,
            borderRadius: 3,
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "#4b5563",
            bgcolor: "#f3f4f6",
            border: "1px solid #e5e7eb",
            textTransform: "none",
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: "#e5e7eb",
              borderColor: "#d1d5db",
              transform: "translateY(-1px)",
            },
          }}
        >
          {cancelText}
        </Button>

        {/* Bouton Confirmer */}
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={isLoading}
          sx={{
            flex: 1,
            py: 1.5,
            borderRadius: 3,
            fontSize: "0.95rem",
            fontWeight: 600,
            textTransform: "none",
            background: colors.gradient,
            boxShadow: `0 4px 15px ${colors.shadow}`,
            transition: "all 0.2s ease",
            "&:hover": {
              background: colors.gradient,
              boxShadow: `0 6px 20px ${colors.shadow}`,
              transform: "translateY(-2px)",
            },
            "&:disabled": {
              background: colors.gradient,
              opacity: 0.7,
              color: "white",
            },
          }}
        >
          {isLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <CircularProgress size={20} sx={{ color: "white" }} />
              <span>{confirmText}...</span>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isDestructive ? (
                <DeleteForever sx={{ fontSize: 20 }} />
              ) : (
                <CheckCircle sx={{ fontSize: 20 }} />
              )}
              <span>{confirmText}</span>
            </Box>
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
