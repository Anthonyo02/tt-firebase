"use client";

import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db2 } from "@/lib/firebase-site";
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  Skeleton,
  Alert,
  Container,
  Fade,
  useTheme,
  alpha,
  Grid,
} from "@mui/material";
import HandshakeIcon from "@mui/icons-material/Handshake";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";

/* ================= TYPES ================= */

interface Logo {
  id: string;
  image: string;
  name?: string;
}

interface LogoData {
  logos: Logo[];
}

/* ================= COMPONENT ================= */

const LogoList: React.FC = () => {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const ref = doc(db2, "website_content", "logo");

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as LogoData;
          setLogos(
            [...(data.logos || [])]
          );
        } else {
          setLogos([]);
        }
        setLoading(false);
        setError(null);
      },
      () => {
        setError("Impossible de charger les partenaires");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <Box py={{ xs: 6, md: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" fontWeight={700} mb={4}>
           Logo
          </Typography>

          <Grid container spacing={3} justifyContent="center">
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
                <Skeleton
                  variant="rounded"
                  height={110}
                  sx={{ borderRadius: 3 }}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  /* ================= ERROR ================= */

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  /* ================= EMPTY ================= */

  if (!logos.length) {
    return (
      <Box py={8} textAlign="center" color="text.secondary">
        <SentimentDissatisfiedIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
        <Typography variant="h6">
          Aucun logo disponible
        </Typography>
      </Box>
    );
  }

  /* ================= MAIN ================= */

  return (
    <Box
      component="section"
      py={2}
      sx={{
        background: `linear-gradient(180deg,
          ${alpha(theme.palette.primary.main, 0.03)} 0%,
          ${theme.palette.background.paper} 100%)`,
      }}
    >
      <Grid  container justifyContent={"center"} >
        {/* ===== Title ===== */}
        <Box textAlign="center" mb={5}>
          <Box display="inline-flex" alignItems="center" gap={1.5}>
            <HandshakeIcon color="primary" sx={{ fontSize: 30 }} />
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                background: `linear-gradient(135deg,
                  ${theme.palette.primary.main},
                  ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
             Logo
            </Typography>
          </Box>

          <Box
            mt={1.5}
            mx="auto"
            width={"100%"}
            height={4}
            borderRadius={2}
            sx={{
              background: `linear-gradient(90deg,
                ${theme.palette.primary.main},
                ${theme.palette.secondary.main})`,
            }}
          />
        </Box>

        {/* ===== Logos ===== */}
        <Grid container spacing={3} justifyContent="center">
          {logos.map((logo, index) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={logo.id}>
              <Fade in timeout={300 + index * 120}>
                <Card
                component={"article"}
                  rel="noopener noreferrer"
                  elevation={4}
                  sx={{
                    transition: "all .35s ease",
                    textDecoration: "none",
                    display: "block",
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: `0 18px 40px -10px ${alpha(
                        theme.palette.primary.main,
                        0.25
                      )}`,
                    },
                    width:"100%",
                    p:1
                  }}
                >
                  <CardActionArea
                    sx={{
                    //   p: 3,
                      aspectRatio: "2/1",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    //   gap: 1.5,
                      "&:hover img": {
                        filter: "grayscale(0%)",
                        transform: "scale(1.08)",
                      },
                      
                    }}
                  >
                    <Box
                      component="img"
                      src={logo.image}
                      alt={logo.name || "Logo partenaire"}
                      loading="lazy"
                      sx={{
                        // maxHeight: 65,
                        width: "100%",
                        objectFit: "contain",
                        transition: "all .4s ease",
                        
                      }}
                    />

                    {logo.name && (
                      <Typography
                        variant="body2"
                        textAlign="center"
                        color="text.secondary"
                        fontWeight={500}
                      >
                        {logo.name}
                      </Typography>
                    )}
                  </CardActionArea>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Box>
  );
};

export default LogoList;
