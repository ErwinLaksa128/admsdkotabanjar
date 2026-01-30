import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAw0prh7e3fnbUTYUWqNzhoPpHUV9seGUg",
  authDomain: "admgurubjr-4c6e3.firebaseapp.com",
  projectId: "admgurubjr-4c6e3",
  storageBucket: "admgurubjr-4c6e3.firebasestorage.app",
  messagingSenderId: "516566514996",
  appId: "1:516566514996:web:257b96bcc95fa8aa1e7961",
  measurementId: "G-8DWLY7FR5V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export const auth = getAuth(app);
