// // Logique d'upload

// export const useImageUpload = () => {};
// // components/realisation/hooks/useImageUpload.ts

// import { useState } from "react";
// import imageCompression from "browser-image-compression";
// import { COMPRESSION_OPTIONS } from "../constants";

// interface UploadResult {
//   imageUrl: string;
//   imagePublicId: string;
// }

// interface UseImageUploadReturn {
//   uploading: boolean;
//   uploadImage: (file: File, existingPublicId?: string) => Promise<UploadResult>;
//   deleteImage: (publicId: string) => Promise<boolean>;
// }

// export const useImageUpload = (): UseImageUploadReturn => {
//   const [uploading, setUploading] = useState(false);

//   const uploadImage = async (file: File, existingPublicId?: string): Promise<UploadResult> => {
//     setUploading(true);
//     try {
//       const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);

//       const formData = new FormData();
//       formData.append("file", compressedFile);
      
//       if (existingPublicId) {
//         formData.append("publicId", existingPublicId);
//       }

//       const res = await fetch("/api/cloudinary/uploadweb/realisationimage", {
//         method: "POST",
//         body: formData,
//       });

//       const resData = await res.json();

//       if (!res.ok) {
//         throw new Error(resData.error || "Erreur upload");
//       }

//       return {
//         imageUrl: resData.imageUrl,
//         imagePublicId: resData.imagePublicId,
//       };
//     } finally {
//       setUploading(false);
//     }
//   };

//   const deleteImage = async (publicId: string): Promise<boolean> => {
//     try {
//       const res = await fetch("/api/cloudinary/deleteweb", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ publicId }),
//       });
//       return res.ok;
//     } catch (e) {
//       console.warn("⚠️ Erreur suppression Cloudinary:", e);
//       return false;
//     }
//   };

//   return { uploading, uploadImage, deleteImage };
// };