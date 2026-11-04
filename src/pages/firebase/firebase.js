import { getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBZ6HxTUI8hBz0epsaAikvKowML2_KHBLo",
  authDomain: "knowledge-announcement.firebaseapp.com",
  databaseURL:
    "https://knowledge-announcement-default-rtdb.firebaseio.com",
  projectId: "knowledge-announcement",
  storageBucket:
    "knowledge-announcement.firebasestorage.app",
  messagingSenderId: "830692682192",
  appId:
    "1:830692682192:web:187a28c9bbc0ae044131d5",
  measurementId: "G-C7JC9HSP2T",
};

const app = getApps().find((candidate) => candidate.name === "[DEFAULT]") || initializeApp(firebaseConfig);
const adminAccountApp = getApps().find((candidate) => candidate.name === "admin-account-creator")
  || initializeApp(firebaseConfig, "admin-account-creator");

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const adminAccountAuth = getAuth(adminAccountApp);
