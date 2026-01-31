"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Play,
  X,
  ArrowRight,
  Filter,
  Video,
  Camera,
  Calendar,
  Loader2,
  Globe,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Cloud, // Importé pour le Drive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Firebase Imports
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Grid } from "@mui/material";

// --- Utility Functions pour YouTube ---
const getYouTubeVideoId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const getYouTubeThumbnail = (url: string) => {
  const videoId = getYouTubeVideoId(url);
  return videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : "/placeholder.svg";
};

// --- Interfaces ---
interface VideoItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  client: string;
  date: string;
  thumbnail?: string;
  category?: string;
}

interface PhotoImage {
  imageUrl: string;
  imagePublicId: string;
}

interface PhotoItem {
  id: string;
  title: string;
  description: string;
  images: PhotoImage[];
  client: string;
  date: string;
  category?: string;
  driveLink?: string; // AJOUT : Champ pour le lien Drive
}

interface DigitalProjectItem {
  id: string;
  title: string;
  description: string;
  projectUrl: string;
  image: string;
  imagePublicId?: string;
  client: string;
  date: string;
  technologies?: string[];
  category?: string;
}

// --- Categories ---
const categories = [
  { id: "all", label: "Tout", icon: Filter, color: "primary" },
  { id: "video", label: "Vidéo", icon: Video, color: "tertiary" },
  { id: "photo", label: "Photo", icon: Camera, color: "accent-warm" },
  { id: "digital", label: "Projets digitaux", icon: Globe, color: "blue" },
];

