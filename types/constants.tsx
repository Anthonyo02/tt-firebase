// ============================================
// CONSTANTES - Palettes, configurations, valeurs par défaut
// ============================================

import React from "react";
import ImageIcon from "@mui/icons-material/Image";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DiamondIcon from "@mui/icons-material/Diamond";
import HandshakeIcon from "@mui/icons-material/Handshake";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import { PageContent, SectionConfig } from "./types";

// --- Palette de couleurs prédéfinies ---
export const COLOR_PALETTE = [
  { name: "Olive", value: "#616637" },
  { name: "Olive clair", value: "#8C915D" },
  { name: "Vert sauge", value: "#9CAF88" },
  { name: "Beige", value: "#D4C5A9" },
  { name: "Terracotta", value: "#C4A484" },
  { name: "Bleu profond", value: "#2C3E50" },
  { name: "Bleu ciel", value: "#3498DB" },
  { name: "Corail", value: "#E07A5F" },
  { name: "Rose", value: "#EC4899" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Vert émeraude", value: "#10B981" },
  { name: "Orange", value: "#F59E0B" },
  { name: "Rouge", value: "#EF4444" },
  { name: "Gris", value: "#6B7280" },
  { name: "Blanc", value: "#FFFFFF" },
  { name: "Noir", value: "#1A1A1A" },
];

// --- Options de compression ---
export const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp" as const,
};

// --- Données par défaut ---
export const DEFAULT_DATA: PageContent = {
  image: {
    imageUrl: "/madagascar-communication-agency-team-working-toget.jpg",
    imageId: "",
    title: "À propos de nous",
    subTitle: "Une agence de communication engagée pour un Madagascar meilleur",
    color: "#616637",
  },
  history: {
    subTitle: "NOTRE HISTOIRE",
    title: "Tolo-Tady Communication",
    description:
      "Tolo-Tady Communication est une agence de communication malgache...",
    color: "#616637",
  },
  cards: [
    {
      title: "Notre Vision",
      description: "Devenir l'agence de référence...",
      color: "#616637",
    },
    {
      title: "Notre Mission",
      description: "Accompagner les acteurs du changement...",
      color: "#8C915D",
    },
  ],
  values: {
    subTitle: "CE QUI NOUS GUIDE",
    title: "Nos valeurs",
    color: "#616637",
    items: [
      {
        title: "Engagement",
        description: "Nous croyons en une communication qui a du sens.",
        color: "#616637",
      },
      {
        title: "Proximité",
        description: "Nous travaillons main dans la main.",
        color: "#8C915D",
      },
    ],
  },
  approach: {
    subTitle: "NOTRE DIFFÉRENCE",
    title: "Une approche humaine",
    description:
      "Chez Tolo-Tady, nous croyons que la meilleure communication...",
    color: "#616637",
  },
  cta: {
    title: "Envie de travailler avec nous ?",
    subTitle: "Découvrez nos services ou contactez-nous.",
    color: "#616637",
    buttons: [
      {
        label: "Nos services",
        href: "/services",
        bgColor: "#616637",
        textColor: "#ffffff",
      },
      {
        label: "Nous contacter",
        href: "/contact",
        bgColor: "#ffffff",
        textColor: "#616637",
      },
    ],
  },
};

// --- Configuration des sections ---
export const SECTIONS_CONFIG: SectionConfig[] = [
  {
    id: "panel0",
    icon: <ImageIcon />,
    title: "Image Hero",
    sub: "Image principale, titre et sous-titre",
    color: "#818660",
    gradient:"linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)",
  },
  {
    id: "panel1",
    icon: <HistoryEduIcon />,
    title: "Histoire & Introduction",
    sub: "Titres principaux et description",
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  },
  {
    id: "panel2",
    icon: <VisibilityIcon />,
    title: "Vision & Mission",
    sub: "Cartes principales",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
  },
  {
    id: "panel3",
    icon: <DiamondIcon />,
    title: "Nos Valeurs",
    sub: "Liste des valeurs de l'entreprise",
    color: "#ec4899",
    gradient: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
  },
  {
    id: "panel4",
    icon: <HandshakeIcon />,
    title: "Notre Approche",
    sub: "Texte descriptif de la méthode",
    color: "#14b8a6",
    gradient: "linear-gradient(135deg, #14b8a6 0%, #10b981 100%)",
  },
  {
    id: "panel5",
    icon: <TouchAppIcon />,
    title: "Appel à l'action",
    sub: "Boutons et liens de bas de page",
    color: "#818660",
    gradient: "linear-gradient(135deg, #818660 0%, #42471f 100%)",
  },
];