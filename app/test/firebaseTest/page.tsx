// "use client";

// import { useEffect, useState } from "react";
// import { db } from "@/lib/firebase";
// import { collection, getDocs } from "firebase/firestore";

// export default function FirebaseTest() {
//   const [users, setUsers] = useState<any[] | null>(null); // null = loading
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const usersRef = collection(db, "users");
//         const snapshot = await getDocs(usersRef);
//         const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         setUsers(data);
//       } catch (err) {
//         console.error(err);
//         setError("Impossible de récupérer les données Firestore");
//         setUsers([]); // fin du chargement
//       }
//     };
//     fetchUsers();
//   }, []);

//   if (error) return <div>{error}</div>;
//   if (users === null) return <div>Chargement...</div>; // ⚡ Évite le mismatch

//   return (
//     <div>
//       <h1>Test Firebase</h1>
//       {users.length === 0 ? (
//         <p>Aucun utilisateur trouvé</p>
//       ) : (
//         <ul>
//           {users.map(u => (
//             <li key={u.id}>
//               {u.nom} - {u.email} - {u.role}
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }
