// generateRealisationComponent.js
const fs = require("fs");
const path = require("path");

// Structure du projet
const structure = {
  realisation: {
    "types.ts": `// Types et interfaces\n\nexport interface ExampleType {}\n`,
    "constants.ts": `// Constantes\n\nexport const THEME = {};\nexport const CLIENT_OPTIONS = [];\n`,
    "helpers.ts": `// Fonctions utilitaires\n\nexport const helper = () => {};\n`,
    hooks: {
      "useRealisationData.ts": `// Hook Firebase\n\nexport const useRealisationData = () => {};\n`,
      "usePendingItems.ts": `// Gestion des items en attente\n\nexport const usePendingItems = () => {};\n`,
      "useImageUpload.ts": `// Logique d'upload\n\nexport const useImageUpload = () => {};\n`,
    },
    cards: {
      "VideoCard.tsx": `import React from "react";\n\nexport const VideoCard = () => <div>VideoCard</div>;\n`,
      "PhotoCard.tsx": `import React from "react";\n\nexport const PhotoCard = () => <div>PhotoCard</div>;\n`,
      "DigitalProjectCard.tsx": `import React from "react";\n\nexport const DigitalProjectCard = () => <div>DigitalProjectCard</div>;\n`,
    },
    dialogs: {
      "VideoDialog.tsx": `import React from "react";\n\nexport const VideoDialog = () => <div>VideoDialog</div>;\n`,
      "PhotoDialog.tsx": `import React from "react";\n\nexport const PhotoDialog = () => <div>PhotoDialog</div>;\n`,
      "DigitalProjectDialog.tsx": `import React from "react";\n\nexport const DigitalProjectDialog = () => <div>DigitalProjectDialog</div>;\n`,
    },
    sections: {
      "VideosSection.tsx": `import React from "react";\n\nexport const VideosSection = () => <div>VideosSection</div>;\n`,
      "PhotosSection.tsx": `import React from "react";\n\nexport const PhotosSection = () => <div>PhotosSection</div>;\n`,
      "DigitalProjectsSection.tsx": `import React from "react";\n\nexport const DigitalProjectsSection = () => <div>DigitalProjectsSection</div>;\n`,
    },
    "EditorTopBar.tsx": `import React from "react";\n\nexport const EditorTopBar = () => <div>EditorTopBar</div>;\n`,
    "LoadingState.tsx": `import React from "react";\n\nexport const LoadingState = () => <div>Loading...</div>;\n`,
    "RealisationEditor.tsx": `import React from "react";\n\nexport const RealisationEditor = () => <div>RealisationEditor</div>;\n`,
  },
};

// Fonction récursive pour créer les dossiers et fichiers
function createStructure(basePath, obj) {
  for (const key in obj) {
    const fullPath = path.join(basePath, key);
    if (typeof obj[key] === "string") {
      fs.writeFileSync(fullPath, obj[key], "utf8");
      console.log(`Fichier créé: ${fullPath}`);
    } else {
      if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath);
      console.log(`Dossier créé: ${fullPath}`);
      createStructure(fullPath, obj[key]);
    }
  }
}

// Exécution
const baseDir = path.join(__dirname, "components");
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);
createStructure(baseDir, structure);
