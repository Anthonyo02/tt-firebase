import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react"
import { Materiel } from "@/types/materiel"
import { v4 as uuid } from "uuid"

interface MaterielContextType {
  materiels: Materiel[]
  addMateriel: (data: Omit<Materiel, "id" | "createdAt">) => void
  updateMateriel: (id: string, data: Partial<Materiel>) => void
  deleteMateriel: (id: string) => void
}

const MaterielContext = createContext<MaterielContextType | null>(null)

export const MaterielProvider = ({ children }: { children: ReactNode }) => {
  const [materiels, setMateriels] = useState<Materiel[]>([])

  const addMateriel = (
    data: Omit<Materiel, "id" | "createdAt">
  ) => {
    setMateriels(prev => [
      ...prev,
      {
        id: uuid(),
        createdAt: new Date().toISOString(),
        ...data,
      },
    ])
  }

  const updateMateriel = (
    id: string,
    data: Partial<Materiel>
  ) => {
    setMateriels(prev =>
      prev.map(m =>
        m.id === id ? { ...m, ...data } : m
      )
    )
  }

  const deleteMateriel = (id: string) => {
    setMateriels(prev => prev.filter(m => m.id !== id))
  }

  return (
    <MaterielContext.Provider
      value={{
        materiels,
        addMateriel,
        updateMateriel,
        deleteMateriel,
      }}
    >
      {children}
    </MaterielContext.Provider>
  )
}

export const useMateriel = () => {
  const ctx = useContext(MaterielContext)
  if (!ctx) {
    throw new Error("useMateriel must be used inside MaterielProvider")
  }
  return ctx
}
