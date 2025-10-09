// src/auth/AdminRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useRole } from "../../auth/hooks/useRole";
import type { JSX } from "react";

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const { role, loading } = useRole();
  const loc = useLocation();
  if (loading)
    return (
      <div className="w-full h-[100dvh] flex items-center justify-center">
        Checking access…
      </div>
    );
  if (role !== "admin")
    return <Navigate to="/" replace state={{ from: loc }} />;
  return children;
}
