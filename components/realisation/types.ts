// types.ts
export interface VideoItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  client: string;
  date: string;
}

export interface ImageItem {
  imageUrl: string;
  imagePublicId: string;
}

export interface PhotoItem {
  id: string;
  title: string;
  description: string;
  driveLink: string;
  images: ImageItem[];
  client: string;
  date: string;
}

export interface DigitalProjectItem {
  id: string;
  title: string;
  client: string;
  date: string;
  description: string;
  image: string;
  imagePublicId: string;
  projectUrl: string;
  technologies: string[];
}

export interface RealisationData {
  videos: VideoItem[];
  photos: PhotoItem[];
  digitalProjects: DigitalProjectItem[];
}

export interface PendingImage {
  file: File;
  previewUrl: string;
  itemId: string;
  type: "photo" | "digitalProject";
  imageIndex?: number;
}

export interface TempDialogImage {
  file: File;
  previewUrl: string;
}

export interface ToastState {
  msg: string;
  type: "success" | "error" | "warning" | "info";
}

export interface VideoDialogState {
  open: boolean;
  mode: "add" | "edit";
  data: VideoItem | null;
}

export interface PhotoDialogState {
  open: boolean;
  mode: "add" | "edit";
  data: PhotoItem | null;
    originalImages?: ImageItem[];
}

export interface DigitalProjectDialogState {
  open: boolean;
  mode: "add" | "edit";
  data: DigitalProjectItem | null;
}