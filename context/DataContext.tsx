"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

// ✅ Import Firebase
import { db } from "../lib/firebase"; // Vérifie le chemin !
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";

// ❌ On supprime Axios et les URLs Google Script
// import axios from "axios";

const syncLocalStorage = <T,>(
  key: string,
  apiData: T[],
  currentData: T[]
): T[] => {
  const apiString = JSON.stringify(apiData);
  const localString = JSON.stringify(currentData);

  if (apiString !== localString) {
    localStorage.setItem(key, apiString);
    return apiData; // 🔄 on remplace le state
  }

  return currentData; // ✅ rien à faire
};

// =======================
// INTERFACES
// =======================

export interface User {
  id: string;
  nom: string;
  email: string;
  role: string;
}

export interface Materiel {
  id: string;
  nom: string;
  quantites: number;
  reference: string;
  referenceNum: string;
  description: string;
  statut: string;
  comentaire: string;
  imageUrl?: string;
  imagePublicId?: string; // ✅ OBLIGATOIRE
}

export interface Projet {
  id: string;
  titre: string;
  lieu: string;
  lieu_link: string;
  date_debut: string;
  date_fin?: string;
  responsable: string;
  equipe: string[];
  materiel: { id: string; nom: string; utiliser: number }[];
  detail: string;
  status: "en cours" | "terminer" | "annuller";
  commentaire: string;
}

// L'offline queue est moins nécessaire avec Firebase (qui gère ça en natif),
// mais on garde la structure pour ne pas casser ton app.
export interface OfflineItem {
  id: string;
  type: "projet" | "materiel" | "user";
  action: "create" | "update" | "delete";
  data: any;
  timestamp: number;
}

interface DataContextType {
  projets: Projet[];
  materiels: Materiel[];
  offlineQueue: OfflineItem[];
  isLoading: boolean;
  setIsLoad: (isLoading: boolean) => void;
  isOnline: boolean;
  fetchProjets: () => Promise<void>;
  fetchMateriels: () => Promise<void>;
  addProjet: (projet: Omit<Projet, "id">) => Promise<void>;
  updateProjet: (id: string, projet: Partial<Projet>) => Promise<void>;
  deleteProjet: (id: string) => Promise<void>;
  addMateriel: (materiel: Omit<Materiel, "id">) => Promise<void>;
  updateMateriel: (id: string, materiel: Partial<Materiel>) => Promise<void>;
  deleteMateriel: (id: string) => Promise<void>;
  syncOfflineData: () => Promise<void>;
  references: string[];
  categorie: string[];
  teamMembers: string[];
  addTeamMember: (name: string) => void;
  addReference: (ref: string) => void;
  users: User[];
  fetchUsers: () => Promise<void>;
  addUser: (user: Omit<User, "id">) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<OfflineItem[]>([]);
  const [isLoad, setIsLoad] = useState(false); // Utilisé pour trigger le reload
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [references, setReferences] = useState<string[]>([]);
  const [categorie, setCategorie] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [teamMembers, setTeamMembers] = useState<string[]>([
    "Miary",
    "Oly",
    "Aina",
    "Thony",
    "Dio",
  ]);

