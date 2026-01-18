import localforage from "localforage";

const storage = localforage.createInstance({
  name: "MonAppOffline", // Nom de ta base
  storeName: "donnees",  // Nom du store
  description: "Stockage offline pour l'application",
});

export default storage;
