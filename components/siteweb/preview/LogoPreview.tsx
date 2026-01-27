"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Box,
  Container,
  Typography,
  Skeleton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Handshake, Sparkles } from "lucide-react";

// --- Types ---
interface PartenaireItem {
  id: string;
  name: string;
  image: string;
  imagePublicId?: string;
  order: number;
}

interface PartenaireData {
  partenaires: PartenaireItem[];
}

// --- Données statiques par défaut ---
const DEFAULT_PARTENAIRES: PartenaireItem[] = [
  { id: "p1", name: "Partenaire Alpha", image: "/logos/partner-1.png", order: 1 },
  { id: "p2", name: "Partenaire Beta", image: "/logos/partner-2.png", order: 2 },
  { id: "p3", name: "Partenaire Gamma", image: "/logos/partner-3.png", order: 3 },
  { id: "p4", name: "Partenaire Delta", image: "/logos/partner-4.png", order: 4 },
  { id: "p5", name: "Partenaire Epsilon", image: "/logos/partner-5.png", order: 5 },
  { id: "p6", name: "Partenaire Zeta", image: "/logos/partner-6.png", order: 6 },
];

// --- Composant Card Partenaire ---
interface PartnerCardProps {
  partenaire: PartenaireItem;
}

const PartnerCard: React.FC<PartnerCardProps> = ({ partenaire }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        flex: "0 0 auto",
        width: { xs: 140, sm: 160, md: 80 },
        mx: { xs: 2, md: 3 },
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "relative",
          // p: { xs: 2, md: 3 },
          height: { xs: 100, md: 80 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isHovered
            ? "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)"
            : "linear-gradient(145deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)",
          backdropFilter: "blur(10px)",
          // borderRadius: "16px",
          border: isHovered
            ? "1px solid rgba(97, 102, 55, 0.3)"
            : "1px solid rgba(255,255,255,0.5)",
          // boxShadow: isHovered
          //   ? "0 20px 40px rgba(97, 102, 55, 0.15)"
          //   : "0 8px 32px rgba(0, 0, 0, 0.08)",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isHovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
          cursor: "pointer",
          // overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: isHovered
              ? "linear-gradient(90deg, #616637, #8C915D, #616637)"
              : "transparent",
            transition: "all 0.3s ease",
          },
        }}
      >
        {partenaire.image && !imageError ? (
          <Box
            component="img"
            src={partenaire.image}
            alt={partenaire.name}
            onError={() => setImageError(true)}
            sx={{
              maxWidth: "85%",
              maxHeight: "85%",
              objectFit: "contain",
              filter: isHovered ? "grayscale(0%)" : "grayscale(40%)",
              // opacity: isHovered ? 1 : 0.8,
              transition: "all 0.4s ease",
              transform: isHovered ? "scale(1.08)" : "scale(1)",
            }}
          />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Handshake
              size={28}
              style={{ color: isHovered ? "#616637" : "#A1A1AA", transition: "color 0.3s ease" }}
            />
            <Typography
              variant="caption"
              sx={{
                color: isHovered ? "#616637" : "#71717A",
                fontWeight: 600,
                textAlign: "center",
                fontSize: "0.7rem",
              }}
            >
              {partenaire.name}
            </Typography>
          </Box>
        )}
      </Box>

      <Typography
        variant="body2"
        sx={{
          textAlign: "center",
          mt: 1.5,
          fontWeight: 600,
          fontSize: { xs: "0.75rem", md: "0.85rem" },
          color: isHovered ? "#616637" : "#52525B",
          transition: "all 0.3s ease",
          opacity: isHovered ? 1 : 0.8,
        }}
      >
        {partenaire.name}
      </Typography>
    </Box>
  );
};

// --- Composant Carousel Infini Amélioré ---
interface InfiniteCarouselProps {
  items: PartenaireItem[];
  speed?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
}

