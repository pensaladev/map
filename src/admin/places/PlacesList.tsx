// src/admin/places/PlacesListPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../auth/firebase";
import { Icon } from "@iconify/react/dist/iconify.js";
import { DEFAULT_COMP_ZONES } from "./AddPlaceFull";
import { CATEGORIES } from "../../componenets/place-list/place-list-utils";

/* ---------- Small UI helpers (soft, modern) ---------- */
function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-gray-200/60 bg-white/70 backdrop-blur-md p-5 shadow-sm ring-1 ring-black/5">
      <header className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {desc ? <p className="mt-1 text-sm text-gray-500">{desc}</p> : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-800">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "h-10 w-full rounded-2xl border border-gray-200 bg-white/80 px-3 text-sm shadow-sm outline-none transition",
        "placeholder:text-gray-400",
        "focus:border-blue-300 focus:ring-4 focus:ring-blue-100",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        props.className || "",
      ].join(" ")}
    />
  );
}

function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: any) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm transition focus:outline-none focus:ring-4 focus:ring-blue-100";
  const styles =
    variant === "primary"
      ? "bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400"
      : variant === "ghost"
      ? "hover:bg-black/5"
      : "border border-gray-200 bg-white hover:bg-gray-50";
  return (
    <button className={[base, styles, className].join(" ")} {...rest}>
      {children}
    </button>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-700">
      {children}
    </span>
  );
}

/* ---------------- Types ---------------- */
export type Zone = {
  id: string;
  name: string;
  color: string;
  categoryId: string;
};
export type Place = {
  id: string;
  name: string;
  location?: { latitude: number; longitude: number } | any;
  address?: string;
  info?: string;
  rating?: number | null;
  tags?: string[];
  pointColor?: string;
  imageUrl?: string | null;
  brandTitle?: string | null;
  brandSubtitle?: string | null;
  locationLabel?: string | null;
  shortCode?: string | null;
  gradientFrom?: string | null;
  gradientTo?: string | null;
  website?: string | null;
  socialHandle?: string | null;
  sportCount?: number;
  categoryId?: string;
  zoneId?: string | null; // ensure present for linking/deleting
  createdAt?: any;
  updatedAt?: any;
};

const ALL_ZONES = "__ALL__";

