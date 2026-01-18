"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

// ✅ Import Firebase
import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

// ✅ Import LocalForage
import storage from "../lib/localforage"; // Ton fichier configuré

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
  imagePublicId?: string;
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
  deleteMateriel: (id: string, imagePublicId?: string) => Promise<void>;
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
  const [isLoad, setIsLoad] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start loading true
  const [isOnline, setIsOnline] = useState(true); // Default to true, update in effect

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
  // UTILS STORAGE
  // =======================

  // Fonction helper pour sauvegarder dans localForage (asynchrone)
  const saveToStorage = useCallback(async (key: string, data: any) => {
    try {
      await storage.setItem(key, data);
    } catch (err) {
      console.error(`Erreur saving ${key} to localForage:`, err);
    }
  }, []);

  // =======================
  // INITIALISATION
  // =======================

  useEffect(() => {
    // Check initial status
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleLoad = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Charger depuis LocalForage (Parallèle pour la vitesse)
      const [
        storedProjets,
        storedMateriels,
        storedUsers,
        storedRefs,
        storedCat,
        storedTeam,
        storedQueue
      ] = await Promise.all([
        storage.getItem<Projet[]>("projets"),
        storage.getItem<Materiel[]>("materiels"),
        storage.getItem<User[]>("users"),
        storage.getItem<string[]>("references"),
        storage.getItem<string[]>("categorie"),
        storage.getItem<string[]>("teamMembers"),
        storage.getItem<OfflineItem[]>("offlineQueue"),
      ]);

      // 2. Mettre à jour le state si données présentes
      if (storedProjets) setProjets(storedProjets);
      if (storedMateriels) setMateriels(storedMateriels);
      if (storedUsers) setUsers(storedUsers);
      if (storedRefs) setReferences(storedRefs);
      if (storedCat) setCategorie(storedCat);
      if (storedTeam) setTeamMembers(storedTeam);
      if (storedQueue) setOfflineQueue(storedQueue);

    } catch (error) {
      console.error("Erreur chargement localForage:", error);
    } finally {
      setIsLoading(false);
      
      // 3. Ensuite fetch Firebase (background update)
      if (navigator.onLine) {
        fetchProjets();
        fetchMateriels();
        fetchUsers();
      }
    }
  }, []);

  // Déclencheur manuel via setIsLoad
  useEffect(() => {
    if (isLoad) {
      handleLoad();
      setIsLoad(false);
    }
  }, [isLoad, handleLoad]);

  // Chargement initial au montage
  useEffect(() => {
    handleLoad();
  }, []);

  // =======================
  // 🔥 USERS (FIRESTORE)
  // =======================
  const fetchUsers = async () => {
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

      setUsers(formattedUsers);
      await saveToStorage("users", formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const addUser = async (user: Omit<User, "id">) => {
    const tempId = `temp_${Date.now()}`;
    const newUser = { ...user, id: tempId };

    setUsers((prev) => {
      const updated = [...prev, newUser];
      saveToStorage("users", updated); // Fire and forget
      return updated;
    });

    try {
      await addDoc(collection(db, "users"), user);
      await fetchUsers();
    } catch (error) {
      console.error("Erreur addUser:", error);
    }
  };

  const updateUser = async (id: string, user: Partial<User>) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === id ? { ...u, ...user } : u));
      saveToStorage("users", updated);
      return updated;
    });

    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, user);
      
      // Mise à jour de l'utilisateur stocké en local si c'est le current user
      const storedUser = await storage.getItem<User>("user");
      if (storedUser && storedUser.id === id) {
          await storage.setItem("user", { ...storedUser, ...user });
      }

    } catch (error) {
      console.error("Erreur updateUser:", error);
    }
  };

  const deleteUser = async (id: string) => {
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== id);
      saveToStorage("users", updated);
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
          equipe: Array.isArray(p.equipe) ? p.equipe : [],
          materiel: Array.isArray(p.materiel) ? p.materiel : [],
          detail: p.detail || "",
          status: p.status || "en cours",
          commentaire: p.commentaire || "",
        });
      });

      setProjets(formattedProjets);
      await saveToStorage("projets", formattedProjets);
    } catch (error) {
      console.error("Error fetching projets:", error);
    }
  };

  const addProjet = async (projet: Omit<Projet, "id">) => {
    const tempId = `temp_${Date.now()}`;
    const newProjet = { ...projet, id: tempId };

    setProjets((prev) => {
      const updated = [...prev, newProjet];
      saveToStorage("projets", updated);
      return updated;
    });

    try {
      const cleanProjet = JSON.parse(JSON.stringify(projet)); // Clean undefined
      await addDoc(collection(db, "projets"), cleanProjet);
      fetchProjets();
    } catch (error) {
      console.error("Erreur addProjet:", error);
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
      saveToStorage("projets", updated);
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
      saveToStorage("projets", updated);
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
          imagePublicId: m.imagePublicId || "",
        });
      });

      setMateriels(formattedMateriels);
      await saveToStorage("materiels", formattedMateriels);

      // Extraire références et catégories
      const refs = [...new Set(formattedMateriels.map((m) => m.reference).filter(Boolean))];
      setReferences(refs);
      await saveToStorage("references", refs);

      const cats = [...new Set(formattedMateriels.map((m) => m.comentaire).filter(Boolean))];
      setCategorie(cats);
      await saveToStorage("categorie", cats);

    } catch (err) {
      console.error("fetchMateriels error:", err);
    }
  };

  const addMateriel = async (materiel: Omit<Materiel, "id">) => {
    const newMaterielData = {
      ...materiel,
      quantites: Number(materiel.quantites),
      imageUrl: materiel.imageUrl || "",
      imagePublicId: materiel.imagePublicId || "",
    };

    const tempId = `temp_${Date.now()}`;

    setMateriels((prev) => {
      const updated = [...prev, { ...newMaterielData, id: tempId }];
      saveToStorage("materiels", updated);
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

    setMateriels((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, ...updates } : m));
      saveToStorage("materiels", updated);
      return updated;
    });

    try {
      const matRef = doc(db, "materiels", id);
      await updateDoc(matRef, updates);

      // Update refs/cats
      if (materiel.reference && !references.includes(materiel.reference)) {
        const updatedRefs = [...references, materiel.reference];
        setReferences(updatedRefs);
        await saveToStorage("references", updatedRefs);
      }
      if (materiel.comentaire && !categorie.includes(materiel.comentaire)) {
        const updatedCat = [...categorie, materiel.comentaire];
        setCategorie(updatedCat);
        await saveToStorage("categorie", updatedCat);
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

  const deleteMateriel = async (id: string, imagePublicId?: string) => {
    setMateriels((prev) => {
        const updated = prev.filter((m) => m.id !== id);
        saveToStorage("materiels", updated);
        return updated;
    });

    try {
      await deleteDoc(doc(db, "materiels", id));

      if (imagePublicId) {
        fetch("/api/cloudinary/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_id: imagePublicId }),
        }).catch(console.error);
      }
    } catch (error) {
      console.error("❌ deleteMateriel error:", error);
    }
  };

  // =======================
  // UTILS & OFFLINE
  // =======================

  const addToOfflineQueue = async (item: Omit<OfflineItem, "timestamp">) => {
    const newItem = { ...item, timestamp: Date.now() };
    const newQueue = [...offlineQueue, newItem];
    setOfflineQueue(newQueue);
    await saveToStorage("offlineQueue", newQueue);
  };

  const syncOfflineData = async () => {
    if (offlineQueue.length > 0) {
      console.log("Syncing Firestore pending writes...");
      setOfflineQueue([]);
      await saveToStorage("offlineQueue", []);

      await fetchProjets();
      await fetchMateriels();
      await fetchUsers();
    }
  };

  const addTeamMember = (name: string) => {
    if (!teamMembers.includes(name)) {
      const updated = [...teamMembers, name];
      setTeamMembers(updated);
      saveToStorage("teamMembers", updated);
    }
  };

  const addReference = (ref: string) => {
    if (!references.includes(ref)) {
      const updated = [...references, ref];
      setReferences(updated);
      saveToStorage("references", updated);
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