"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import storage from "../lib/localforage";

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

// ✅ NOUVELLE INTERFACE CHECKLIST
export interface CheckList {
  id: string;
  titre: string;
  lieu: string;
  lieu_link: string;
  date_debut: string;
  responsable: string[];
  materiel: { id: string; nom: string; utiliser: number }[];
  description: string;
}

export interface OfflineItem {
  id: string;
  type: "projet" | "materiel" | "user" | "checklist"; // ✅ Ajout "checklist"
  action: "create" | "update" | "delete";
  data: any;
  timestamp: number;
}

// =======================
// CONTEXT
// =======================

interface DataContextType {
  projets: Projet[];
  materiels: Materiel[];
  checklists: CheckList[]; // ✅ NOUVEAU
  offlineQueue: OfflineItem[];
  users: User[];
  references: string[];
  categorie: string[];
  teamMembers: string[];
  isLoading: boolean;
  isOnline: boolean;
  setIsLoad: (isLoading: boolean) => void;
  fetchProjets: () => Promise<void>;
  fetchMateriels: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchChecklists: () => Promise<void>; // ✅ NOUVEAU
  addProjet: (projet: Omit<Projet, "id">) => Promise<void>;
  updateProjet: (id: string, projet: Partial<Projet>) => Promise<void>;
  deleteProjet: (id: string) => Promise<void>;
  addMateriel: (materiel: Omit<Materiel, "id">) => Promise<void>;
  updateMateriel: (id: string, materiel: Partial<Materiel>) => Promise<void>;
  deleteMateriel: (id: string, imagePublicId?: string) => Promise<void>;
  addUser: (user: Omit<User, "id">) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addChecklist: (checklist: Omit<CheckList, "id">) => Promise<void>; // ✅ NOUVEAU
  updateChecklist: (id: string, checklist: Partial<CheckList>) => Promise<void>; // ✅ NOUVEAU
  deleteChecklist: (id: string) => Promise<void>; // ✅ NOUVEAU
  addTeamMember: (name: string) => void;
  addReference: (ref: string) => void;
  syncOfflineData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// =======================
// PROVIDER
// =======================

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [checklists, setChecklists] = useState<CheckList[]>([]); // ✅ NOUVEAU STATE
  const [users, setUsers] = useState<User[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<OfflineItem[]>([]);
  const [references, setReferences] = useState<string[]>([]);
  const [categorie, setCategorie] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<string[]>([
    "Miary",
    "Oly",
    "Aina",
    "Thony",
    "Dio",
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoad, setIsLoad] = useState(false);

  // =======================
  // STORAGE UTILS
  // =======================
  const saveToStorage = useCallback(async (key: string, data: any) => {
    try {
      await storage.setItem(key, data);
    } catch (err) {
      console.error(`Erreur saving ${key} to localForage:`, err);
    }
  }, []);

  // =======================
  // OFFLINE DETECTION
  // =======================
  useEffect(() => {
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

  // =======================
  // LOAD LOCAL DATA
  // =======================
  const handleLoad = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        storedProjets,
        storedMateriels,
        storedChecklists, // ✅ NOUVEAU
        storedUsers,
        storedRefs,
        storedCat,
        storedTeam,
        storedQueue,
      ] = await Promise.all([
        storage.getItem<Projet[]>("projets"),
        storage.getItem<Materiel[]>("materiels"),
        storage.getItem<CheckList[]>("checklists"), // ✅ NOUVEAU
        storage.getItem<User[]>("users"),
        storage.getItem<string[]>("references"),
        storage.getItem<string[]>("categorie"),
        storage.getItem<string[]>("teamMembers"),
        storage.getItem<OfflineItem[]>("offlineQueue"),
      ]);

      if (storedProjets) setProjets(storedProjets);
      if (storedMateriels) setMateriels(storedMateriels);
      if (storedChecklists) setChecklists(storedChecklists); // ✅ NOUVEAU
      if (storedUsers) setUsers(storedUsers);
      if (storedRefs) setReferences(storedRefs);
      if (storedCat) setCategorie(storedCat);
      if (storedTeam) setTeamMembers(storedTeam);
      if (storedQueue) setOfflineQueue(storedQueue);
    } catch (error) {
      console.error("Erreur chargement localForage:", error);
    } finally {
      setIsLoading(false);
      if (navigator.onLine) {
        setTimeout(() => {
          fetchProjets();
          fetchMateriels();
          fetchChecklists(); // ✅ NOUVEAU
          fetchUsers();
        }, 1000);
      }
    }
  }, []);

