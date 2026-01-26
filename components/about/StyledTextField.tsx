// ============================================
// STYLED TEXT FIELD - Champ de texte stylisé
// ============================================

"use client";
import React from "react";
import { TextField, TextFieldProps } from "@mui/material";

interface StyledTextFieldProps extends Omit<TextFieldProps, 'size'> {
  isSmall?: boolean;
}

const StyledTextField: React.FC<StyledTextFieldProps> = ({ 
  isSmall, 
  sx, 
  ...props 
}) => (
  <TextField
    {...props}
    size={isSmall ? "small" : "small"}
    sx={{
      "& .MuiOutlinedInput-root": {
        backgroundColor: "#fff",
        borderRadius: 2,
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: "#fafafa",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#c7d2fe",
          },
        },
        "&.Mui-focused": {
          backgroundColor: "#fff",
          boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.1)",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#6366f1",
          },
        },
      },
      "& .MuiInputLabel-root.Mui-focused": {
        color: "#6366f1",
      },
      ...sx,
    }}
  />
);

export default StyledTextField;