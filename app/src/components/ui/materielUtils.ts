import { Materiel, Projet } from "@/context/DataContext";


export const calculerDisponibiliteMateriel = (
  materiel: Materiel[],
  projets: Projet[],
  date: string
) => {
  return materiel.map((m) => {
    let enUtilisation = 0;

    projets.forEach((p) => {
      const dateDebut = new Date(p.dateDebut);
      const date_fin = p.date_fin ? new Date(p.date_fin) : new Date(p.dateDebut);
      const current = new Date(date);

      if (current >= dateDebut && current <= date_fin) {
        const matProjet = p.materiel.find((pm) => pm.id === m.id);
        if (matProjet) {
          enUtilisation += matProjet.utiliser;
        }
      }
    });

    return {
      ...m,
      disponible: m.quantites - enUtilisation,
      enUtilisation,
    };
  });
};
