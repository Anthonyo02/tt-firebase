import { createTheme, ThemeOptions } from "@mui/material/styles";

const getDesignTokens = (mode: "light" | "dark"): ThemeOptions => {
  const isLight = mode === "light";

  return {
    palette: {
      mode,
      primary: {
        main: "#818660",
        light: "#9a9f7a",
        dark: "#5a5e42",
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#C6C9B9",
        light: "#d4d7ca",
        dark: "#a8ab9a",
        contrastText: "#2a2c1f",
      },
      background: {
        default: isLight ? "#fafafa" : "#141414",
        paper: isLight ? "#ffffff" : "#1f1f1f",
      },
      text: {
        primary: isLight ? "#1a1a1a" : "#f5f5f5",
        secondary: isLight ? "#737373" : "#a3a3a3",
      },
      divider: isLight ? "#e5e5e5" : "#383838",
    },
    typography: {
      fontFamily:
        '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontWeight: 700, fontSize: "2.5rem", letterSpacing: "-0.02em" },
      h2: { fontWeight: 600, fontSize: "2rem", letterSpacing: "-0.01em" },
      h3: { fontWeight: 600, fontSize: "1.5rem" },
      h4: { fontWeight: 600, fontSize: "1.25rem" },
      h5: { fontWeight: 600, fontSize: "1.125rem" },
      h6: { fontWeight: 600, fontSize: "1rem" },
      body1: { fontSize: "0.9375rem", lineHeight: 1.6 },
      body2: { fontSize: "0.875rem", lineHeight: 1.5 },
      button: { textTransform: "none", fontWeight: 500 },
    },
    shape: { borderRadius: 12 },
    shadows: [
      "none",
      "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      ...Array(18).fill("none"),
    ] as any,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: "10px 20px",
            fontWeight: 500,
            boxShadow: "none",
            "&:hover": { boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
          },
          containedPrimary: {
            background: "linear-gradient(135deg, #818660 0%, #6b7050 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #6b7050 0%, #5a5e42 100%)",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow:
              "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
            border: `1px solid ${isLight ? "#e5e5e5" : "#383838"}`,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 10,
            },
          },
        },
      },
      MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
      MuiDrawer: { styleOverrides: { paper: { borderRight: "none" } } },
    },
  };
};

export const createAppTheme = (mode: "light" | "dark") =>
  createTheme(getDesignTokens(mode));

// ✅ Thème par défaut (clair)
const theme = createAppTheme("light");
export default theme;
