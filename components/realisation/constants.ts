// constants.ts
import { RealisationData } from "./types";

export const CLIENT_OPTIONS = [
  { value: "arabe", label: "ARABE", color: "#616637" },
  { value: "lovia", label: "LOVIA", color: "#EC4899" },
  { value: "sosialy", label: "SOSIALY", color: "#10B981" },
  { value: "market", label: "TT MARKET PLACE", color: "#F59E0B" },
  { value: "autre", label: "AUTRE", color: "#7f7f7f" },
];

export const TECHNOLOGY_OPTIONS = [
  { value: "react", label: "React", color: "#61DAFB" },
  { value: "nextjs", label: "Next.js", color: "#000000" },
  { value: "vue", label: "Vue.js", color: "#4FC08D" },
  { value: "angular", label: "Angular", color: "#DD0031" },
  { value: "nodejs", label: "Node.js", color: "#339933" },
  { value: "wordpress", label: "WordPress", color: "#21759B" },
  { value: "shopify", label: "Shopify", color: "#7AB55C" },
  { value: "firebase", label: "Firebase", color: "#FFCA28" },
  { value: "mongodb", label: "MongoDB", color: "#47A248" },
  { value: "tailwind", label: "Tailwind CSS", color: "#06B6D4" },
  { value: "typescript", label: "TypeScript", color: "#3178C6" },
  { value: "php", label: "PHP", color: "#777BB4" },
  { value: "laravel", label: "Laravel", color: "#FF2D20" },
  { value: "flutter", label: "Flutter", color: "#02569B" },
  { value: "reactnative", label: "React Native", color: "#61DAFB" },
];

export const THEME = {
  primary: {
    main: "#616637",
    light: "#8C915D",
    dark: "#3B3E21",
    gradient: "linear-gradient(135deg, #616637 0%, #3B3E21 100%)",
  },
  secondary: {
    main: "#616637",
    light: "#8C915D",
    dark: "#3B3E21",
    gradient: "linear-gradient(135deg, #616637 0%, #8C915D 100%)",
  },
  youtube: {
    main: "#616637",
    gradient: "linear-gradient(135deg, #3B3E21 0%, #8C915D 100%)",
  },
  digital: {
    main: "#3B82F6",
    light: "#60A5FA",
    dark: "#1D4ED8",
    gradient: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
  },
  accent: {
    orange: "#F59E0B",
    green: "#10B981",
    blue: "#3B82F6",
  },
  neutral: {
    50: "#FAFAFA",
    100: "#F4F4F5",
    200: "#E4E4E7",
    300: "#D4D4D8",
    400: "#A1A1AA",
    500: "#71717A",
    600: "#52525B",
    700: "#3F3F46",
    800: "#27272A",
    900: "#18181B",
  },
};

export const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp" as const,
};

export const DEFAULT_DATA: RealisationData = {
  videos: [
    {
      id: "v1",
      title: "Documentaire Impact Social",
      description: "Un documentaire sur les initiatives de développement communautaire.",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      client: "ARABE",
      date: new Date().toISOString().split("T")[0],
    },
  ],
  photos: [
    {
      id: "p1",
      title: "Reportage Terrain Communautaire",
      description: "Documentation des activités de terrain.",
      driveLink: "",
      images: [
        {
          imageUrl: "/madagascar-field-photography-community-work.jpg",
          imagePublicId: "",
        },
      ],
      client: "LOVIA",
      date: new Date().toISOString().split("T")[0],
    },
  ],
  digitalProjects: [
    {
      id: "dp1",
      title: "Site E-commerce Exemple",
      description: "Plateforme de vente en ligne moderne et responsive.",
      projectUrl: "https://example.com",
      image: "",
      imagePublicId: "",
      client: "market",
      date: new Date().toISOString().split("T")[0],
      technologies: ["react", "nextjs", "tailwind"],
    },
  ],
};