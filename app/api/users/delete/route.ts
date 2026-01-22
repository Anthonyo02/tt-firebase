import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    // 1. Récupérer le token depuis le header Authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé (Token manquant)" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];

    // 2. Vérifier le token via Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // (Optionnel) Vérifier si l'utilisateur est admin via les Custom Claims ou Firestore
    // if (decodedToken.role !== 'admin') { ... }

    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "UID manquant" }, { status: 400 });
    }

    // Empêcher un admin de se supprimer lui-même (sécurité supplémentaire)
    if (uid === decodedToken.uid) {
      return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 403 });
    }

    // 3. Supprimer dans Firebase Auth
    await adminAuth.deleteUser(uid);

    // 4. Supprimer dans Firestore
    await adminFirestore.collection("users").doc(uid).delete();

    return NextResponse.json({ message: "Utilisateur supprimé avec succès" });
  } catch (err: any) {
    console.error("Erreur API Delete:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}