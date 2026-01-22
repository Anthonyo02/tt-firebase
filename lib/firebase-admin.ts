import admin from "firebase-admin";

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("🔥 FIREBASE_PRIVATE_KEY est undefined !");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Cette ligne gère les \n qu'ils soient littéraux ou échappés
      privateKey: privateKey.replace(/\\n/g, "\n"), 
    }),
  });
}

export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();