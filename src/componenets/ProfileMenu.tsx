// ProfileMenu.tsx
import { useState } from "react";
import { Icon } from "@iconify/react";
import { AuthModal } from "./auth/AuthModal";
import { auth } from "../auth/firebase";
import { getIdToken } from "../auth/authService";

export function ProfileMenu() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleProfileClick = async () => {
    setIsAuthOpen(true);

    // if user already signed in, get tokens
    const user = auth.currentUser;
    if (user) {
      try {
        const idToken = await getIdToken(); // short-lived token
        const refreshToken = user.refreshToken; // long-lived token
        console.log("ID Token:", idToken);
        console.log("Refresh Token:", refreshToken);
      } catch (e) {
        console.error("Failed to fetch tokens:", e);
      }
    }
  };

  return (
    <div className="relative flex gap-2">
      {/* Profile Button -> opens AUTH modal */}
      <button
        onClick={handleProfileClick}
        className="h-10 p-1 w-10 bg-gray-100 flex justify-center items-center rounded-full hover:bg-gray-200 transition"
        title="Profile"
      >
        <Icon icon="mdi:account-circle" className="h-full w-full" />
      </button>

      {/* AUTH MODAL */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
