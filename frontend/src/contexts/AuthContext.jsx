import React, { createContext, useState, useEffect, useContext } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import axios from "axios";

const googleProvider = new GoogleAuthProvider();
export const AuthContext = createContext(null);

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAndSetUser = async (fbUser) => {
    let token = null;
    try {
      token = await fbUser.getIdToken();
      const res = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      setUser({
        uid: fbUser.uid,
        email: fbUser.email,
        photoURL: fbUser.photoURL,
        token,
        ...res.data,
        needsRole: !res.data.role,
      });
    } catch (err) {
      console.error("fetchAndSetUser error:", err.message);
      setUser({
        uid: fbUser.uid,
        email: fbUser.email,
        photoURL: fbUser.photoURL,
        token: token || null,
        role: null,
        needsRole: true,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = firebaseOnAuthStateChanged(auth, async (fbUser) => {
      try {
        setFirebaseUser(fbUser);
        if (fbUser) {
          await fetchAndSetUser(fbUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async ({ email, password }) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // ✅ FIX: Manually fetch user from MongoDB so state is ready before
    // useEffect in LoginPage fires — prevents role:null redirect loop
    await fetchAndSetUser(cred.user);
    return cred.user;
  };

  const register = async ({ email, password, firstName, lastName, phone, role, orgName, skills }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();

    // ✅ FIX: Save to MongoDB BEFORE fetchAndSetUser so /users/me returns the full profile
    await axios.post(
      `${API}/users/register`,
      {
        uid: cred.user.uid,
        email,
        firstName,
        lastName,
        phone: phone || "",
        role,
        orgName: orgName || "",
        skills: skills || "",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // ✅ FIX: Manually set user state so SignUp useEffect redirect fires correctly
    await fetchAndSetUser(cred.user);
    return cred.user;
  };

  const loginWithGoogle = async () => {
    try {
      googleProvider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();

      await axios.post(
        `${API}/users/google-sync`,
        {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return result.user;
    } catch (err) {
      console.error("Google sign-in error:", err);
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!firebaseUser) throw new Error("Not authenticated");
    const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, credential);
    await updatePassword(firebaseUser, newPassword);
  };

  const updateProfile = async (data) => {
    if (!user?.uid) throw new Error("Not authenticated");
    const token = await firebaseUser.getIdToken();
    await axios.put(`${API}/users/me`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUser((prev) => ({ ...prev, ...data }));
  };

  const getToken = async () => {
    if (!firebaseUser) return null;
    return await firebaseUser.getIdToken();
  };

  const refreshUser = async () => {
    if (firebaseUser) await fetchAndSetUser(firebaseUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        login,
        register,
        logout,
        loginWithGoogle,
        resetPassword,
        changePassword,
        updateProfile,
        refreshUser,
        getToken,
        loading,
        isAuthenticated: !!user,
        role: user?.role || null,
        isNgo: user?.role === "ngo",
        isVolunteer: user?.role === "volunteer",
        isDonor: user?.role === "donor",
        isAdmin: user?.role === "admin",
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
