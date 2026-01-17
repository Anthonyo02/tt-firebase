"use client";


import React, { createContext, useContext } from "react";
import { useConnectionStatus, ConnectionStatus } from "../hooks/useConnectionStatus";

interface ConnectionContextType {
  status: ConnectionStatus;
  isStable: boolean;
  isUnstable: boolean;
  isPoor: boolean;       // ✅ nouveau statut ajouté
  isOffline: boolean;
}

const ConnectionContext = createContext<ConnectionContextType | null>(null);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    status,
    isStable,
    isUnstable,
    isPoor,       // ✅ récupérer le nouveau statut du hook
    isOffline,
  } = useConnectionStatus();

  return (
    <ConnectionContext.Provider
      value={{
        status,
        isStable,
        isUnstable,
        isPoor,
        isOffline,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const ctx = useContext(ConnectionContext);
  if (!ctx) {
    throw new Error("useConnection doit être utilisé dans ConnectionProvider");
  }
  return ctx;
};
