"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Target, Heart, Lightbulb, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

// Firebase
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Grid, Typography } from "@mui/material";

// ---------- Types ----------
interface FeatureData {
  icon: string;
  title: string;
  description: string;
}

interface AboutData {
  description: string;
  experienceYears: string;
  features: FeatureData[];
  images: string[];
  tagline: string;
  title: string;
}

// ---------- Icônes ----------
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Target,
  Heart,
  Lightbulb,
  Leaf,
};

// ---------- Couleurs ----------
const getFeatureColors = (icon: string) => {
  const map: Record<string, { bg: string; icon: string }> = {
    Target: { bg: "bg-primary/10", icon: "text-primary" },
    Heart: { bg: "bg-tertiary/10", icon: "text-tertiary" },
    Lightbulb: { bg: "bg-accent-warm/20", icon: "text-accent-warm" },
    Leaf: { bg: "bg-secondary", icon: "text-primary" },
  };

  return map[icon] || { bg: "bg-gray-100", icon: "text-gray-600" };
};

export function About() {
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // ---------- Firebase ----------
  useEffect(() => {
    const ref = doc(db, "website_content", "about_section");

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setAboutData({
            description: data.description ?? "",
            experienceYears: data.experienceYears ?? "5+",
            features: data.features ?? [],
            images: data.images ?? [],
            tagline: data.tagline ?? "",
            title: data.title ?? "",
          });
        }
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsub();
  }, []);

  // ---------- Carousel ----------
  useEffect(() => {
    if (!aboutData?.images.length) return;

    const timer = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % aboutData.images.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [aboutData]);

  // ---------- Loading ----------
  if (loading) {
    return (
      <section className="py-20">
        <div className="container mx-auto flex min-h-[300px] items-center justify-center">
          <p className="animate-pulse text-muted-foreground">Chargement...</p>
        </div>
      </section>
    );
  }

  if (!aboutData) return null;

  return (
    <section className="py-20 bg-[#FDFCFB]">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* ================= IMAGE / CAROUSEL ================= */}
          <div className="relative">
            {/* Décor */}
            <div className="absolute -left-4 -top-4 h-20 w-20 rounded-full bg-secondary/50" />
            <div className="absolute -right-8 top-1/2 h-16 w-16 rounded-full bg-accent-warm/20" />

            {/* Carousel */}
            <div className="relative z-10 aspect-[4/3] overflow-hidden rounded-2xl bg-gray-200">
              {aboutData.images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Équipe ${i + 1}`}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                    i === currentIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>

            {/* ✅ BADGE QUI FONCTIONNE */}
            <Grid
              
              direction="column"
              position={"absolute"}
              bottom={-8}
              right={-11}
              zIndex={'20'}
              sx={{
                bgcolor: "var(--tertiary, #6B7280)", // adapte si besoin
                p: 2,
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              }}
            >
              <Grid item>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  fontFamily="var(--font-heading)"
                  color="white"
                >
                  {aboutData.experienceYears}
                </Typography>
              </Grid>

              <Grid item>
                <Typography variant="body2" sx={{ opacity: 0.9 }} color="white">
                  Années d’expérience
                </Typography>
              </Grid>
            </Grid>
          </div>

          {/* ================= CONTENT ================= */}
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-accent-warm">
                {aboutData.tagline}
              </p>
              <h2 className="text-3xl font-bold md:text-4xl font-heading">
                {aboutData.title}
              </h2>
            </div>

            <p className="text-lg text-muted-foreground">
              {aboutData.description}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {aboutData.features.map((f) => {
                const Icon = ICON_MAP[f.icon] || Target;
                const colors = getFeatureColors(f.icon);

                return (
                  <div key={f.title} className="flex gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg}`}
                    >
                      <Icon className={`h-5 w-5 ${colors.icon}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{f.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {f.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="#" className="flex items-center gap-2">
                En savoir plus
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
