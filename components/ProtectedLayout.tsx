// "use client";

// import React, { useEffect } from "react";
// import { useAuth } from "../context/AuthContext";
// import { useRouter } from "next/navigation";
// import Layout from "./Layout";
// import { Box, LinearProgress } from "@mui/material";
// import Image from "next/image";
// import logo from "@/public/images/logo.png";

// /* =======================
//    🔄 LOADING PAGE
// ======================= */
// const LoadingPage: React.FC = () => (
//   <Box
//     sx={{
//       height: "100vh",
//       display: "flex",
//       alignItems: "center",
//       justifyContent: "center",
//       flexDirection: "column",
//       position: "relative",
//     }}
//   >
//     {/* 🔝 Loading bar */}
//     <Box
//       sx={{
//         position: "fixed",
//         top: 0,
//         left: 0,
//         width: "100%",
//         zIndex: 2000,
//       }}
//     >
//       <LinearProgress
//         sx={{
//           height: 4,
//           backgroundColor: "transparent",
//           "& .MuiLinearProgress-bar": {
//             backgroundColor: "#616637",
//           },
//         }}
//       />
//     </Box>

//     {/* 🎈 Ballon + ombre */}
//     <Box sx={{ position: "relative", height: 140 }}>
//       {/* Ballon */}
//       <Box
//         sx={{
//           width: 80,
//           height: 80,
//           borderRadius: 2,
//           overflow: "hidden",
//           position: "absolute",
//           left: "50%",
//           transform: "translateX(-50%)",
//           animation: "balloon 1.8s infinite",

//           "@keyframes balloon": {
//             "0%": {
//               transform: "translate(-50%, 0)",
//             },
//             "40%": {
//               transform: "translate(-50%, -60px)",
//             },
//             "70%": {
//               transform: "translate(-50%, 0)",
//             },
//             "85%": {
//               transform: "translate(-50%, -15px)",
//             },
//             "100%": {
//               transform: "translate(-50%, 0)",
//             },
//           },
//         }}
//       >
//         <Image
//           src={logo}
//           alt="logo"
//           width={80}
//           height={80}
//           style={{ objectFit: "contain" }}
//           priority
//         />
//       </Box>

//       {/* 🟤 Ombre */}
//       <Box
//         sx={{
//           position: "absolute",
//           bottom: 10,
//           left: "50%",
//           transform: "translateX(-50%)",
//           width: 60,
//           height: 12,
//           backgroundColor: "rgba(0,0,0,0.25)",
//           borderRadius: "50%",
//           filter: "blur(6px)",
//           animation: "shadow 1.8s infinite",

//           "@keyframes shadow": {
//             "0%": {
//               transform: "translateX(-50%) scale(1)",
//               opacity: 0.3,
//             },
//             "40%": {
//               transform: "translateX(-50%) scale(1.6)",
//               opacity: 0.12,
//             },
//             "70%": {
//               transform: "translateX(-50%) scale(0.9)",
//               opacity: 0.35,
//             },
//             "100%": {
//               transform: "translateX(-50%) scale(1)",
//               opacity: 0.3,
//             },
//           },
//         }}
//       />
//     </Box>
//   </Box>
// );

// /* =======================
//    🔐 PROTECTED LAYOUT
// ======================= */
// const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const { user, isLoading } = useAuth();
//   const router = useRouter();

//   // ✅ Redirection PROPRE (jamais dans le render)
//   useEffect(() => {
//     if (!isLoading && !user) {
//       router.replace("/login");
//     }
//   }, [isLoading, user, router]);

//   // 🔒 Tant que l’auth n’est pas claire → loading uniquement
//   if (isLoading || !user) {
//     return <LoadingPage />;
//   }

//   // ✅ User connecté → layout complet
//   return <Layout>{children}</Layout>;
// };

// export default ProtectedLayout;
"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import LoadingPage from "@/components/LoadingPage";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <LoadingPage />;
  }

  return <>{children}</>;
}