async function fetchZones(categoryId: string) {
  const snap = await getDocs(
    query(collection(db, "zones"), where("categoryId", "==", categoryId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Zone[];
}

async function seedDefaultZonesIfEmpty(categoryId: string) {
  if (categoryId !== "competition") return;
  const list = await fetchZones(categoryId);
  if (list.length > 0) return;
  const batch = writeBatch(db);
  const colRef = collection(db, "zones");
  const ts = serverTimestamp();
  for (const z of DEFAULT_COMP_ZONES) {
    const refDoc = doc(colRef);
    batch.set(refDoc, {
      name: z.name,
      color: z.color,
      categoryId,
      createdAt: ts,
      updatedAt: ts,
    });
  }
  await batch.commit();
}

/* --------------- Page --------------- */
export function PlacesListPage() {
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState("competition");
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneId, setZoneId] = useState(""); // "" => root-only; ALL_ZONES => all zoned + root
  const [zonesLoading, setZonesLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"updated" | "name">("updated");

  // load zones for the chosen category
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setZonesLoading(true);
        let list = await fetchZones(categoryId);
        if (list.length === 0) {
          await seedDefaultZonesIfEmpty(categoryId);
          list = await fetchZones(categoryId);
        }
        if (ignore) return;
        setZones(list);
        // default to "All zones" when zones exist; otherwise root-only view
        setZoneId((prev) => {
          if (list.length === 0) return "";
          // preserve ALL if already selected; else default to ALL
          return prev && prev !== "" ? prev : ALL_ZONES;
        });
      } finally {
        setZonesLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [categoryId]);

  async function loadPlaces(currentZoneId: string) {
    setLoading(true);
    try {
      let items: Place[] = [];

      // (A) ALL ZONES: use collectionGroup for every /zones/*/places + merge root /places
      if (currentZoneId === ALL_ZONES) {
        const cgSnap = await getDocs(
          query(
            collectionGroup(db, "places"),
            where("categoryId", "==", categoryId),
          ),
        );
        const cgItems: Place[] = cgSnap.docs.map((d: any) => {
          const data = d.data();
          // try to derive zoneId from path in case older docs don't have it
          const derivedZoneId = d.ref.parent.parent?.id || data.zoneId || null;
          return { id: d.id, zoneId: derivedZoneId, ...(data as any) };
        });

        const rootSnap = await getDocs(
          query(
            collection(db, "places"),
            where("categoryId", "==", categoryId),
          ),
        );
        const rootItems: Place[] = rootSnap.docs.map((d) => ({
          id: d.id,
          zoneId: null,
          ...(d.data() as any),
        }));

        items = [...cgItems, ...rootItems];
      }
      // (B) SPECIFIC ZONE: only that zone’s subcollection
      else if (currentZoneId) {
        const snap = await getDocs(
          collection(doc(db, "zones", currentZoneId), "places"),
        );
        items = snap.docs.map((d) => ({
          id: d.id,
          zoneId: currentZoneId,
          ...(d.data() as any),
        })) as Place[];
      }
      // (C) ROOT-ONLY (categories without zones, e.g., Hotels)
      else {
        const snap = await getDocs(
          query(
            collection(db, "places"),
            where("categoryId", "==", categoryId),
          ),
        );
        items = snap.docs.map((d) => ({
          id: d.id,
          zoneId: null,
          ...(d.data() as any),
        })) as Place[];
      }

      // sort
      items.sort((a: any, b: any) => {
        if (sort === "updated") {
          const at = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
          const bt = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
          if (bt !== at) return bt - at;
        }
        return (a.name || "").localeCompare(b.name || "");
      });

      setPlaces(items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPlaces(zoneId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId, sort, categoryId]); // reload when category changes too

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return places;
    return places.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.address || "").toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [places, search]);

  async function handleDeleteForPlace(p: Place) {
    if (!confirm("Delete this place? This cannot be undone.")) return;
    const z = p.zoneId;
    if (z) {
      await deleteDoc(doc(db, "zones", z, "places", p.id));
      await loadPlaces(zoneId);
    } else {
      await deleteDoc(doc(db, "places", p.id));
      await loadPlaces(zoneId);
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      {/* Top bar */}
      <div className="mb-6 rounded-2xl border border-black/5 bg-white/70 backdrop-blur p-4 md:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
          {/* Title + subtitle */}
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg md:text-xl font-semibold tracking-tight text-gray-900">
              <Icon
                icon="mdi:map-marker-radius-outline"
                className="h-5 w-5 text-blue-600"
              />
              <span className="truncate">Places</span>
            </h2>
            <p className="mt-0.5 text-sm text-gray-600 truncate">
              Browse and manage places within a zone or across all zones.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/admin/places/import")}
              className="h-10 rounded-xl bg-blue-600 text-white shadow-md hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Icon icon="mdi:file-upload-outline" className="h-5 w-5" />
              <span>Import places</span>
            </Button>

            <Button
              onClick={() => navigate("/admin/places/new")}
              className="h-10 rounded-xl bg-blue-600 text-white shadow-md hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Icon icon="mdi:plus" className="h-5 w-5" />
              <span>New place</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Section title="Filters">
        <div className="grid gap-4 md:grid-cols-4">
          <Field id="category" label="Category" required>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-10 w-full rounded-2xl border border-gray-200 bg-white/80 px-3 text-sm shadow-sm focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id="zone"
            label="Zone"
            hint={
              zonesLoading
                ? "Loading zones…"
                : zones.length === 0
                ? "No zones for this category — showing root collection."
                : undefined
            }
          >
            <select
              id="zone"
              disabled={zonesLoading || zones.length === 0}
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="h-10 w-full rounded-2xl border border-gray-200 bg-white/80 px-3 text-sm shadow-sm focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            >
              {/* All zones option when zones exist */}
              {zones.length > 0 && (
                <option value={ALL_ZONES}>(All zones)</option>
              )}
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
              {/* Root-only fallback when there are no zones (disabled select anyway) */}
            </select>
          </Field>

          <Field id="search" label="Search">
            <TextInput
              id="search"
              placeholder="Name, address, tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>

          <Field id="sort" label="Sort by">
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="h-10 w-full rounded-2xl border border-gray-200 bg-white/80 px-3 text-sm shadow-sm focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            >
              <option value="updated">Last updated</option>
              <option value="name">Name (A→Z)</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* Cards */}
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading && (
          <div className="col-span-full grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-3xl border border-gray-200/60 bg-white/60 backdrop-blur-md shadow-sm"
              >
                <div className="h-2 w-full bg-gray-200/70" />
                <div className="h-44 w-full animate-pulse bg-gray-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                  <div className="h-8 w-full animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="col-span-full rounded-3xl border border-gray-200/60 bg-white/70 p-8 text-center text-sm text-gray-600 shadow-sm">
            No places found.
          </div>
        )}

        {!loading &&
          filtered.map((p) => {
            const linkZone =
              (p.zoneId ?? null) ||
              (zoneId && zoneId !== ALL_ZONES ? zoneId : null);
            return (
              <div
                key={p.id}
                className="overflow-hidden rounded-3xl border border-gray-200/60 bg-white/70 backdrop-blur-md shadow-sm transition hover:shadow-lg"
              >
                {/* thin gradient strip */}
                <div
                  className="h-2 w-full"
                  style={{
                    background: `linear-gradient(90deg, ${
                      p.gradientFrom || "#e5e7eb"
                    }, ${p.gradientTo || "#d1d5db"})`,
                  }}
                />

                {/* image */}
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-44 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center bg-gray-50 text-gray-400">
                    No image
                  </div>
                )}

                {/* body */}
                <div className="p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full border border-gray-300"
                      style={{ background: p.pointColor || "#9ca3af" }}
                    />
                    <h4 className="font-semibold leading-tight text-gray-900">
                      {p.name}
                    </h4>
                  </div>

                  {p.location && (
                    <p className="text-xs text-gray-500">
                      {p.location.latitude?.toFixed?.(5)} •{" "}
                      {p.location.longitude?.toFixed?.(5)}
                    </p>
                  )}

                  {p.tags && p.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.tags.map((t, i) => (
                        <Chip key={i}>{t}</Chip>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {p.updatedAt?.toDate
                        ? new Date(p.updatedAt.toDate()).toLocaleString()
                        : ""}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/places/${linkZone ?? "root"}/${p.id}`}
                        className="text-sm font-medium text-gray-900 underline-offset-2 hover:underline"
                      >
                        View / Edit
                      </Link>
                      <Button
                        variant="ghost"
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDeleteForPlace(p)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