  // =======================
  // INITIALISATION
  // =======================

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const saveToLocalStorage = useCallback((key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, []);

  const handleLoad = useCallback(() => {
    // Load from localStorage first
    const storedProjets = localStorage.getItem("projets");
    const storedMateriels = localStorage.getItem("materiels");
    const storeUsers = localStorage.getItem("users");
    const storedRefs = localStorage.getItem("references");
    const storeCat = localStorage.getItem("categorie");
    const storedTeam = localStorage.getItem("teamMembers");

    if (storedProjets) setProjets(JSON.parse(storedProjets));
    if (storedMateriels) setMateriels(JSON.parse(storedMateriels));
    if (storeUsers) setUsers(JSON.parse(storeUsers));
    if (storeCat) setCategorie(JSON.parse(storeCat));
    if (storedRefs) setReferences(JSON.parse(storedRefs));
    if (storedTeam) setTeamMembers(JSON.parse(storedTeam));

    // Then fetch from Firebase
    fetchProjets();
    fetchMateriels();
    fetchUsers();
  }, []);

  // Déclencheur manuel via setIsLoad
  useEffect(() => {
    if (isLoad) {
      handleLoad();
      setIsLoad(false);
    }
  }, [isLoad, handleLoad]);

  // Chargement initial
  useEffect(() => {
    handleLoad();
  }, []);

  // =======================
  // 🔥 USERS (FIRESTORE)
  // =======================
  const fetchUsers = async () => {
    // Note: Firebase gère le cache offline, donc on peut appeler même si "offline"
    // Mais pour garder ta logique, on check isOnline si tu veux économiser les reads
    // if (!isOnline) return;

    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const formattedUsers: User[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        formattedUsers.push({
          id: doc.id,
          nom: data.nom || "",
          email: data.email || "",
          role: data.role || "employer",
        });
      });

      const employerUsers = formattedUsers;

      setUsers((prev) => syncLocalStorage("users", employerUsers, prev));
      saveToLocalStorage("users", employerUsers);
      console.log("olona be de be " + JSON.stringify(employerUsers));
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addUser = async (user: Omit<User, "id">) => {
    // Optimistic Update
    const tempId = `temp_${Date.now()}`;
    const newUser = { ...user, id: tempId };

    setUsers((prev) => {
      const updated = [...prev, newUser];
      saveToLocalStorage("users", updated);
      return updated;
    });

    try {
      await addDoc(collection(db, "users"), user);
      await fetchUsers(); // Refresh pour avoir le vrai ID
    } catch (error) {
      console.error("Erreur addUser:", error);
    }
  };

  const updateUser = async (id: string, user: Partial<User>) => {
    // Optimistic Update
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === id ? { ...u, ...user } : u));
      saveToLocalStorage("users", updated);
      return updated;
    });

    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, user);

      // Update user connecté si c'est lui-même
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.id === id) {
          localStorage.setItem(
            "user",
            JSON.stringify({ ...parsedUser, ...user })
          );
        }
      }
    } catch (error) {
      console.error("Erreur updateUser:", error);
    }
  };

  const deleteUser = async (id: string) => {
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== id);
      saveToLocalStorage("users", updated);
      return updated;
    });

    try {
      await deleteDoc(doc(db, "users", id));
    } catch (error) {
      console.error("Erreur deleteUser:", error);
    }
  };

  // =======================
  // 🔥 PROJETS (FIRESTORE)
  // =======================
  const fetchProjets = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "projets"));
      const formattedProjets: Projet[] = [];

      querySnapshot.forEach((doc) => {
        const p = doc.data();
        formattedProjets.push({
          id: doc.id,
          titre: p.titre || "",
          lieu: p.lieu || "",
          lieu_link: p.lieu_link || "",
          date_debut: p.date_debut || "",
          date_fin: p.date_fin || "",
          responsable: p.responsable || "",
          // Gestion array natif ou string csv
          equipe: Array.isArray(p.equipe) ? p.equipe : [],
          materiel: Array.isArray(p.materiel) ? p.materiel : [],
          detail: p.detail || "",
          status: p.status || "en cours",
          commentaire: p.commentaire || "",
        });
      });

      setProjets((prev) => syncLocalStorage("projets", formattedProjets, prev));
      saveToLocalStorage("projets", formattedProjets);
    } catch (error) {
      console.error("Error fetching projets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addProjet = async (projet: Omit<Projet, "id">) => {
    const tempId = `temp_${Date.now()}`;
    const newProjet = { ...projet, id: tempId };

    // 1️⃣ Sauvegarde locale IMMÉDIATE
    setProjets((prev) => {
      const updated = [...prev, newProjet];
      saveToLocalStorage("projets", updated);
      return updated;
    });

    // 2️⃣ Tentative serveur
    try {
      // Nettoyage des données pour éviter les undefined
      const cleanProjet = JSON.parse(JSON.stringify(projet));
      await addDoc(collection(db, "projets"), cleanProjet);
      // On re-fetch pour avoir le vrai ID et être clean
      fetchProjets();
    } catch (error) {
      console.error("Erreur addProjet:", error);
      // Firebase gère l'offline automatiquement, mais si grosse erreur :
      addToOfflineQueue({
        id: tempId,
        type: "projet",
        action: "create",
        data: projet,
      });
    }
  };

  const updateProjet = async (id: string, projet: Partial<Projet>) => {
    setProjets((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...projet } : p));
      saveToLocalStorage("projets", updated);
      return updated;
    });

    try {
      const projetRef = doc(db, "projets", id);
      await updateDoc(projetRef, projet);
    } catch (error) {
      console.error("Erreur updateProjet", error);
      addToOfflineQueue({ id, type: "projet", action: "update", data: projet });
    }
  };

  const deleteProjet = async (id: string) => {
    setProjets((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      saveToLocalStorage("projets", updated);
      return updated;
    });

    try {
      await deleteDoc(doc(db, "projets", id));
    } catch (error) {
      addToOfflineQueue({ id, type: "projet", action: "delete", data: null });
    }
  };

  // =======================
  // 🔥 MATÉRIELS (FIRESTORE)
  // =======================
  const fetchMateriels = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "materiels"));
      const formattedMateriels: Materiel[] = [];

      querySnapshot.forEach((doc) => {
        const m = doc.data();
        formattedMateriels.push({
          id: doc.id,
          nom: m.nom || "",
          quantites: Number(m.quantites || 0),
          reference: m.reference || "",
          referenceNum: m.referenceNum || "",
          description: m.description || "",
          statut: m.statut || "actif",
          comentaire: m.comentaire || "",
          imageUrl: m.imageUrl || "",
          imagePublicId: m.imagePublicId || "", // 🔥 AJOUT ICI
        });
      });

      setMateriels((prev) =>
        syncLocalStorage("materiels", formattedMateriels, prev)
      );
      saveToLocalStorage("materiels", formattedMateriels);

      // Extraire références et catégories
      const refs = formattedMateriels.map((m) => m.reference).filter(Boolean);
      setReferences([...new Set(refs)]);
      saveToLocalStorage("references", [...new Set(refs)]);

      const cats = formattedMateriels.map((m) => m.comentaire).filter(Boolean);
      setCategorie([...new Set(cats)]);
      saveToLocalStorage("categorie", [...new Set(cats)]);
    } catch (err) {
      console.error("fetchMateriels error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addMateriel = async (materiel: Omit<Materiel, "id">) => {
   const newMaterielData = {
  ...materiel,
  quantites: Number(materiel.quantites),
  imageUrl: materiel.imageUrl || "",
  imagePublicId: materiel.imagePublicId || "", // 🔥 OBLIGATOIRE
};

    const tempId = `temp_${Date.now()}`;

    // Optimistic update
    setMateriels((prev) => {
      const updated = [...prev, { ...newMaterielData, id: tempId }];
      saveToLocalStorage("materiels", updated);
      return updated;
    });

    try {
      await addDoc(collection(db, "materiels"), newMaterielData);
      await fetchMateriels();
    } catch (error) {
      console.error("Erreur addMateriel:", error);
    }
  };

  const updateMateriel = async (
    id: string,
    materiel: Partial<Materiel> & { imageBase64?: string; mimeType?: string }
  ) => {
    let updates: any = { ...materiel };

    if (updates.imageBase64) {
      updates.imageUrl = updates.imageBase64;
      delete updates.imageBase64;
      delete updates.mimeType;
    }

    if (updates.quantites) {
      updates.quantites = Number(updates.quantites);
    }

    // Optimistic
    setMateriels((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, ...updates } : m));
      saveToLocalStorage("materiels", updated);
      return updated;
    });

    try {
      const matRef = doc(db, "materiels", id);
      await updateDoc(matRef, updates);

      // Update refs/cats
      if (materiel.reference && !references.includes(materiel.reference)) {
        const updatedRefs = [...references, materiel.reference];
        setReferences(updatedRefs);
        saveToLocalStorage("references", updatedRefs);
      }
      if (materiel.comentaire && !categorie.includes(materiel.comentaire)) {
        const updatedCat = [...categorie, materiel.comentaire];
        setCategorie(updatedCat);
        saveToLocalStorage("categorie", updatedCat);
      }
    } catch (error) {
      console.error("Erreur updateMateriel:", error);
      addToOfflineQueue({
        id,
        type: "materiel",
        action: "update",
        data: updates,
      });
    }
  };

  const deleteMateriel = async (id: string) => {
  try {
    const ref = doc(db, "materiels", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data();

    // 🔥 1️⃣ Supprimer l'image Cloudinary
    if (data.imagePublicId) {
      await fetch("/api/cloudinary/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_id: data.imagePublicId,
        }),
      });
    }

    // 🗑️ 2️⃣ Supprimer le document Firebase
    await deleteDoc(ref);

    // 🔄 3️⃣ Mettre à jour le state
    setMateriels((prev) => prev.filter((m) => m.id !== id));
  } catch (error) {
    console.error("❌ Erreur deleteMateriel:", error);
  }
};


  // =======================
  // UTILS & OFFLINE
  // =======================

  const addToOfflineQueue = (item: Omit<OfflineItem, "timestamp">) => {
    // Firestore SDK gère la persistance offline automatiquement (si activée).
    // Mais pour garder ta logique UI :
    const newItem = { ...item, timestamp: Date.now() };
    const newQueue = [...offlineQueue, newItem];
    setOfflineQueue(newQueue);
    saveToLocalStorage("offlineQueue", newQueue);
  };

  const syncOfflineData = async () => {
    // Avec Firestore, cette fonction est moins critique car le SDK resynchronise
    // automatiquement quand la connexion revient.
    // On vide juste la file visuelle pour l'instant.
    if (offlineQueue.length > 0) {
      console.log("Syncing Firestore pending writes...");
      // Le SDK fait le travail en background.
      setOfflineQueue([]);
      saveToLocalStorage("offlineQueue", []);

      // On force un refresh
      await fetchProjets();
      await fetchMateriels();
      await fetchUsers();
    }
  };

  const addTeamMember = (name: string) => {
    if (!teamMembers.includes(name)) {
      const updated = [...teamMembers, name];
      setTeamMembers(updated);
      saveToLocalStorage("teamMembers", updated);
    }
  };

  const addReference = (ref: string) => {
    if (!references.includes(ref)) {
      const updated = [...references, ref];
      setReferences(updated);
      saveToLocalStorage("references", updated);
    }
  };

  return (
    <DataContext.Provider
      value={{
        projets,
        materiels,
        offlineQueue,
        isLoading,
        setIsLoad,
        isOnline,
        fetchProjets,
        fetchMateriels,
        addProjet,
        updateProjet,
        deleteProjet,
        addMateriel,
        updateMateriel,
        deleteMateriel,
        syncOfflineData,
        references,
        categorie,
        teamMembers,
        addTeamMember,
        addReference,
        users,
        fetchUsers,
        addUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
