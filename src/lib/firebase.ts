
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// IMPORTANT: Replace these with your actual Firebase project configuration!
// You can find these in your Firebase project settings.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!
};

let app: FirebaseApp | undefined = undefined;
let db: Firestore | undefined = undefined;
let storage: FirebaseStorage | undefined = undefined;
let firebaseInitializationError: Error | null = null;

try {
  console.log("Attempting Firebase initialization...");
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized with initializeApp().");
  } else {
    app = getApps()[0];
    console.log("Firebase app retrieved with getApps().");
  }

  if (app) {
    console.log("Firebase app instance is available. Attempting to get Firestore and Storage instances...");
    db = getFirestore(app);
    storage = getStorage(app);
    if (db && storage) {
      console.log("Firestore and Storage instances obtained successfully.");
    } else {
      const errorMessage = `Instance acquisition failed: Firestore (${!!db}), Storage (${!!storage}). This may be a configuration issue.`;
      firebaseInitializationError = new Error(errorMessage);
      console.error(errorMessage);
    }
  } else {
    // This error should be caught by firebaseInitializationError directly
    throw new Error("Firebase app initialization failed, app instance is undefined. This typically means firebaseConfig is incorrect.");
  }
  console.log("Firebase & Firestore initialization sequence completed.");

} catch (error) {
  firebaseInitializationError = error as Error;
  console.error("CRITICAL FIREBASE INITIALIZATION ERROR in src/lib/firebase.ts:", firebaseInitializationError.message);
  console.error("Full error object:", error);
  console.error("This usually means your 'firebaseConfig' object above has incorrect values (e.g., placeholder API keys like 'YOUR_API_KEY') or the Firebase project is not set up correctly (e.g., Firestore not enabled, region not selected).");
  console.error("Please VERIFY your Firebase setup and the configuration values in 'src/lib/firebase.ts'.");
  // db will remain undefined if an error occurs here
}

export { db, storage, firebaseInitializationError };
