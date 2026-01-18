"use client";

import { Button, Tooltip } from "@mui/material";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import SyncIcon from "@mui/icons-material/Sync";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import MaterielFormModalOff from "./modals/MaterielFormModalOff";
import ProjetFormModalOff from "./modals/ProjetFormModalOff";

export default function ButtonOffligne() {
  const { isOnline } = useData();
  const { user } = useAuth();

  const [label] = useState("Synchroniser");
  const [icon] = useState(<SyncIcon />);
  const [showFormMat, setShowFormMat] = useState(false);
  const [showFormPro, setShowFormPro] = useState(false);

//   const handleClick = async () => {
//     setShowFormPro(true);
//   };
  const handleClickPro = async () => {
    setShowFormMat(true);
  };

  return (
    <>
      <Tooltip title={label}>
        <span>
          <Button
            variant="contained"
            color={isOnline ? "primary" : "warning"}
            onClick={handleClickPro}
            // disabled={disabled}
            startIcon={icon}
          >
            {label}
          </Button>
        </span>
      </Tooltip>
      <MaterielFormModalOff
        open={showFormMat}
        // materiel={editMateriel}
        onClose={() => {
          setShowFormMat(false);
          //   setEditMateriel(null);
        }}
      />
      {/* <ProjetFormModalOff
        open={showForm}
        //   projet={}
        onClose={() => {
          setShowForm(false);
          // setEditProjet(null);
        }}
      /> */}
    </>
  );
}
