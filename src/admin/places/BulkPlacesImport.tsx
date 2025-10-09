// src/admin/places/BulkPlacesImport.tsx
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  GeoPoint,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, authReady, db } from "../../auth/firebase";
import { Section } from "../../componenets/common/Section";
import { Button } from "../../componenets/common/Button";
import { DEFAULT_COMP_ZONES } from "./AddPlaceFull";
import { CATEGORIES } from "../../componenets/place-list/place-list-utils";

// ---- Types ----
type Zone = { id: string; name: string; color: string; categoryId: string };

type GeoJSONPosition = [number, number] | [number, number, number];

type FeatureProps = Record<string, any>;
type FeaturePoint = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: GeoJSONPosition };
  properties?: FeatureProps;
};
// type FeatureCollection = {
//   type: "FeatureCollection";
//   features: FeaturePoint[];
// };

type FieldMap = {
  name: string; // required
  address?: string;
  info?: string;
  rating?: string;
  tags?: string; // comma-separated string or string[]
  pointColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  brandTitle?: string;
  brandSubtitle?: string;
  locationLabel?: string;
  shortCode?: string;
  website?: string;
  socialHandle?: string;
  imageUrl?: string;
  sports?: string; // comma-separated keys
  zoneName?: string; // used only if "zone strategy = by property"
};

// ---- helpers ----
function chunk<T>(arr: T[], size = 400): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchZonesByCategory(cid: string): Promise<Zone[]> {
  const snap = await getDocs(
    query(collection(db, "zones"), where("categoryId", "==", cid)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Zone[];
}

async function seedDefaultZonesIfEmpty() {
  const list = await fetchZonesByCategory("competition");
  if (list.length > 0) return;
  const batch = writeBatch(db);
  const colRef = collection(db, "zones");
  const ts = serverTimestamp();
  for (const z of DEFAULT_COMP_ZONES) {
    const refDoc = doc(colRef);
    batch.set(refDoc, {
      name: z.name,
      color: z.color,
      categoryId: "competition",
      createdAt: ts,
      updatedAt: ts,
    });
  }
  await batch.commit();
}

// function coordsToLatLng(pos: GeoJSONPosition) {
//   // GeoJSON positions are [lng, lat, (alt?)]
//   const lng = Number(pos[0]);
//   const lat = Number(pos[1]);
//   return { lat, lng };
// }

function asStringArray(v: any): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string")
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

function numOrNull(v: any): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function safeGet(p: FeatureProps, key?: string) {
  if (!key) return undefined;
  return p?.[key];
}

// Heuristics: convert UTM 28N/29N or WebMercator to lon/lat if needed
function mercatorToLonLat([x, y]: [number, number]) {
  const R = 6378137;
  const lon = (x / R) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);
  return { lon, lat };
}

function utmToLatLon(
  easting: number,
  northing: number,
  zone: 28 | 29 = 28, // Dakar area is typically zone 28N; change to 29 for eastern Senegal
  northernHemisphere = true,
) {
  // Lightweight UTM→WGS84 conversion (sufficient for this import UI)
  // Based on standard formulas; accuracy ~< 1m for our use-case.
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const k0 = 0.9996;
  const e = Math.sqrt(f * (2 - f));

  const x = easting - 500000.0;
  const y = northernHemisphere ? northing : northing - 10000000.0;
  const λ0 = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180); // zone CM in rad

  const e1sq = (e * e) / (1 - e * e);
  const M = y / k0;
  const mu =
    M /
    (a *
      (1 -
        Math.pow(e, 2) / 4 -
        (3 * Math.pow(e, 4)) / 64 -
        (5 * Math.pow(e, 6)) / 256));

  const e1 = (1 - Math.sqrt(1 - e * e)) / (1 + Math.sqrt(1 - e * e));

  const J1 = (3 * e1) / 2 - (27 * Math.pow(e1, 3)) / 32;
  const J2 = (21 * Math.pow(e1, 2)) / 16 - (55 * Math.pow(e1, 4)) / 32;
  const J3 = (151 * Math.pow(e1, 3)) / 96;
  const J4 = (1097 * Math.pow(e1, 4)) / 512;

  const fp =
    mu +
    J1 * Math.sin(2 * mu) +
    J2 * Math.sin(4 * mu) +
    J3 * Math.sin(6 * mu) +
    J4 * Math.sin(8 * mu);

  const sinfp = Math.sin(fp);
  const cosfp = Math.cos(fp);
  const tanfp = Math.tan(fp);

  const C1 = e1sq * cosfp * cosfp;
  const T1 = tanfp * tanfp;
  const R1 = (a * (1 - e * e)) / Math.pow(1 - (e * sinfp) ** 2, 1.5);
  const N1 = a / Math.sqrt(1 - (e * sinfp) ** 2);
  const D = x / (N1 * k0);

  const Q1 = (N1 * tanfp) / R1;
  const Q2 = (D * D) / 2;
  const Q3 =
    ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * e1sq) * Math.pow(D, 4)) / 24;
  const Q4 =
    ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * e1sq - 3 * C1 * C1) *
      Math.pow(D, 6)) /
    720;

  const lat = fp - Q1 * (Q2 - Q3 + Q4);

  const Q5 = D;
  const Q6 = ((1 + 2 * T1 + C1) * Math.pow(D, 3)) / 6;
  const Q7 =
    ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * e1sq + 24 * T1 * T1) *
      Math.pow(D, 5)) /
    120;

  const lon = λ0 + (Q5 - Q6 + Q7) / cosfp;

  return { lon: (lon * 180) / Math.PI, lat: (lat * 180) / Math.PI };
}

