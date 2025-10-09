// src/auth/useRole.ts
import { useEffect, useState } from "react";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

export function useRole() {
  const [role, setRole] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        setRole(undefined);
        setLoading(false);
        return;
      }
      const ref = doc(db, "users", u.uid);
      const unsubDoc = onSnapshot(ref, (snap) => {
        setRole((snap.data()?.role as string) || "user");
        setLoading(false);
      });
      return () => unsubDoc();
    });

    return () => unsubAuth();
  }, []);

  return { role, loading };
}
