// src/auth/ProfileView.tsx
import { Icon } from "@iconify/react";
import type { User } from "firebase/auth";
import { signOut } from "../../auth/authService";
import { Link } from "react-router-dom";
import { useRole } from "../../auth/hooks/useRole";

export function ProfileView({
  user,
  onClose,
}: {
  user: User | null;
  onClose: () => void;
}) {
  const { role, loading } = useRole();
  const displayName = user?.displayName ?? "";
  const email = user?.email ?? "";
  const photoURL = user?.photoURL ?? "";

  async function handleLogout() {
    await signOut();
    onClose();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
        {/* Avatar */}
        {photoURL ? (
          <img
            src={photoURL}
            alt="avatar"
            className="h-16 w-16 rounded-full object-cover border"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-gray-100 text-gray-500 grid place-items-center">
            <Icon icon="mdi:account" className="text-3xl" />
          </div>
        )}

        {/* Basic info */}
        <div>
          <div className="text-lg font-semibold">
            {displayName || email || "User"}
          </div>
          {email && <div className="text-sm text-gray-600">{email}</div>}
        </div>
      </div>

      {!loading && role === "admin" && (
        <div className="w-full flex justify-center items-center">
          <Link to="/admin" className="rounded bg-black text-white px-3 py-1.5">
            Admin
          </Link>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-3 p-6">
        <button
          onClick={handleLogout}
          className="w-full rounded-lg bg-black text-white py-2.5 font-medium hover:bg-black/90 active:scale-[.99] transition"
        >
          Logout
        </button>
        <button
          onClick={onClose}
          className="w-full rounded-lg border py-2.5 font-medium hover:bg-gray-50 active:scale-[.99] transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
