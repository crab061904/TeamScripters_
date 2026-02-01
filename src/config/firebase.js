// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFgkBNcI_utzK6qlvNIGZh3xuek8XU770",
  authDomain: "mynagaassist-hackathon.firebaseapp.com",
  projectId: "mynagaassist-hackathon",
  storageBucket: "mynagaassist-hackathon.firebasestorage.app",
  messagingSenderId: "651395325657",
  appId: "1:651395325657:web:d1bdd1b83dd97d8c0b68c8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Export the services so your team can use them
export const auth = getAuth(app);
export const db = getFirestore(app);
