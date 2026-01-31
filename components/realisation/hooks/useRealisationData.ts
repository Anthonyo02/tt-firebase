// hooks/useRealisationData.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { RealisationData, ImageItem } from "../types";
import { DEFAULT_DATA } from "../constants";

/**
 * Hook pour gérer la section "Réalisation"
 * - Synchronisation temps réel avec Firestore
 * - Données par défaut auto-créées si le document n'existe pas
 */
export function useRealisationData() {
  const [data, setData] = useState<RealisationData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, "website_content", "realisation_section");

    const unsubscribe = onSnapshot(
      docRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const docData = snapshot.data();

          const realisationData: RealisationData = {
            videos: Array.isArray(docData.videos)
              ? docData.videos.map((v: any) => ({
                  id: v.id, // ⚠️ l'id DOIT déjà exister dans Firestore
                  title: v.title || "",
                  description: v.description || "",
                  
                  videoUrl: v.videoUrl || "",
                  client: v.client || "",
                  date:
                    v.date ||
                    v.year ||
                    new Date().toISOString().split("T")[0],
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
                    id: p.id, // ⚠️ id existant
                    title: p.title || "",
                    description: p.description || "",
                    driveLink: p.driveLink || "",
                    images,
                    client: p.client || "",
                    date:
                      p.date ||
                      p.year ||
                      new Date().toISOString().split("T")[0],
                  };
                })
              : DEFAULT_DATA.photos,

            digitalProjects: Array.isArray(docData.digitalProjects)
              ? docData.digitalProjects.map((dp: any) => ({
                  id: dp.id, // ⚠️ id existant
                  title: dp.title || "",
                  client: dp.client || "",
                  date:
                    dp.date ||
                    new Date().toISOString().split("T")[0],
                  description: dp.description || "",
                  image: dp.image || "",
                  imagePublicId: dp.imagePublicId || "",
                  projectUrl: dp.projectUrl || "",
                  technologies: Array.isArray(dp.technologies)
                    ? dp.technologies
                    : [],
                }))
              : DEFAULT_DATA.digitalProjects,
          };

          setData(realisationData);
        } else {
          // 📌 Création automatique du document s'il n'existe pas
          await setDoc(docRef, DEFAULT_DATA);
          setData(DEFAULT_DATA);
        }

        setLoading(false);
      },
      (error) => {
        console.error("🔥 Erreur Firebase (realisation):", error);
        setLoading(false);
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
    setData, // utile pour l'UI locale (drag & drop, preview…)
    loading,
    updateData,
  };
}
