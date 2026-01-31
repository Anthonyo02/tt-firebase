// hooks/useRealisationData.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { RealisationData, ImageItem } from "../types";
import { DEFAULT_DATA } from "../constants";

export function useRealisationData() {
  const [data, setData] = useState<RealisationData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false); // 👈 Optionnel: pour afficher un indicateur

  useEffect(() => {
    const docRef = doc(db, "website_content", "realisation_section");

    // ✅ ÉTAPE 1: Initialisation séparée (une seule fois au démarrage)
    const initializeDocument = async () => {
      try {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          console.log("📌 Document n'existe pas, création...");
          await setDoc(docRef, DEFAULT_DATA);
        }
      } catch (error) {
        // Probablement hors ligne, on ignore
        console.warn("⚠️ Impossible de vérifier/créer le document:", error);
      }
    };

    initializeDocument();

    // ✅ ÉTAPE 2: Listener qui N'ÉCRIT JAMAIS
    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: true }, // 👈 Important pour détecter le cache
      (snapshot) => {
        const metadata = snapshot.metadata;
        
        // Mise à jour de l'état offline
        setIsOffline(metadata.fromCache && !metadata.hasPendingWrites);

        if (snapshot.exists()) {
          const docData = snapshot.data();

          const realisationData: RealisationData = {
            videos: Array.isArray(docData.videos)
              ? docData.videos.map((v: any) => ({
                  id: v.id,
                  title: v.title || "",
                  description: v.description || "",
                  videoUrl: v.videoUrl || "",
                  client: v.client || "",
                  date: v.date || v.year || new Date().toISOString().split("T")[0],
                }))
              : DEFAULT_DATA.videos,

            photos: Array.isArray(docData.photos)
              ? docData.photos.map((p: any) => {
                  let images: ImageItem[] = [];

                  if (Array.isArray(p.images)) {
                    images = p.images.map((img: any) => ({
                      imageUrl: img.imageUrl || "",
                      imagePublicId: img.imagePublicId || "",
                    }));
                  } else if (p.image) {
                    images = [
                      {
                        imageUrl: p.image,
                        imagePublicId: p.imagePublicId || "",
                      },
                    ];
                  }

                  return {
                    id: p.id,
                    title: p.title || "",
                    description: p.description || "",
                    driveLink: p.driveLink || "",
                    images,
                    client: p.client || "",
                    date: p.date || p.year || new Date().toISOString().split("T")[0],
                  };
                })
              : DEFAULT_DATA.photos,

            digitalProjects: Array.isArray(docData.digitalProjects)
              ? docData.digitalProjects.map((dp: any) => ({
                  id: dp.id,
                  title: dp.title || "",
                  client: dp.client || "",
                  date: dp.date || new Date().toISOString().split("T")[0],
                  description: dp.description || "",
                  image: dp.image || "",
                  imagePublicId: dp.imagePublicId || "",
                  projectUrl: dp.projectUrl || "",
                  technologies: Array.isArray(dp.technologies) ? dp.technologies : [],
                }))
              : DEFAULT_DATA.digitalProjects,
          };

          setData(realisationData);
        } else {
          // ✅ NE PLUS FAIRE setDoc ICI !
          // Si le document n'existe pas ET qu'on est en ligne,
          // l'initialisation ci-dessus s'en chargera
          
          if (metadata.fromCache) {
            console.log("📴 Hors ligne - données depuis le cache");
            // Garder les données actuelles, ne rien écraser
          } else {
            console.log("⚠️ Document n'existe pas (sera créé à l'initialisation)");
            // L'initialisation async s'en charge
          }
        }

        setLoading(false);
      },
      (error) => {
        console.error("🔥 Erreur Firebase (realisation):", error);
        setLoading(false);
        // ❌ NE PAS écraser les données en cas d'erreur !
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Mise à jour partielle des données Firestore
   */
  const updateData = useCallback(
    async (newData: Partial<RealisationData>) => {
      const docRef = doc(db, "website_content", "realisation_section");
      await updateDoc(docRef, newData);
    },
    []
  );

  return {
    data,
    setData,
    loading,
    updateData,
    isOffline, // 👈 Optionnel: pour afficher un indicateur dans l'UI
  };
}