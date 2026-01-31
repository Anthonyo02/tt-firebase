// utils.ts
import { CLIENT_OPTIONS, TECHNOLOGY_OPTIONS, THEME } from "@/components/realisation/constants";

export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return "";
  if (dateString.length === 4) return dateString;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR");
  } catch (e) {
    return dateString;
  }
};

export const getClientColor = (client: string): string => {
  const found = CLIENT_OPTIONS.find((c) => c.value === client);
  return found?.color || THEME.neutral[500];
};

export const getTechColor = (tech: string): string => {
  const found = TECHNOLOGY_OPTIONS.find((t) => t.value === tech);
  return found?.color || THEME.neutral[500];
};

export const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const getYouTubeThumbnail = (url: string): string => {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return "";
};

export const isValidYouTubeUrl = (url: string): boolean => {
  return getYouTubeVideoId(url) !== null;
};

export const isValidProjectUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};