// src/auth/initAuth.ts
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

const auth = getAuth();
const db = getFirestore();

export function initAuth(onReady?: (user: User | null, role?: string) => void) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onReady?.(null, undefined);
      return;
    }

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        email: user.email ?? null,
        role: "user", // 👈 default role
        displayName: user.displayName ?? null,
        photoURL: user.photoURL ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // keep an updatedAt for hygiene (optional)
      try {
        await updateDoc(ref, { updatedAt: serverTimestamp() });
      } catch {}
    }

    const role = (snap.exists() ? snap.data().role : "user") as string;
    onReady?.(user, role);
  });
}
