"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Leaf,
  Sparkles,
  Star,
  Rocket,
  Lightbulb,
  Heart,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Firebase Imports
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase"; // ⚠️ Adapter selon votre config

// --- Types ---
interface CtaButton {
  label: string;
  href: string;
  color: string;
}

interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  icon: string;
  overlayColor: string;
  ctas: CtaButton[];
  order: number;
}

// --- Mapping des icônes (string -> composant Lucide) ---
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles: Sparkles,
  Play: Play,
  Leaf: Leaf,
  Star: Star,
  Rocket: Rocket,
  Lightbulb: Lightbulb,
  Heart: Heart,
  Zap: Zap,
};

// --- Mapping des couleurs pour les boutons ---
const getButtonClasses = (color: string): string => {
  const colorMap: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    tertiary: "bg-tertiary text-white hover:bg-tertiary/90",
    "accent-warm":
      "bg-accent-warm text-accent-warm-foreground hover:bg-accent-warm/90",
    outline:
      "border-2 border-white bg-transparent text-white hover:bg-white hover:text-foreground",
  };
  return colorMap[color] || colorMap["outline"];
};
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// --- Mapping des couleurs pour l'icône de fond ---
const getIconBgClass = (overlayColor: string): string => {
  if (overlayColor.includes("primary")) return "bg-secondary/40";
  if (overlayColor.includes("tertiary")) return "bg-tertiary/30";
  if (overlayColor.includes("accent") || overlayColor.includes("818660"))
    return "bg-accent-warm/30";
  return "bg-white/20";
};

// --- Mapping des couleurs pour les indicateurs ---
const getIndicatorClass = (overlayColor: string): string => {
  if (overlayColor.includes("primary")) return "bg-primary";
  if (overlayColor.includes("tertiary")) return "bg-tertiary";
  if (overlayColor.includes("accent") || overlayColor.includes("818660"))
    return "bg-accent-warm";
  return "bg-white";
};

export function HeroCarousel() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- Charger les slides depuis Firebase ---
  useEffect(() => {
    const slidesRef = collection(db, "website_slides");
    const q = query(slidesRef, orderBy("order", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedSlides = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title || "",
            subtitle: data.subtitle || "",
            image: data.image || "/imgcarousel/placeholder.png",
            icon: data.icon || "Sparkles",
            overlayColor: data.overlayColor || "from-primary/80",
            ctas: data.ctas || [],
            order: data.order || 0,
          } as SlideData;
        });
        // console.log("azooo eeeeeee" + JSON.stringify(fetchedSlides));

        setSlides(fetchedSlides);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur Firebase:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length === 0) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide, slides.length]);

  // --- Loading state ---
  if (loading) {
    return (
      <section className="relative h-[600px] md:h-[700px] bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Chargement...</div>
      </section>
    );
  }

  // --- Empty state ---
  if (slides.length === 0) {
    return (
      <section className="relative h-[600px] md:h-[700px] bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Aucun slide disponible</div>
      </section>
    );
  }

  return (
    <section className="relative h-[600px] overflow-hidden md:h-[700px]" >
      {/* Slides */}
      {slides.map((slide, index) => {
        // Récupérer le composant icône dynamiquement
        const IconComponent = ICON_MAP[slide.icon] || Sparkles;

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
            
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(
      to right,
      ${hexToRgba(slide.overlayColor, 0.35)} 0%,
      ${hexToRgba(slide.overlayColor, 0.3)} 40%,
      transparent 50%
    )`,
                }}
              />
            </div>

            {/* Content */}
     <div className="container relative mx-auto flex h-full items-center pl-10 sm:pl-20">


              <div className="max-w-2xl space-y-6">
                {/* Icône dynamique */}
                <div
                  className={`inline-flex h-16 w-16 items-center justify-center rounded-full backdrop-blur ${getIconBgClass(slide.overlayColor)}`}
                >
                  <IconComponent className="h-8 w-8 text-white" />
                </div>

                <h1 className="font-heading text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl text-balance">
                  {slide.title}
                </h1>

                <p className="text-lg text-white/90 md:text-xl">
                  {slide.subtitle}
                </p>

                {/* CTAs dynamiques */}
                <div className="flex flex-wrap gap-4 pt-2">
                  {slide.ctas.map((cta, ctaIndex) => (
                    <Button
                      key={ctaIndex}
                      asChild
                      size="lg"
                      className={getButtonClasses(cta.color)}
                    >
                      <Link href={cta.href}>{cta.label}</Link>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-transparent transition-colors hover:bg-accent-warm"
            aria-label="Slide précédent"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-transparent transition-colors hover:bg-accent-warm"
            aria-label="Slide suivant"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>

          {/* Indicateurs */}
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2 ">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? `w-8 ${getIndicatorClass(slide.overlayColor)}`
                    : "w-2 bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Aller au slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
