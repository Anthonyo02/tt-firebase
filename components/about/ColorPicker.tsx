// ============================================
// COLOR PICKER - Sélecteur de couleur personnalisé
// ============================================

"use client";
import React, { useState, useRef } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Tooltip,
  Divider,
  Popover,
} from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import { ColorPickerProps } from "@/types/types";
import { getSafeColor } from "../ui/utils";
import { COLOR_PALETTE } from "@/types/constants";

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [customColor, setCustomColor] = useState(value || "#616637");
  const open = Boolean(anchorEl);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setCustomColor(value || "#616637");
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorSelect = (color: string) => {
    onChange(color);
    handleClose();
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  const isValidHex = (hex: string) => /^#([0-9A-F]{3}){1,2}$/i.test(hex);

  const displayColor = getSafeColor(value, "#616637");

  return (
    <Box width={"100%"}>
      {/* Bouton principal */}
      <Box
        onClick={handleOpen}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          p: 1,
          border: "1px solid",
          borderColor: open ? "#616637" : "#e0e0e0",
          borderRadius: 2,
          cursor: "pointer",
          bgcolor: "#fff",
          transition: "all 0.15s",
          minWidth: 120,
          "&:hover": {
            borderColor: "#616637",
            bgcolor: "#fafafa",
          },
          width: "100%",
        }}
      >
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: "4px",
            bgcolor: displayColor,
            border: "1px solid rgba(0,0,0,0.1)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)",
          }}
        />
        <Typography
          variant="caption"
          sx={{
            fontFamily: "monospace",
            color: "#555",
            fontSize: "0.75rem",
            flex: 1,
          }}
        >
          {displayColor.toUpperCase()}
        </Typography>
        <PaletteIcon sx={{ fontSize: 16, color: "#999" }} />
      </Box>

      {/* Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              borderRadius: 3,
              boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
              minWidth: 240,
            },
          },
        }}
      >
        {/* Titre */}
        <Typography
          variant="subtitle2"
          sx={{ mb: 1.5, fontWeight: 600, color: "#333" }}
        >
          Choisir une couleur
        </Typography>

        {/* Grille de couleurs */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: 0.75,
            mb: 2,
          }}
        >
          {COLOR_PALETTE.map((color) => (
            <Tooltip key={color.value} title={color.name} arrow placement="top">
              <Box
                onClick={() => handleColorSelect(color.value)}
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: "6px",
                  bgcolor: color.value,
                  border:
                    value?.toLowerCase() === color.value.toLowerCase()
                      ? "3px solid #616637"
                      : "2px solid transparent",
                  boxShadow:
                    value?.toLowerCase() === color.value.toLowerCase()
                      ? "0 0 0 2px rgba(97, 102, 55, 0.3)"
                      : color.value === "#FFFFFF"
                        ? "inset 0 0 0 1px #e0e0e0"
                        : "none",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  "&:hover": {
                    transform: "scale(1.15)",
                    boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
                  },
                }}
              />
            </Tooltip>
          ))}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Couleur personnalisée */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: "block", fontWeight: 500 }}
        >
          Couleur personnalisée
        </Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Box
            onClick={() => colorInputRef.current?.click()}
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: customColor,
              border: "2px solid #e0e0e0",
              cursor: "pointer",
              transition: "all 0.15s",
              "&:hover": {
                borderColor: "#616637",
                transform: "scale(1.05)",
              },
            }}
          />
          <input
            ref={colorInputRef}
            type="color"
            value={customColor}
            onChange={handleCustomColorChange}
            style={{
              position: "absolute",
              opacity: 0,
              width: 0,
              height: 0,
              pointerEvents: "none",
            }}
          />

          <TextField
            size="small"
            value={customColor}
            onChange={(e) => {
              const val = e.target.value;
              setCustomColor(val);
              if (isValidHex(val)) {
                onChange(val);
              }
            }}
            placeholder="#616637"
            sx={{
              flex: 1,
              "& .MuiInputBase-input": {
                fontFamily: "monospace",
                fontSize: "0.8rem",
                py: 0.75,
                textTransform: "uppercase",
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />

          <Button
            size="small"
            variant="contained"
            onClick={() => {
              if (isValidHex(customColor)) {
                handleColorSelect(customColor);
              }
            }}
            disabled={!isValidHex(customColor)}
            sx={{
              minWidth: "auto",
              px: 1.5,
              bgcolor: "#616637",
              borderRadius: 2,
              "&:hover": { bgcolor: "#4d5129" },
            }}
          >
            OK
          </Button>
        </Box>

        {/* Prévisualisation */}
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: displayColor,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color:
                displayColor === "#FFFFFF" || displayColor === "#D4C5A9"
                  ? "#333"
                  : "#fff",
              fontWeight: 600,
            }}
          >
            Aperçu
          </Typography>
        </Box>
      </Popover>
    </Box>
  );
};

export default ColorPicker;