const InfiniteCarousel: React.FC<InfiniteCarouselProps> = ({
  items,
  speed = 25,
  reverse = false,
  pauseOnHover = true,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Calculer la durée basée sur le nombre d'items pour une vitesse constante
  const duration = items.length * speed / 5;

  useEffect(() => {
    // S'assurer que l'animation est prête
    setIsReady(true);
  }, []);

  // Créer suffisamment de copies pour un défilement fluide
  // On duplique 4 fois pour s'assurer qu'il n'y a jamais de vide
  const duplicatedItems = [...items, ...items, ...items, ...items];

  return (
    <Box
      ref={containerRef}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      sx={{
        width: "100%",
        overflow: "hidden",
        position: "relative",
        py: 2,
        // Masques de dégradé sur les côtés
        "&::before, &::after": {
          content: '""',
          position: "absolute",
          top: 0,
          bottom: 0,
          width: { xs: "60px", md: "120px" },
          zIndex: 10,
          pointerEvents: "none",
        },
        "&::before": {
          left: 0,
          background: "linear-gradient(90deg, rgba(250,250,250,1) 0%, rgba(250,250,250,0) 100%)",
        },
        "&::after": {
          right: 0,
          background: "linear-gradient(270deg, rgba(250,250,250,1) 0%, rgba(250,250,250,0) 100%)",
        },
      }}
    >
      <Box
        ref={scrollerRef}
        sx={{
          display: "flex",
          width: "max-content",
          animation: isReady
            ? `scroll-${reverse ? "reverse" : "normal"} ${duration}s linear infinite`
            : "none",
          animationPlayState: isPaused ? "paused" : "running",
          "@keyframes scroll-normal": {
            "0%": {
              transform: "translateX(0)",
            },
            "100%": {
              transform: "translateX(-50%)",
            },
          },
          "@keyframes scroll-reverse": {
            "0%": {
              transform: "translateX(-50%)",
            },
            "100%": {
              transform: "translateX(0)",
            },
          },
        }}
      >
        {duplicatedItems.map((partenaire, index) => (
          <PartnerCard key={`${partenaire.id}-${index}`} partenaire={partenaire} />
        ))}
      </Box>
    </Box>
  );
};

// --- Alternative: Carousel avec JavaScript pour plus de contrôle ---
interface JSCarouselProps {
  items: PartenaireItem[];
  speed?: number;
  pauseOnHover?: boolean;
}

const JSInfiniteCarousel: React.FC<JSCarouselProps> = ({
  items,
  speed = 1,
  pauseOnHover = true,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number>();
  const scrollPositionRef = useRef(0);

  // Dupliquer les items
  const duplicatedItems = [...items, ...items];

  const animate = useCallback(() => {
    if (!scrollRef.current || isPaused) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const container = scrollRef.current;
    const scrollWidth = container.scrollWidth / 2; // La moitié car on a dupliqué

    scrollPositionRef.current += speed;

    // Reset quand on a scrollé la première moitié (boucle parfaite)
    if (scrollPositionRef.current >= scrollWidth) {
      scrollPositionRef.current = 0;
    }

    container.style.transform = `translateX(-${scrollPositionRef.current}px)`;
    animationRef.current = requestAnimationFrame(animate);
  }, [isPaused, speed]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <Box
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      sx={{
        width: "100%",
        overflow: "hidden",
        position: "relative",
        py: 2,
        "&::before, &::after": {
          content: '""',
          position: "absolute",
          top: 0,
          bottom: 0,
          width: { xs: "60px", md: "120px" },
          zIndex: 10,
          pointerEvents: "none",
        },
        "&::before": {
          left: 0,
          background: "linear-gradient(90deg, rgba(250,250,250,1) 0%, rgba(250,250,250,0) 100%)",
        },
        "&::after": {
          right: 0,
          background: "linear-gradient(270deg, rgba(250,250,250,1) 0%, rgba(250,250,250,0) 100%)",
        },
      }}
    >
      <Box
        ref={scrollRef}
        sx={{
          display: "flex",
          width: "max-content",
          willChange: "transform",
        }}
      >
        {duplicatedItems.map((partenaire, index) => (
          <PartnerCard key={`${partenaire.id}-${index}`} partenaire={partenaire} />
        ))}
      </Box>
    </Box>
  );
};

// --- Composant Principal ---
export default function LogoPreview() {
  const [data, setData] = useState<PartenaireData | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const docRef = doc(db, "website_content", "logo");

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = snapshot.data();
          setData({
            partenaires: Array.isArray(docData.partenaires)
              ? docData.partenaires
                  .map((p: any) => ({
                    id: p.id || "",
                    name: p.name || "",
                    image: p.image || "",
                    imagePublicId: p.imagePublicId || "",
                    order: p.order || 0,
                  }))
                  .sort((a: PartenaireItem, b: PartenaireItem) => a.order - b.order)
              : DEFAULT_PARTENAIRES,
          });
        } else {
          setData({ partenaires: DEFAULT_PARTENAIRES });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Erreur Firebase:", error);
        setData({ partenaires: DEFAULT_PARTENAIRES });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const partenaires = data?.partenaires || DEFAULT_PARTENAIRES;

  if (loading) {
    return (
      <Box
        component="section"
        sx={{
          py: { xs: 8, md: 14 },
          background: "linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 50%, #FAFAFA 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Skeleton variant="rounded" width={180} height={36} sx={{ mx: "auto", mb: 2 }} />
            <Skeleton variant="text" width={320} height={28} sx={{ mx: "auto" }} />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 3, flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rounded" width={180} height={120} sx={{ borderRadius: "16px" }} />
            ))}
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 6, md: 10 },
        background: "linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 50%, #FAFAFA 100%)",
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: "16px",
                background: "linear-gradient(135deg, #616637 0%, #8C915D 100%)",
                boxShadow: "0 8px 24px rgba(97, 102, 55, 0.25)",
                display: { xs: "none", sm: "flex" },
              }}
            >
              <Handshake size={28} style={{ color: "white" }} />
            </Box>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                background: "linear-gradient(135deg, #27272A 0%, #52525B 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Nos Partenaires
            </Typography>
          </Box>

          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 2.5,
              py: 1,
              background: "linear-gradient(135deg, rgba(97, 102, 55, 0.1) 0%, rgba(140, 145, 93, 0.1) 100%)",
              borderRadius: "100px",
              border: "1px solid rgba(97, 102, 55, 0.2)",
            }}
          >
            <Sparkles size={16} style={{ color: "#616637" }} />
            <Typography
              variant="caption"
              sx={{
                color: "#616637",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontSize: "0.7rem",
              }}
            >
              Ils nous font confiance
            </Typography>
          </Box>

          <Box
            sx={{
              width: 60,
              height: 4,
              background: "linear-gradient(90deg, #616637, #8C915D)",
              borderRadius: "100px",
              mx: "auto",
              mt: 3,
            }}
          />
        </Box>

        {/* Carousel */}
        {partenaires.length > 0 ? (
          <Box>
            {/* Option 1: CSS Animation (plus léger) */}
            <InfiniteCarousel
              items={partenaires}
              speed={isMobile ? 30 : 50}
              pauseOnHover
            />

            {/* Option 2: JavaScript Animation (plus de contrôle) */}
            {/* 
            <JSInfiniteCarousel
              items={partenaires}
              speed={isMobile ? 0.5 : 1}
              pauseOnHover
            />
            */}
          </Box>
        ) : (
          <Box
            sx={{
              textAlign: "center",
              py: 10,
              px: 4,
              background: "rgba(255,255,255,0.8)",
              borderRadius: "24px",
              border: "1px dashed #D4D4D8",
            }}
          >
            <Handshake size={36} style={{ color: "#A1A1AA" }} />
            <Typography variant="h6" sx={{ color: "#52525B", fontWeight: 600, mt: 2 }}>
              Aucun partenaire pour le moment
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}