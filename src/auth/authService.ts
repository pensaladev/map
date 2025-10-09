// src/services/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./firebase";
// import { auth } from "@/lib/firebase";

function mapAuthError(err: unknown): string {
  const code = (err as any)?.code ?? "";
  switch (code) {
    case "auth/configuration-not-found":
      return "Auth is not configured for this project. Enable Email/Password in Firebase Console.";
    case "auth/invalid-api-key":
      return "Invalid Firebase API key. Check your .env values.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is disabled. Enable it in Firebase Console.";
    case "auth/email-already-in-use":
      return "That email is already registered.";
    case "auth/invalid-email":
      return "Please enter a valid email.";
    case "auth/missing-password":
    case "auth/weak-password":
      return "Please use a stronger password (at least 6 characters).";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password.";
    case "auth/network-request-failed":
      return "Network error — check your connection.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export async function signUp(email: string, password: string) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err) {
    const msg = mapAuthError(err);
    // surface the mapped message to the UI
    throw new Error(msg);
  }
}

export async function signIn(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err) {
    const msg = mapAuthError(err);
    throw new Error(msg);
  }
}

export async function signOut() {
  await fbSignOut(auth);
}

export function subscribeAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export async function getIdToken(forceRefresh = false) {
  const u = auth.currentUser;
  if (!u) return null;
  return u.getIdToken(forceRefresh);
}

export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    const code = (err as any)?.code ?? "";
    // reuse or inline-map common errors
    const msg =
      code === "auth/user-not-found"
        ? "We couldn't find an account with that email."
        : code === "auth/invalid-email"
        ? "Please enter a valid email."
        : code === "auth/missing-email"
        ? "Please enter your email."
        : code === "auth/too-many-requests"
        ? "Too many attempts. Try again later."
        : "Something went wrong. Please try again.";
    throw new Error(msg);
  }
}
