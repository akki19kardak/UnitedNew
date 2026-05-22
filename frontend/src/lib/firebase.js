import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};
console.log("ENV OBJECT:", import.meta.env);
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithEmail    = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const loginWithGoogle   = () =>
  signInWithRedirect(auth, googleProvider);

export const getGoogleRedirectResult = () =>
  getRedirectResult(auth);

export const logoutUser        = () => signOut(auth);

export const resetPassword     = (email) =>
  sendPasswordResetEmail(auth, email);

export const getCurrentUser    = () => auth.currentUser;

export const onAuthStateChanged = (cb) =>
  firebaseOnAuthStateChanged(auth, cb);

export default app;
