"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Target, Heart, Lightbulb, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

// Firebase Imports
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase"; // ⚠️ Adapter selon votre config

// --- Types ---
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

// --- Mapping des icônes (string -> composant Lucide) ---
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Target: Target,
  Heart: Heart,
  Lightbulb: Lightbulb,
  Leaf: Leaf,
};

// --- Mapping des couleurs pour les features ---
const getFeatureColors = (icon: string): { bgColor: string; iconColor: string } => {
  const colorMap: Record<string, { bgColor: string; iconColor: string }> = {
    Target: { bgColor: "bg-primary/10", iconColor: "text-primary" },
    Heart: { bgColor: "bg-tertiary/10", iconColor: "text-tertiary" },
    Lightbulb: { bgColor: "bg-accent-warm/20", iconColor: "text-accent-warm" },
    Leaf: { bgColor: "bg-secondary", iconColor: "text-primary" },
  };
  return colorMap[icon] || { bgColor: "bg-gray-100", iconColor: "text-gray-600" };
};

export function About() {
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- Charger les données depuis Firebase ---
  useEffect(() => {
    const docRef = doc(db, "website_content", "about_section"); // ⚠️ Adapter le nom du document

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAboutData({
            description: data.description || "",
            experienceYears: data.experienceYears || "5+",
            features: data.features || [],
            images: data.images || [],
            tagline: data.tagline || "",
            title: data.title || "",
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Erreur Firebase:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Changement automatique d'image toutes les 4 secondes
  useEffect(() => {
    if (!aboutData || aboutData.images.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % aboutData.images.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [aboutData]);

  // --- Loading state ---
  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background via-secondary/10 to-background">
        <div className="container mx-auto px-4 flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground text-xl">Chargement...</div>
        </div>
      </section>
    );
  }

  // --- Empty state ---
  if (!aboutData) {
    return (
      <section className="py-20 bg-gradient-to-b from-background via-secondary/10 to-background">
        <div className="container mx-auto px-4 flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground text-xl">Aucune donnée disponible</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-[#FDFCFB] via-secondary/10 to-background">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          
          {/* Section Image transformée en Carousel */}
          <div className="relative">
            {/* Éléments décoratifs (inchangés) */}
            <div className="absolute -left-4 -top-4 h-20 w-20 rounded-full bg-secondary/50" />
            <div className="absolute -right-8 top-1/2 h-16 w-16 rounded-full bg-accent-warm/20" />
            
            {/* Conteneur du Carousel */}
            <div className="aspect-[4/3] overflow-hidden rounded-2xl relative z-10 bg-gray-200">
              {aboutData.images.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={`Équipe Tolo-Tady Communication ${index + 1}`}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
                    index === currentIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>

            {/* Badge flottant (dynamique) */}
            <div className="absolute -bottom-6 -right-6 hidden rounded-xl bg-tertiary p-6 text-white shadow-lg md:block z-20">
              <p className="font-heading text-3xl font-bold">{aboutData.experienceYears}</p>
              <p className="text-sm opacity-90">Années d'expérience</p>
            </div>
          </div>

          {/* Content (dynamique) */}
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-accent-warm">
                {aboutData.tagline}
              </p>
              <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl text-balance">
                {aboutData.title}
              </h2>
            </div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {aboutData.description}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {aboutData.features.map((feature) => {
                const IconComponent = ICON_MAP[feature.icon] || Target;
                const colors = getFeatureColors(feature.icon);

                return (
                  <div key={feature.title} className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.bgColor}`}
                    >
                      <IconComponent className={`h-5 w-5 ${colors.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href="/a-propos" className="inline-flex items-center gap-2">
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