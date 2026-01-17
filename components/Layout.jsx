"use client";

import React from "react";
import { Box } from "@mui/material";
import Sidebar from "./layout/Sidebar";
import Header from "./layout/Header";

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        <Header />
        <Box sx={{ p: 3, flex: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default Layout;