  useEffect(() => {
    if (isLoad) {
      handleLoad();
      setIsLoad(false);
    }
  }, [isLoad, handleLoad]);

  useEffect(() => {
    handleLoad();
  }, []);

  // =======================
  // FETCH FIRESTORE
  // =======================

  const fetchUsers = async () => {
    if (!navigator.onLine) return;

    try {
      const snapshot = await getDocs(collection(db, "users"));
      if (snapshot.empty && users.length > 0) return;

      const formatted: User[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        formatted.push({
          id: doc.id,
          nom: data.nom || "",
          email: data.email || "",
          role: data.role || "employer",
        });
      });

      setUsers(formatted);
      await saveToStorage("users", formatted);
    } catch (err) {
      console.error("fetchUsers error:", err);
    }
  };

  const fetchProjets = async () => {
    if (!navigator.onLine) return;

    try {
      const snapshot = await getDocs(collection(db, "projets"));
      if (snapshot.empty && projets.length > 0) return;

      const formatted: Projet[] = [];
      snapshot.forEach((doc) => {
        const p = doc.data();
        formatted.push({
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

      setProjets(formatted);
      await saveToStorage("projets", formatted);
    } catch (err) {
      console.error("fetchProjets error:", err);
    }
  };

  const fetchMateriels = async () => {
    if (!navigator.onLine) return;

    try {
      const snapshot = await getDocs(collection(db, "materiels"));
      if (snapshot.empty && materiels.length > 0) return;

      const formatted: Materiel[] = [];
      snapshot.forEach((doc) => {
        const m = doc.data();
        formatted.push({
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

      setMateriels(formatted);
      await saveToStorage("materiels", formatted);

      const refs = [...new Set(formatted.map((m) => m.reference).filter(Boolean))];
      setReferences(refs);
      await saveToStorage("references", refs);

      const cats = [...new Set(formatted.map((m) => m.comentaire).filter(Boolean))];
      setCategorie(cats);
      await saveToStorage("categorie", cats);
    } catch (err) {
      console.error("fetchMateriels error:", err);
    }
  };

  // ✅ NOUVEAU: FETCH CHECKLISTS
  const fetchChecklists = async () => {
    if (!navigator.onLine) return;

    try {
      const snapshot = await getDocs(collection(db, "checklists"));
      if (snapshot.empty && checklists.length > 0) return;

      const formatted: CheckList[] = [];
      snapshot.forEach((doc) => {
        const c = doc.data();
        formatted.push({
          id: doc.id,
          titre: c.titre || "",
          lieu: c.lieu || "",
          lieu_link: c.lieu_link || "",
          date_debut: c.date_debut || "",
          responsable: Array.isArray(c.responsable) ? c.responsable : [],
          materiel: Array.isArray(c.materiel) ? c.materiel : [],
          description: c.description || "",
        });
      });

      setChecklists(formatted);
      await saveToStorage("checklists", formatted);
    } catch (err) {
      console.error("fetchChecklists error:", err);
    }
  };

  // =======================
  // CRUD & OFFLINE QUEUE
  // =======================
  const addToOfflineQueue = async (item: Omit<OfflineItem, "timestamp">) => {
    const newItem = { ...item, timestamp: Date.now() };
    const newQueue = [...offlineQueue, newItem];
    setOfflineQueue(newQueue);
    await saveToStorage("offlineQueue", newQueue);
  };

  // --- USERS ---
  const addUser = async (user: Omit<User, "id">) => {
    const tempId = `temp_${Date.now()}`;
    const newUser = { ...user, id: tempId };
    setUsers((prev) => [...prev, newUser]);
    await saveToStorage("users", [...users, newUser]);

    try {
      await addDoc(collection(db, "users"), user);
      if (navigator.onLine) await fetchUsers();
    } catch {
      await addToOfflineQueue({ id: tempId, type: "user", action: "create", data: user });
    }
  };

  const updateUser = async (id: string, user: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...user } : u)));
    await saveToStorage("users", users);

    try {
      const ref = doc(db, "users", id);
      await updateDoc(ref, user);
    } catch {
      await addToOfflineQueue({ id, type: "user", action: "update", data: user });
    }
  };

  const deleteUser = async (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    await saveToStorage("users", users);

    try {
      await deleteDoc(doc(db, "users", id));
    } catch {
      await addToOfflineQueue({ id, type: "user", action: "delete", data: null });
    }
  };

  // --- PROJETS ---
  const addProjet = async (projet: Omit<Projet, "id">) => {
    const tempId = `temp_${Date.now()}`;
    const newProjet = { ...projet, id: tempId };
    setProjets((prev) => [...prev, newProjet]);
    await saveToStorage("projets", [...projets, newProjet]);

    try {
      await addDoc(collection(db, "projets"), projet);
      if (navigator.onLine) await fetchProjets();
    } catch {
      await addToOfflineQueue({ id: tempId, type: "projet", action: "create", data: projet });
    }
  };

  const updateProjet = async (id: string, projet: Partial<Projet>) => {
    setProjets((prev) => prev.map((p) => (p.id === id ? { ...p, ...projet } : p)));
    await saveToStorage("projets", projets);

    try {
      await updateDoc(doc(db, "projets", id), projet);
    } catch {
      await addToOfflineQueue({ id, type: "projet", action: "update", data: projet });
    }
  };

  const deleteProjet = async (id: string) => {
    setProjets((prev) => prev.filter((p) => p.id !== id));
    await saveToStorage("projets", projets);

    try {
      await deleteDoc(doc(db, "projets", id));
    } catch {
      await addToOfflineQueue({ id, type: "projet", action: "delete", data: null });
    }
  };

  // --- MATERIELS ---
  const addMateriel = async (materiel: Omit<Materiel, "id">) => {
    const tempId = `temp_${Date.now()}`;
    const newMateriel = { ...materiel, id: tempId, quantites: Number(materiel.quantites) };
    setMateriels((prev) => [...prev, newMateriel]);
    await saveToStorage("materiels", [...materiels, newMateriel]);

    try {
      await addDoc(collection(db, "materiels"), materiel);
      if (navigator.onLine) await fetchMateriels();
    } catch {
      await addToOfflineQueue({ id: tempId, type: "materiel", action: "create", data: materiel });
    }
  };

  const updateMateriel = async (id: string, materiel: Partial<Materiel>) => {
    setMateriels((prev) => prev.map((m) => (m.id === id ? { ...m, ...materiel } : m)));
    await saveToStorage("materiels", materiels);

    try {
      await updateDoc(doc(db, "materiels", id), materiel);
    } catch {
      await addToOfflineQueue({ id, type: "materiel", action: "update", data: materiel });
    }
  };

  const deleteMateriel = async (id: string) => {
    setMateriels((prev) => prev.filter((m) => m.id !== id));
    await saveToStorage("materiels", materiels);

    try {
      await deleteDoc(doc(db, "materiels", id));
    } catch {
      await addToOfflineQueue({ id, type: "materiel", action: "delete", data: null });
    }
  };

  // ✅ NOUVEAU: CRUD CHECKLISTS
  const addChecklist = async (checklist: Omit<CheckList, "id">) => {
    const tempId = `temp_${Date.now()}`;
    const newChecklist = { ...checklist, id: tempId };
    setChecklists((prev) => [...prev, newChecklist]);
    await saveToStorage("checklists", [...checklists, newChecklist]);

    try {
      await addDoc(collection(db, "checklists"), checklist);
      if (navigator.onLine) await fetchChecklists();
    } catch {
      await addToOfflineQueue({ id: tempId, type: "checklist", action: "create", data: checklist });
    }
  };

  const updateChecklist = async (id: string, checklist: Partial<CheckList>) => {
    setChecklists((prev) => prev.map((c) => (c.id === id ? { ...c, ...checklist } : c)));
    await saveToStorage("checklists", checklists);

    try {
      await updateDoc(doc(db, "checklists", id), checklist);
    } catch {
      await addToOfflineQueue({ id, type: "checklist", action: "update", data: checklist });
    }
  };

  const deleteChecklist = async (id: string) => {
    setChecklists((prev) => prev.filter((c) => c.id !== id));
    await saveToStorage("checklists", checklists);

    try {
      await deleteDoc(doc(db, "checklists", id));
    } catch {
      await addToOfflineQueue({ id, type: "checklist", action: "delete", data: null });
    }
  };

  // =======================
  // TEAM & REFERENCE
  // =======================
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

  // =======================
  // SYNC OFFLINE
  // =======================
  const syncOfflineData = async () => {
    if (!navigator.onLine || offlineQueue.length === 0) return;

    console.log("Syncing offline queue...");
    for (const item of offlineQueue) {
      try {
        switch (item.type) {
          case "user":
            if (item.action === "create") await addDoc(collection(db, "users"), item.data);
            else if (item.action === "update") await updateDoc(doc(db, "users", item.id), item.data);
            else if (item.action === "delete") await deleteDoc(doc(db, "users", item.id));
            break;
          case "projet":
            if (item.action === "create") await addDoc(collection(db, "projets"), item.data);
            else if (item.action === "update") await updateDoc(doc(db, "projets", item.id), item.data);
            else if (item.action === "delete") await deleteDoc(doc(db, "projets", item.id));
            break;
          case "materiel":
            if (item.action === "create") await addDoc(collection(db, "materiels"), item.data);
            else if (item.action === "update") await updateDoc(doc(db, "materiels", item.id), item.data);
            else if (item.action === "delete") await deleteDoc(doc(db, "materiels", item.id));
            break;
          // ✅ NOUVEAU: SYNC CHECKLISTS
          case "checklist":
            if (item.action === "create") await addDoc(collection(db, "checklists"), item.data);
            else if (item.action === "update") await updateDoc(doc(db, "checklists", item.id), item.data);
            else if (item.action === "delete") await deleteDoc(doc(db, "checklists", item.id));
            break;
        }
      } catch (err) {
        console.error("Sync offline item failed:", item, err);
      }
    }

    setOfflineQueue([]);
    await saveToStorage("offlineQueue", []);
    await fetchProjets();
    await fetchMateriels();
    await fetchChecklists(); // ✅ NOUVEAU
    await fetchUsers();
  };

  // =======================
  // PROVIDER RETURN
  // =======================
  return (
    <DataContext.Provider
      value={{
        projets,
        materiels,
        checklists, // ✅ NOUVEAU
        users,
        offlineQueue,
        references,
        categorie,
        teamMembers,
        isLoading,
        isOnline,
        setIsLoad,
        fetchProjets,
        fetchMateriels,
        fetchChecklists, // ✅ NOUVEAU
        fetchUsers,
        addProjet,
        updateProjet,
        deleteProjet,
        addMateriel,
        updateMateriel,
        deleteMateriel,
        addUser,
        updateUser,
        deleteUser,
        addChecklist, // ✅ NOUVEAU
        updateChecklist, // ✅ NOUVEAU
        deleteChecklist, // ✅ NOUVEAU
        addTeamMember,
        addReference,
        syncOfflineData,
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