export default function Realisation() {
  // États pour les données Firebase
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [digitalProjects, setDigitalProjects] = useState<DigitalProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Constante de pagination
  const ITEMS_PER_PAGE = 8;

  // États UI
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [selectedDigitalProject, setSelectedDigitalProject] = useState<DigitalProjectItem | null>(null);
  
  // État pour la galerie d'images dans le modal photo
  const [currentPhotoImageIndex, setCurrentPhotoImageIndex] = useState(0);

  // États de pagination
  const [currentVideoPage, setCurrentVideoPage] = useState(1);
  const [currentPhotoPage, setCurrentPhotoPage] = useState(1);
  const [currentDigitalPage, setCurrentDigitalPage] = useState(1);

  // --- Récupération des données Firebase ---
  useEffect(() => {
    const docRef = doc(db, "website_content", "realisation_section");

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        // Transformation des vidéos
        const loadedVideos = (data.videos || [])
          .map((v: any) => ({
            ...v,
            thumbnail: getYouTubeThumbnail(v.videoUrl),
            category: "video",
          }))
          .reverse();

        // Transformation des photos
        const loadedPhotos = (data.photos || [])
          .map((p: any) => ({
            ...p,
            images: p.images || [],
            driveLink: p.driveLink || null, // AJOUT : Récupération du lien Drive
            category: "photo",
          }))
          .reverse();

        // Transformation des projets digitaux
        const loadedDigitalProjects = (data.digitalProjects || [])
          .map((dp: any) => ({
            ...dp,
            category: "digital",
            technologies: dp.technologies || [],
          }))
          .reverse();

        setVideos(loadedVideos);
        setPhotos(loadedPhotos);
        setDigitalProjects(loadedDigitalProjects);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Reset du carousel quand on sélectionne une nouvelle photo
  useEffect(() => {
    if (selectedPhoto) {
      setCurrentPhotoImageIndex(0);
    }
  }, [selectedPhoto]);

  // --- Reset pagination on category change ---
  useEffect(() => {
    setCurrentVideoPage(1);
    setCurrentPhotoPage(1);
    setCurrentDigitalPage(1);
  }, [selectedCategory]);

  // --- Filtres ---
  const filteredVideos =
    selectedCategory === "all" || selectedCategory === "video" ? videos : [];

  const filteredPhotos =
    selectedCategory === "all" || selectedCategory === "photo" ? photos : [];

  const filteredDigitalProjects =
    selectedCategory === "all" || selectedCategory === "digital"
      ? digitalProjects
      : [];

  // --- Pagination ---
  const totalVideoPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
  const startVideoIndex = (currentVideoPage - 1) * ITEMS_PER_PAGE;
  const paginatedVideos = filteredVideos.slice(startVideoIndex, startVideoIndex + ITEMS_PER_PAGE);

  const totalPhotoPages = Math.ceil(filteredPhotos.length / ITEMS_PER_PAGE);
  const startPhotoIndex = (currentPhotoPage - 1) * ITEMS_PER_PAGE;
  const paginatedPhotos = filteredPhotos.slice(startPhotoIndex, startPhotoIndex + ITEMS_PER_PAGE);

  const totalDigitalPages = Math.ceil(filteredDigitalProjects.length / ITEMS_PER_PAGE);
  const startDigitalIndex = (currentDigitalPage - 1) * ITEMS_PER_PAGE;
  const paginatedDigitalProjects = filteredDigitalProjects.slice(startDigitalIndex, startDigitalIndex + ITEMS_PER_PAGE);

  // --- Fonctions de navigation du carousel ---
  const nextPhotoImage = () => {
    if (selectedPhoto && selectedPhoto.images.length > 0) {
      setCurrentPhotoImageIndex((prev) =>
        prev === selectedPhoto.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhotoImage = () => {
    if (selectedPhoto && selectedPhoto.images.length > 0) {
      setCurrentPhotoImageIndex((prev) =>
        prev === 0 ? selectedPhoto.images.length - 1 : prev - 1
      );
    }
  };

  const getFirstPhotoImage = (photo: PhotoItem): string => {
    if (photo.images && photo.images.length > 0) {
      return photo.images[0].imageUrl;
    }
    return "/placeholder.svg";
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-accent-neutral/10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* ===== FILTERS SECTION ===== */}
      <section className="border-b border-border bg-secondary/30 py-6">
        <div className="container mx-auto">
          <Grid
            container
            display="flex"
            flexWrap="wrap"
            alignItems="center"
            justifyContent="center"
            gap={2}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? cat.color === "primary"
                      ? "bg-primary text-primary-foreground"
                      : cat.color === "tertiary"
                        ? "bg-tertiary text-white"
                        : cat.color === "blue"
                          ? "bg-blue-500 text-white"
                          : "bg-accent-warm text-white"
                    : "bg-card text-muted-foreground hover:bg-accent-neutral"
                }`}
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </button>
            ))}
          </Grid>
        </div>
      </section>

      {/* ===== VIDEOS SECTION ===== */}
      {filteredVideos.length > 0 && (
        <section className="py-8 bg-accent-neutral/20">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center gap-3">
              <Video className="h-6 w-6 text-tertiary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Vidéos</h2>
              <Badge variant="secondary" className="ml-2">{filteredVideos.length}</Badge>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {paginatedVideos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className="group relative aspect-video overflow-hidden rounded-xl bg-card text-left shadow-sm transition-all hover:shadow-lg"
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/30 transition-colors group-hover:bg-foreground/40">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-tertiary text-white transition-transform group-hover:scale-110">
                      <Play className="h-6 w-6 fill-current" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/90 to-transparent p-4">
                    <p className="font-medium text-white line-clamp-1">{video.title}</p>
                    <p className="mt-1 text-xs text-white/70">{video.client}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination Videos */}
            {totalVideoPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentVideoPage((prev) => Math.max(prev - 1, 1))} disabled={currentVideoPage === 1}>Précédent</Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalVideoPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentVideoPage(page)}
                      className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${currentVideoPage === page ? "bg-tertiary text-white" : "bg-card text-muted-foreground hover:bg-accent-neutral"}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentVideoPage((prev) => Math.min(prev + 1, totalVideoPages))} disabled={currentVideoPage === totalVideoPages}>Suivant</Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== PHOTOS SECTION ===== */}
      {filteredPhotos.length > 0 && (
        <section className={`py-8 ${filteredVideos.length > 0 ? "bg-secondary/20" : "bg-accent-neutral/20"}`}>
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center gap-3">
              <Camera className="h-6 w-6 text-accent-warm" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Photographies</h2>
              <Badge variant="secondary" className="ml-2">{filteredPhotos.length}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {paginatedPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group relative aspect-[5/3] overflow-hidden rounded-xl text-left bg-gray-100"
                >
                  <img
                    src={getFirstPhotoImage(photo)}
                    alt={photo.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {photo.images && photo.images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Camera className="h-3 w-3" />
                      {photo.images.length}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="absolute bottom-4 left-4 right-4">
                      <Badge className={`mb-2 ${index % 3 === 0 ? "bg-primary/90" : index % 3 === 1 ? "bg-tertiary/90" : "bg-accent-warm/90"} text-white`}>
                        {photo.category}
                      </Badge>
                      <p className="font-medium text-white line-clamp-1">{photo.title}</p>
                      <p className="mt-1 text-xs text-white/70">{photo.client}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination Photos */}
            {totalPhotoPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPhotoPage((prev) => Math.max(prev - 1, 1))} disabled={currentPhotoPage === 1}>Précédent</Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPhotoPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPhotoPage(page)}
                      className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${currentPhotoPage === page ? "bg-accent-warm text-white" : "bg-card text-muted-foreground hover:bg-accent-neutral"}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPhotoPage((prev) => Math.min(prev + 1, totalPhotoPages))} disabled={currentPhotoPage === totalPhotoPages}>Suivant</Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== DIGITAL PROJECTS SECTION ===== */}
      {filteredDigitalProjects.length > 0 && (
        <section className={`py-8 ${filteredVideos.length > 0 || filteredPhotos.length > 0 ? "bg-accent-neutral/10" : "bg-accent-neutral/20"}`}>
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center gap-3">
              <Globe className="h-6 w-6 text-blue-500" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Projets Digitaux</h2>
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">{filteredDigitalProjects.length}</Badge>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {paginatedDigitalProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedDigitalProject(project)}
                  className="group relative overflow-hidden rounded-xl bg-card text-left shadow-sm transition-all hover:shadow-lg border border-border hover:border-blue-200"
                >
                  <div className="aspect-video overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
                    <img
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-500/0 transition-all group-hover:bg-blue-500/20">
                      <div className="opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg">
                          <ExternalLink className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-foreground line-clamp-1 group-hover:text-blue-500 transition-colors">{project.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {project.technologies.slice(0, 3).map((tech, techIndex) => (
                          <Badge key={techIndex} variant="secondary" className="text-xs bg-blue-50 text-blue-600 border-blue-100">{tech}</Badge>
                        ))}
                        {project.technologies.length > 3 && <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">+{project.technologies.length - 3}</Badge>}
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                      <span className="font-medium">{project.client}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{project.date}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination Digital */}
            {totalDigitalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentDigitalPage((prev) => Math.max(prev - 1, 1))} disabled={currentDigitalPage === 1}>Précédent</Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalDigitalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentDigitalPage(page)}
                      className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${currentDigitalPage === page ? "bg-blue-500 text-white" : "bg-card text-muted-foreground hover:bg-accent-neutral"}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentDigitalPage((prev) => Math.min(prev + 1, totalDigitalPages))} disabled={currentDigitalPage === totalDigitalPages}>Suivant</Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== EMPTY STATE ===== */}
      {filteredVideos.length === 0 && filteredPhotos.length === 0 && filteredDigitalProjects.length === 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto max-w-md">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-accent-neutral/50 p-4">
                  <Filter className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground">Aucune réalisation trouvée</h3>
              <p className="mt-2 text-muted-foreground">Il n'y a pas encore de contenu dans cette catégorie.</p>
              <Button variant="outline" className="mt-4" onClick={() => setSelectedCategory("all")}>Voir toutes les réalisations</Button>
            </div>
          </div>
        </section>
      )}

      {/* ===== VIDEO MODAL ===== */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl bg-card p-0 overflow-hidden">
          <DialogTitle className="sr-only">{selectedVideo?.title || "Vidéo"}</DialogTitle>
          <div className="relative">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray-800 shadow-md"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="aspect-video bg-black w-full">
              {selectedVideo && getYouTubeVideoId(selectedVideo.videoUrl) ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedVideo.videoUrl)}?autoplay=1&rel=0`}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white"><p>Vidéo indisponible</p></div>
              )}
            </div>
            {selectedVideo && (
              <div className="p-6">
                <h3 className="font-heading text-xl font-semibold text-foreground">{selectedVideo.title}</h3>
                <p className="mt-2 text-muted-foreground">{selectedVideo.description}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="outline" className="border-tertiary/30 text-tertiary">{selectedVideo.client}</Badge>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {selectedVideo.date}</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== PHOTO MODAL (FIXED IMAGE SCALING & ADDED DRIVELINK) ===== */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}  >
        <DialogContent className="max-w-3xl bg-card p-0 overflow-hidden  max-h-[90vh] mt-8 z-[1000]">
          <DialogTitle className="sr-only">{selectedPhoto?.title || "Photo"}</DialogTitle>
          <Grid container  className="relative">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 backdrop-blur-sm"
            >
              <X className="h-4 w-4" />
            </button>
            {selectedPhoto && (
              <>
                {/* Image principale avec style corrigé pour éviter l'étirement */}
                <div className="bg-black/95 flex items-center justify-center min-h-[200px] h-[60vh] relative w-full">
                  <img
                    src={selectedPhoto.images && selectedPhoto.images.length > 0 ? selectedPhoto.images[currentPhotoImageIndex]?.imageUrl : "/placeholder.svg"}
                    alt={`${selectedPhoto.title} - Image ${currentPhotoImageIndex + 1}`}
                    // CORRECTION ICI : w-auto + max-w-full + mx-auto garantit que l'image ne s'élargit pas au-delà de sa taille réelle ou du conteneur
                    className="w-auto h-auto max-w-full max-h-full object-contain mx-auto shadow-2xl"
                  />

                  {/* Navigation arrows si plusieurs images */}
                  {selectedPhoto.images && selectedPhoto.images.length > 1 && (
                    <>
                      <button onClick={prevPhotoImage} className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 backdrop-blur-sm">
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button onClick={nextPhotoImage} className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 backdrop-blur-sm">
                        <ChevronRight className="h-6 w-6" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                        {selectedPhoto.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoImageIndex(index)}
                            className={`h-2 w-2 rounded-full transition-colors ${index === currentPhotoImageIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {selectedPhoto.images && selectedPhoto.images.length > 1 && (
                  <Grid container justifyContent={"center"} className="flex gap-2 p-4 overflow-x-auto bg-gray-50 border-b border-border" >
                    {selectedPhoto.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${index === currentPhotoImageIndex ? "border-accent-warm ring-2 ring-accent-warm/20" : "border-transparent hover:border-gray-300"}`}
                      >
                        <img src={img.imageUrl} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </Grid >
                )}

                <div className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                        <h3 className="font-heading text-xl font-semibold text-foreground">{selectedPhoto.title}</h3>
                        <p className="mt-2 text-muted-foreground">{selectedPhoto.description}</p>
                        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="bg-accent-warm/10 text-accent-warm">{selectedPhoto.client}</Badge>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {selectedPhoto.date}</span>
                            {selectedPhoto.images && selectedPhoto.images.length > 1 && (
                            <span className="flex items-center gap-1 text-muted-foreground"><Camera className="h-3 w-3" />{currentPhotoImageIndex + 1} / {selectedPhoto.images.length}</span>
                            )}
                        </div>
                    </div>
                    
                    {/* AJOUT : Bouton Drive Link */}
                    {selectedPhoto.driveLink && (
                        <div className="w-full sm:w-auto mt-4 sm:mt-0">
                            <Button asChild className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white gap-2">
                                <a href={selectedPhoto.driveLink} target="_blank" rel="noopener noreferrer">
                                    <Cloud className="h-4 w-4" />
                                    Voir dossier Drive
                                </a>
                            </Button>
                        </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* ===== DIGITAL PROJECT MODAL ===== */}
      <Dialog open={!!selectedDigitalProject} onOpenChange={() => setSelectedDigitalProject(null)}>
        <DialogContent className="max-w-4xl bg-card p-0 overflow-hidden">
          <DialogTitle className="sr-only">{selectedDigitalProject?.title || "Projet Digital"}</DialogTitle>
          <div className="relative">
            <button
              onClick={() => setSelectedDigitalProject(null)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 backdrop-blur-sm"
            >
              <X className="h-4 w-4" />
            </button>
            {selectedDigitalProject && (
              <>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center min-h-[300px]">
                  <img src={selectedDigitalProject.image || "/placeholder.svg"} alt={selectedDigitalProject.title} className="w-full max-h-[50vh] object-contain" />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-heading text-xl font-semibold text-foreground">{selectedDigitalProject.title}</h3>
                      <p className="mt-2 text-muted-foreground">{selectedDigitalProject.description}</p>
                    </div>
                  </div>
                  {selectedDigitalProject.technologies && selectedDigitalProject.technologies.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-foreground mb-2">Technologies utilisées :</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedDigitalProject.technologies.map((tech, index) => (
                            <Badge key={index} className="bg-blue-100 text-blue-700 hover:bg-blue-200">{tech}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="outline" className="border-blue-200 text-blue-600">{selectedDigitalProject.client}</Badge>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{selectedDigitalProject.date}</span>
                  </div>
                  {selectedDigitalProject.projectUrl && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <Button asChild className="bg-blue-500 text-white hover:bg-blue-600">
                        <a href={selectedDigitalProject.projectUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                          <Globe className="h-4 w-4" />Visiter le projet<ArrowRight className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 bg-gradient-to-br from-tertiary/10 via-blue-50/50 to-accent-warm/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">Vous avez un projet en tête ?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Discutons de vos besoins et créons ensemble des contenus qui marquent.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-tertiary text-white hover:bg-tertiary/90">
              <Link href="/contact" className="inline-flex items-center gap-2">Demander un devis<ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/services" className="inline-flex items-center gap-2">Voir nos services</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}