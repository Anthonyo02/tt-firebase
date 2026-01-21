"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, X, ArrowRight, Filter, Video, Camera, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Firebase Imports
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// --- Utility Functions pour YouTube ---
const getYouTubeVideoId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const getYouTubeThumbnail = (url: string) => {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "/placeholder.svg";
};

// --- Interfaces (correspondant à ton Editor) ---
interface VideoItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  client: string;
  year: string;
  thumbnail?: string; // Ajouté dynamiquement
  category?: string; // Ajouté dynamiquement
}

interface PhotoItem {
  id: string;
  title: string;
  description: string;
  image: string;
  client: string;
  year: string;
  category?: string; // Ajouté dynamiquement
}
interface RealisationProps {
  videos: VideoItem[];
  photos: PhotoItem[];
}
const categories = [
  { id: "all", label: "Tout", icon: Filter, color: "primary" },
  { id: "video", label: "Vidéo", icon: Video, color: "tertiary" },
  { id: "photo", label: "Photo", icon: Camera, color: "accent-warm" },
  // J'ai gardé 'event' au cas où tu voudrais filtrer par client plus tard, 
  // mais par défaut tes photos venant de l'éditeur seront 'photo'
  // { id: "event", label: "Événement", icon: Calendar, color: "primary" },
];

export default function Realisation() {
  // États pour les données Firebase
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // États UI
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

  // --- Récupération des données Firebase ---
  useEffect(() => {
    const docRef = doc(db, "website_content", "realisation_section");

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Transformation des Vidéos
        const loadedVideos = (data.videos || []).map((v: any) => ({
          ...v,
          category: "video", // On force la catégorie pour le filtre
          thumbnail: getYouTubeThumbnail(v.videoUrl) // On génère la thumb depuis l'URL
        }));

        // Transformation des Photos
        const loadedPhotos = (data.photos || []).map((p: any) => ({
          ...p,
          category: "photo" // On force la catégorie pour le filtre
        }));

        setVideos(loadedVideos);
        setPhotos(loadedPhotos);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- Logique de filtrage ---
  const filteredVideos =
    selectedCategory === "all" || selectedCategory === "video"
      ? videos.filter((v) => selectedCategory === "all" || v.category === selectedCategory)
      : [];

  const filteredPhotos =
    selectedCategory === "all" || selectedCategory !== "video"
      ? photos.filter((p) => selectedCategory === "all" || p.category === selectedCategory)
      : [];

  // --- Affichage Chargement ---
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-accent-neutral/10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <section className="border-b border-border bg-secondary/30 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
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
                        : "bg-accent-warm text-white"
                    : "bg-card text-muted-foreground hover:bg-accent-neutral"
                }`}
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Videos Section */}
      {filteredVideos.length > 0 && (
        <section className="py-4 bg-accent-neutral/20" >
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center gap-3">
              <Video className="h-6 w-6 text-tertiary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Vidéos</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredVideos.map((video) => (
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
          </div>
        </section>
      )}

      {/* Photos Section */}
      {filteredPhotos.length > 0 && (
        <section className={`pb-8 ${filteredVideos.length > 0 ? "bg-secondary/20" : ""}`} >
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center gap-3">
              <Camera className="h-6 w-6 text-accent-warm" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Photographies</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group relative aspect-[5/3] overflow-hidden rounded-xl text-left bg-gray-100"
                >
                  <img
                    src={photo.image || "/placeholder.svg"}
                    alt={photo.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="absolute bottom-4 left-4 right-4">
                      <Badge
                        className={`mb-2 ${index % 3 === 0 ? "bg-primary/90" : index % 3 === 1 ? "bg-tertiary/90" : "bg-accent-warm/90"} text-white`}
                      >
                        {photo.category}
                      </Badge>
                      <p className="font-medium text-white line-clamp-1">{photo.title}</p>
                      <p className="mt-1 text-xs text-white/70">{photo.client}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Video Modal (avec Iframe YouTube) */}
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
                <div className="flex h-full w-full items-center justify-center text-white">
                  <p>Vidéo indisponible</p>
                </div>
              )}
            </div>
            {selectedVideo && (
              <div className="p-6">
                <h3 className="font-heading text-xl font-semibold text-foreground">{selectedVideo.title}</h3>
                <p className="mt-2 text-muted-foreground">{selectedVideo.description}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="outline">{selectedVideo.client}</Badge>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {selectedVideo.year}
                  </span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl bg-card p-0 overflow-hidden">
          <DialogTitle className="sr-only">{selectedPhoto?.title || "Photo"}</DialogTitle>
          <div className="relative">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 backdrop-blur-sm"
            >
              <X className="h-4 w-4" />
            </button>
            {selectedPhoto && (
              <>
                <div className="bg-black/5 flex items-center justify-center min-h-[300px]">
                  <img
                    src={selectedPhoto.image || "/placeholder.svg"}
                    alt={selectedPhoto.title}
                    className="w-full max-h-[80vh] object-contain"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-heading text-xl font-semibold text-foreground">{selectedPhoto.title}</h3>
                  <p className="mt-2 text-muted-foreground">{selectedPhoto.description}</p>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="secondary">{selectedPhoto.client}</Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {selectedPhoto.year}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* CTA */}
      {/* <section className="py-20 bg-tertiary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">Vous avez un projet en tête ?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Discutons de vos besoins et créons ensemble des contenus qui marquent.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="bg-tertiary text-white hover:bg-tertiary/90">
              <Link href="/contact" className="inline-flex items-center gap-2">
                Demander un devis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section> */}
    </>
  );
}