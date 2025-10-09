// src/App.tsx
import { Routes, Route, Navigate, Outlet, Link } from "react-router-dom";
import MapPage from "./pages/map/MapPage";
import AdminRoute from "./componenets/auth/AdminRoute";
import AddPlaceFull from "./admin/places/AddPlaceFull";
import { PlacesListPage } from "./admin/places/PlacesList";
import { PlaceDetailsPage } from "./admin/places/PlacesDetails";
import "./App.css";
import { useEffect, useState } from "react";
import { initAuth } from "./auth/nitAuth";
import BulkPlacesImport from "./admin/places/BulkPlacesImport";

function AdminShell() {
  return (
    <div className="w-full h-[100dvh] bg-white overflow-auto">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-sm p-2">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="rounded px-3 py-1 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          >
            ← Back to Map
          </Link>

          <div className="ml-auto flex gap-2">
            <Link
              to="/admin/places"
              className="rounded px-3 py-1 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              Places
            </Link>

            <Link
              to="/admin/places/new"
              className="rounded-xl bg-black text-white px-3 py-1 hover:bg-black/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
            >
              + New place
            </Link>
          </div>
        </div>
      </div>
      <div className="p-2">
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Call once on mount
    initAuth((user, r) => {
      console.log("[initAuth] user:", user?.uid, "role:", r);
      console.log("[initAuth] role:", role);
      setRole(r);
    });
  }, []);

  return (
    <Routes>
      <Route path="/" element={<MapPage />} />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminShell />
          </AdminRoute>
        }
      >
        {/* /admin -> /admin/places */}
        <Route index element={<Navigate to="places" replace />} />
        <Route path="places" element={<PlacesListPage />} />
        <Route path="places/import" element={<BulkPlacesImport />} />
        <Route path="places/new" element={<AddPlaceFull />} />
        <Route path="places/:zoneId/:placeId" element={<PlaceDetailsPage />} />
      </Route>

      {/* catch-all */}
      <Route path="*" element={<MapPage />} />
    </Routes>
  );
}
