import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const config2 = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_2,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_2,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_2,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_2,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_2,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID_2,
};

const app = !getApps().length ? initializeApp(config2) : getApp();

// Firestore
export const db2 = getFirestore(app);