type CRS = "wgs84" | "utm28n" | "utm29n" | "webmercator";

// Detect wildly out-of-range degrees to decide converting
function maybeToLonLat(
  coords: [number, number],
  crs: CRS = "wgs84",
): { lon: number; lat: number } {
  const [x, y] = coords;

  if (crs === "wgs84") {
    // If they already look like lon/lat degrees, return
    if (Math.abs(x) <= 180 && Math.abs(y) <= 90) return { lon: x, lat: y };
    // Otherwise, try auto detect (Senegal datasets often UTM 28N)
    if (x > 1000 && y > 1000) {
      return utmToLatLon(x, y, 28, true);
    }
    // Fallback: assume WebMercator
    return mercatorToLonLat([x, y]);
  }

  if (crs === "utm28n") return utmToLatLon(x, y, 28, true);
  if (crs === "utm29n") return utmToLatLon(x, y, 29, true);
  if (crs === "webmercator") return mercatorToLonLat([x, y]);

  return { lon: x, lat: y };
}

export default function BulkPlacesImport() {
  const [categoryId, setCategoryId] = useState("competition");
  const [zones, setZones] = useState<Zone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [useSingleZone, setUseSingleZone] = useState(true);
  const [singleZoneId, setSingleZoneId] = useState<string>("");
  const [inputCrs, setInputCrs] = useState<CRS>("wgs84");

  const [allowCreateZones, setAllowCreateZones] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [rawJson, setRawJson] = useState<any>(null);
  const [features, setFeatures] = useState<FeaturePoint[]>([]);

  const [fieldMap, setFieldMap] = useState<FieldMap>({
    name: "name",
    address: "address",
    info: "info",
    rating: "rating",
    tags: "tags",
    pointColor: "pointColor",
    gradientFrom: "gradientFrom",
    gradientTo: "gradientTo",
    brandTitle: "brandTitle",
    brandSubtitle: "brandSubtitle",
    locationLabel: "locationLabel",
    shortCode: "shortCode",
    website: "website",
    socialHandle: "socialHandle",
    imageUrl: "imageUrl",
    sports: "sports",
    zoneName: "zone", // common in many datasets
  });

  const [dryRun, setDryRun] = useState(true);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const pushLog = (s: string) =>
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()}  ${s}`]);

  // load zones for category (with comp seeding fallback)
  useEffect(() => {
    (async () => {
      setZonesLoading(true);
      try {
        if (categoryId === "competition") {
          await seedDefaultZonesIfEmpty();
        }
        const primary = await fetchZonesByCategory(categoryId);
        setZones(primary);
        // default pick first zone
        setSingleZoneId((prev) =>
          primary.some((z) => z.id === prev) ? prev : primary[0]?.id || "",
        );
      } catch (e) {
        console.error(e);
        setZones([]);
        setSingleZoneId("");
      } finally {
        setZonesLoading(false);
      }
    })();
  }, [categoryId]);

  // read file
  useEffect(() => {
    if (!file) {
      setRawJson(null);
      setFeatures([]);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result));
        setRawJson(obj);

        // Normalize to FeatureCollection of Point features
        let pts: FeaturePoint[] = [];

        if (obj?.type === "FeatureCollection" && Array.isArray(obj.features)) {
          pts = obj.features
            .filter((f: any) => f?.geometry?.type === "Point")
            .map((f: any) => ({
              type: "Feature",
              geometry: f.geometry,
              properties: f.properties ?? {},
            }));
        } else if (
          obj?.type === "GeometryCollection" &&
          Array.isArray(obj.geometries)
        ) {
          pts = obj.geometries
            .filter(
              (g: any) => g?.type === "Point" && Array.isArray(g.coordinates),
            )
            .map((g: any, i: number) => ({
              type: "Feature",
              geometry: g,
              // Provide a default name so the importer doesn't skip
              properties: { name: `Point ${i + 1}` },
            }));
        } else {
          // Optional: support bare "Point" or "MultiPoint" at top level
          if (obj?.type === "Point" && Array.isArray(obj.coordinates)) {
            pts = [
              {
                type: "Feature",
                geometry: obj,
                properties: { name: "Point 1" },
              },
            ];
          } else if (
            obj?.type === "MultiPoint" &&
            Array.isArray(obj.coordinates)
          ) {
            pts = obj.coordinates
              .filter((c: any) => Array.isArray(c) && c.length >= 2)
              .map((c: any, i: number) => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: c },
                properties: { name: `Point ${i + 1}` },
              }));
          }
        }

        setFeatures(pts);
        if (!pts.length) pushLog("No Point features found.");
      } catch (e: any) {
        setRawJson(null);
        setFeatures([]);
        pushLog(`Invalid JSON: ${e.message}`);
      }
    };

    reader.readAsText(file);
  }, [file]);

  const propertyKeys = useMemo(() => {
    const props = features[0]?.properties || {};
    return Object.keys(props);
  }, [features]);

  const previewRows = useMemo(() => {
    return features.slice(0, 20).map((f, idx) => {
      const p = f.properties || {};
      const [x, y] = f.geometry.coordinates as [number, number];
      const { lon, lat } = maybeToLonLat([x, y], inputCrs);
      return {
        idx: idx + 1,
        name: safeGet(p, fieldMap.name) ?? "",
        lat,
        lon,
        zoneName: useSingleZone
          ? "(fixed)"
          : safeGet(p, fieldMap.zoneName) ?? "",
        address: safeGet(p, fieldMap.address) ?? "",
        rating: safeGet(p, fieldMap.rating) ?? "",
        tags: safeGet(p, fieldMap.tags) ?? "",
      };
    });
  }, [features, fieldMap, useSingleZone]);

  async function ensureZoneByName(name: string): Promise<Zone | null> {
    // try find in loaded zones
    const found = zones.find(
      (z) => z.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    if (found) return found;
    if (!allowCreateZones) return null;

    // create new zone in this category
    const colRef = collection(db, "zones");
    const ref = doc(colRef);
    const now = serverTimestamp();
    const payload = {
      name,
      color: "#2962FF",
      categoryId,
      createdAt: now,
      updatedAt: now,
    };
    const batch = writeBatch(db);
    batch.set(ref, payload);
    await batch.commit();
    const z: Zone = { id: ref.id, ...(payload as any) };
    pushLog(
      `➕ Created zone "${name}" (${ref.id}) in category "${categoryId}"`,
    );
    // refresh local zones
    setZones((prev) => [...prev, z]);
    return z;
  }

  async function getZoneForFeature(p: FeatureProps): Promise<string | null> {
    if (useSingleZone) return singleZoneId || null;
    const name = String(safeGet(p, fieldMap.zoneName) ?? "").trim();
    if (!name) return null;
    const z = await ensureZoneByName(name);
    return z?.id ?? null;
  }

  // Duplicate check helper (by name + lat + lng within a zone or top-level)
  async function isDuplicate(
    name: string,
    lat: number,
    lng: number,
    zoneId: string | null,
  ): Promise<boolean> {
    // NOTE: Firestore doesn't support compound where on GeoPoint easily,
    // so we approximate by name match and nearby lat/lng within small epsilon.
    const epsilon = 1e-6;
    const colRef = zoneId
      ? collection(db, "zones", zoneId, "places")
      : collection(db, "places");
    const qSnap = await getDocs(query(colRef, where("name", "==", name)));
    const dup = qSnap.docs.some((d) => {
      const data = d.data() as any;
      const gp = data?.location as GeoPoint | undefined;
      if (!gp) return false;
      return (
        Math.abs((gp as any).latitude - lat) < epsilon &&
        Math.abs((gp as any).longitude - lng) < epsilon
      );
    });
    return dup;
  }

  async function importNow() {
    if (features.length === 0) {
      pushLog("Nothing to import. Upload a valid GeoJSON first.");
      return;
    }
    if (useSingleZone && !singleZoneId) {
      pushLog("Select a zone or switch to zone-by-property.");
      return;
    }

    setImporting(true);
    setLog([]);

    try {
      // ensure signed in
      await authReady;
      if (!auth.currentUser) throw new Error("Not signed in.");

      // const ts = serverTimestamp();

      // Build all docs to import
      const build = async (f: FeaturePoint, idx: number) => {
        console.log("build", idx);
        const p = f.properties || {};
        const [x, y] = f.geometry.coordinates as [number, number];
        const { lon, lat } = maybeToLonLat([x, y], inputCrs);

        let name = String(safeGet(p, fieldMap.name) ?? "").trim();
        if (!name) {
          // fallback name: category + coords, or simple ordinal
          name = `${categoryId} ${lat.toFixed(5)},${lon.toFixed(5)}`;
          // or: name = `Point ${idx + 1}`;
        }

        const zoneId = await getZoneForFeature(p); // may be null
        if (skipDuplicates && (await isDuplicate(name, lat, lon, zoneId))) {
          return { skip: true as const, reason: "duplicate" };
        }

        const docData = {
          name,
          location: new GeoPoint(lat, lon),
          address: safeGet(p, fieldMap.address) ?? null,
          info: safeGet(p, fieldMap.info) ?? null,
          rating: numOrNull(safeGet(p, fieldMap.rating)),
          tags: asStringArray(safeGet(p, fieldMap.tags)),
          pointColor: safeGet(p, fieldMap.pointColor) ?? null,
          gradientFrom: safeGet(p, fieldMap.gradientFrom) ?? null,
          gradientTo: safeGet(p, fieldMap.gradientTo) ?? null,
          brandTitle: safeGet(p, fieldMap.brandTitle) ?? null,
          brandSubtitle: safeGet(p, fieldMap.brandSubtitle) ?? null,
          locationLabel: safeGet(p, fieldMap.locationLabel) ?? null,
          shortCode: safeGet(p, fieldMap.shortCode) ?? null,
          website: safeGet(p, fieldMap.website) ?? null,
          socialHandle: safeGet(p, fieldMap.socialHandle) ?? null,
          imageUrl: safeGet(p, fieldMap.imageUrl) ?? null,
          sports:
            categoryId === "competition"
              ? asStringArray(safeGet(p, fieldMap.sports)).map((key) => ({
                  key,
                  label: key,
                }))
              : null,
          sportCount:
            categoryId === "competition"
              ? asStringArray(safeGet(p, fieldMap.sports)).length
              : 0,
          categoryId,
          zoneId: zoneId ?? null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        return { skip: false as const, zoneId, docData };
      };

      // Build all
      const built = [];
      for (let i = 0; i < features.length; i++) {
        built.push(await build(features[i], i));
      }

      const toWrite = built.filter((b: any) => !b.skip) as Array<{
        zoneId: string | null;
        docData: Record<string, any>;
      }>;
      const skipped = built.filter((b: any) => b.skip) as Array<{
        reason: string;
      }>;

      pushLog(
        `Prepared ${toWrite.length} docs. Skipped ${
          skipped.length
        } (reasons: ${[...new Set(skipped.map((s) => s.reason))].join(", ")})`,
      );

      if (dryRun) {
        pushLog("Dry run enabled — no writes performed.");
        return;
      }

      // Commit in chunks with batches
      const chunks = chunk(toWrite, 400);
      for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];
        const batch = writeBatch(db);
        for (const row of c) {
          const colRef = row.zoneId
            ? collection(db, "zones", row.zoneId, "places")
            : collection(db, "places");
          const ref = doc(colRef);
          batch.set(ref, row.docData);
        }
        await batch.commit();
        pushLog(`Committed chunk ${i + 1}/${chunks.length} (${c.length} docs)`);
      }

      pushLog("✅ Import complete.");
    } catch (e: any) {
      console.error(e);
      pushLog(`❌ Import failed: ${e.message || String(e)}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Bulk Import Places (GeoJSON)
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Upload a FeatureCollection of Point features to create multiple
            places under one category.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6 pr-8 border-r border-gray-200">
          {/* Category & Zone Strategy */}
          <Section
            title="Category & Zone Strategy"
            desc="Import scope and zoning."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  Category
                </span>
                <select
                  className="mt-1 w-full rounded-lg border-gray-300"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={importing}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  Zone assignment
                </span>
                <select
                  className="mt-1 w-full rounded-lg border-gray-300"
                  value={useSingleZone ? "single" : "property"}
                  onChange={(e) =>
                    setUseSingleZone(e.target.value === "single")
                  }
                  disabled={importing}
                >
                  <option value="single">Use one fixed zone for all</option>
                  <option value="property">
                    Use zone name from a property
                  </option>
                </select>
              </label>
            </div>

            {useSingleZone ? (
              <div className="mt-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">
                    Fixed zone
                  </span>
                  <select
                    className="mt-1 w-full rounded-lg border-gray-300"
                    value={singleZoneId}
                    onChange={(e) => setSingleZoneId(e.target.value)}
                    disabled={zonesLoading || importing}
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">
                    Zone name property
                  </span>
                  <select
                    className="mt-1 w-full rounded-lg border-gray-300"
                    value={fieldMap.zoneName ?? ""}
                    onChange={(e) =>
                      setFieldMap((m) => ({ ...m, zoneName: e.target.value }))
                    }
                    disabled={importing}
                  >
                    <option value="">(select property)</option>
                    {propertyKeys.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={allowCreateZones}
                    onChange={(e) => setAllowCreateZones(e.target.checked)}
                    disabled={importing}
                  />
                  <span className="text-sm text-gray-700">
                    Create zones if missing (this category)
                  </span>
                </label>
              </div>
            )}
          </Section>

          {/* Upload */}
          <Section
            title="Upload GeoJSON"
            desc="FeatureCollection of Point features."
          >
            <input
              type="file"
              accept=".json,.geojson,application/json"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={importing}
              className="block w-full rounded-lg border border-dashed border-gray-300 p-3"
            />
            {rawJson && (
              <p className="mt-2 text-xs text-gray-500">
                Parsed: {features.length} point features
              </p>
            )}
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Input CRS
              </span>
              <select
                className="mt-1 w-full rounded-lg border-gray-300"
                value={inputCrs}
                onChange={(e) => setInputCrs(e.target.value as CRS)}
                disabled={importing}
              >
                <option value="wgs84">WGS84 (lon/lat)</option>
                <option value="utm28n">
                  UTM 28N (Senegal west, e.g., Dakar)
                </option>
                <option value="utm29n">UTM 29N (eastern Senegal)</option>
                <option value="webmercator">Web Mercator (EPSG:3857)</option>
              </select>
            </label>
          </Section>

          {/* Field Mapper */}
          <Section
            title="Field Mapper"
            desc="Map your properties to Firestore fields (most fields optional)."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["name", "Name (required)"],
                  ["address", "Address"],
                  ["info", "Info"],
                  ["rating", "Rating"],
                  ["tags", "Tags (comma-separated)"],
                  ["pointColor", "Point color"],
                  ["gradientFrom", "Gradient from"],
                  ["gradientTo", "Gradient to"],
                  ["brandTitle", "Brand title"],
                  ["brandSubtitle", "Brand subtitle"],
                  ["locationLabel", "Location label"],
                  ["shortCode", "Short code"],
                  ["website", "Website"],
                  ["socialHandle", "Social handle"],
                  ["imageUrl", "Image URL"],
                  ["sports", "Sports (comma-separated keys)"],
                ] as Array<[keyof FieldMap, string]>
              ).map(([key, label]) => (
                <label key={key} className="block">
                  <span className="text-sm font-medium text-gray-700">
                    {label}
                  </span>
                  <select
                    className="mt-1 w-full rounded-lg border-gray-300"
                    value={(fieldMap as any)[key] ?? ""}
                    onChange={(e) =>
                      setFieldMap((m) => ({ ...m, [key]: e.target.value }))
                    }
                    disabled={importing}
                  >
                    <option value="">(not mapped)</option>
                    {propertyKeys.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  disabled={importing}
                />
                <span className="text-sm text-gray-700">
                  Dry run (no writes)
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  disabled={importing}
                />
                <span className="text-sm text-gray-700">
                  Skip duplicates (name + coords per zone)
                </span>
              </label>
            </div>
          </Section>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={importNow}
              disabled={importing || features.length === 0}
            >
              {importing ? "Importing…" : `Import ${features.length} features`}
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setFile(null);
                setRawJson(null);
                setFeatures([]);
                setLog([]);
              }}
              disabled={importing}
            >
              Reset
            </Button>
          </div>

          {/* Log */}
          <Section title="Log">
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
              {log.join("\n") || "No logs yet."}
            </pre>
          </Section>
        </div>

        {/* Preview */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20 self-start">
          <Section title="Preview (first 20)">
            <div className="overflow-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Lat</th>
                    <th className="px-3 py-2">Lng</th>
                    <th className="px-3 py-2">Zone</th>
                    <th className="px-3 py-2">Rating</th>
                    <th className="px-3 py-2">Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r) => (
                    <tr key={r.idx} className="border-t">
                      <td className="px-3 py-2">{r.idx}</td>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">{r.lat}</td>
                      <td className="px-3 py-2">{r.lon}</td>
                      <td className="px-3 py-2">{r.zoneName}</td>
                      <td className="px-3 py-2">{String(r.rating ?? "")}</td>
                      <td className="px-3 py-2">{String(r.tags ?? "")}</td>
                    </tr>
                  ))}
                  {previewRows.length === 0 && (
                    <tr>
                      <td
                        className="px-3 py-6 text-center text-gray-500"
                        colSpan={7}
                      >
                        Upload a valid GeoJSON to see preview
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          <Section
            title="Tips"
            desc="Your GeoJSON should be a FeatureCollection with Point features. Coordinates are [lng, lat]."
          >
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>
                <code>properties.name</code> is required (map it above).
              </li>
              <li>
                Use “zone by property” to import into multiple zones in the same
                category.
              </li>
              <li>
                Enable “create zones” to auto-add missing zones under the
                selected category.
              </li>
              <li>
                For competition: provide <code>sports</code> (comma separated)
                to populate <code>sports</code> and <code>sportCount</code>.
              </li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
