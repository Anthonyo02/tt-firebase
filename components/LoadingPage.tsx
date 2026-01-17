"use client";

import { Box, LinearProgress } from "@mui/material";
import Image from "next/image";
import logo from "@/public/images/logo.png";

const LoadingPage = () => (
  <Box
    sx={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
    }}
  >
    <Box sx={{ position: "fixed", top: 0, left: 0, width: "100%" }}>
      <LinearProgress
        sx={{
          height: 4,
          "& .MuiLinearProgress-bar": {
            backgroundColor: "#616637",
          },
        }}
      />
    </Box>

    <Image src={logo} alt="logo" width={80} height={80} priority />
  </Box>
);

export default LoadingPage;
