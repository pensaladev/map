// src/core/layers/categoryPoints.ts
import mapboxgl, { Map } from "mapbox-gl";
import { addOrSetSource } from "../map/utils";
import { destroyPopup, renderVenuePopup } from "../../componenets/popupRenderer";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../auth/firebase";
import type { VenueSport } from "../../data/sitesMeta";

export type CategoryLayerOptions = {
  initiallyVisible?: boolean; // default false
};

const CLUSTER_UI = {
  GLOW: "rgba(0, 167, 255, 0.22)", // soft aqua glow
  RING: "#00A7FF", // thin blue ring
  CORE: "#F4FBFF", // near-white core
  STROKE: "#0B2033", // dark navy stroke/text
  HALO: "rgba(255,255,255,0.85)", // text halo
};

// ---------------------- helpers ----------------------
function slugify(s: string) {
  return (s || "").toLowerCase().trim().replace(/\s+/g, "-");
}

function toLatLng(p: any) {
  const lat =
    p.location?.latitude ?? p.location?._lat ?? p.location?.lat ?? p.lat;
  const lng =
    p.location?.longitude ?? p.location?._long ?? p.location?.lng ?? p.lng;
  return { lat, lng };
}

function parseArray<T = unknown>(v: unknown): T[] | undefined {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? (parsed as T[]) : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

// simple deterministic id from URL
// function hashId(str: string) {
//   let h = 5381;
//   for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
//   return "img_" + (h >>> 0).toString(36);
// }

// // load an image URL and register it once
// async function ensureRuntimeImage(map: Map, id: string, url: string) {
//   if (map.hasImage(id)) return id;
//   const res = await fetch(url, { mode: "cors" });
//   const blob = await res.blob();
//   const bmp = await createImageBitmap(blob); // crisp + async
//   map.addImage(id, bmp, { pixelRatio: 2 }); // 2x for sharpness
//   return id;
// }

function gradientFromProps(
  p: Record<string, any>,
): [string, string] | undefined {
  const g = parseArray<string>(p["gradient"]);
  if (g?.length === 2 && g[0] && g[1]) return [String(g[0]), String(g[1])];
  const gf = p["gradientFrom"];
  const gt = p["gradientTo"];
  if (typeof gf === "string" && typeof gt === "string" && gf && gt)
    return [gf, gt];
  return undefined;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

// ---------------------- built-in (Maki) icon mapping ----------------------
const MAKI_ICON_BY_CATEGORY: Record<string, string> = {
  hotels: "lodging-15",
  hotel: "lodging-15",
  restaurants: "lodging-15",
  // hospital: "hospital-15",
  hospitals: "hospital-15",
  security: "police-15",
  culture: "theatre-15",
  tourism: "theatre-15",
  culture_tourism: "theatre-15",
  competition: "stadium-15",
  transport: "stadium-15",
  bank: "bank-15",
};

const LOCAL_IMG_BY_CATEGORY: Record<string, string> = {
  hotels: "/markers/hotel.png",
  hotel: "/markers/hotel.png",
  restaurants: "/markers/restaurants.png",
  hospitals: "/markers/hospital.png",
  police: "/markers/security.png",
  artworks: "/markers/artworks.png",
  attraction: "/markers/attraction.png",
  castle: "/markers/castle.png",
  church: "/markers/church.png",
  gallery: "/markers/gallery.png",
  memorial: "/markers/memorial.png",
  mosque: "/markers/mosque.png",
  monument: "/markers/monument.png",
  museum: "/markers/museum.png",
  zoo: "/markers/zoo.png",
  viewpoints: "/markers/viewpoints.png",
  competition: "/markers/stadium.png",
  transport: "/markers/transport.png",
  bank: "/markers/bank.png",
  atm: "/markers/atm.png",
  firestation: "/markers/fires.png",
  embassy: "/markers/embassy.png",
  consulate: "/markers/consulate.png",
  airport: "/markers/airport.png",
  bus: "/markers/bus.png",
  ferry: "/markers/ferry.png",
  railway: "/markers/railway.png",
  // fallback used when no mapping
  default: "/markers/pin.png",
};

// deterministic id from path
function hashId(str: string) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return "img_" + (h >>> 0).toString(36);
}

// load a local image path and register it once
async function ensureRuntimeImage(map: Map, id: string, url: string) {
  if (map.hasImage(id)) return id;
  const res = await fetch(url, { mode: "cors" });
  const blob = await res.blob();
  const bmp = await createImageBitmap(blob);
  map.addImage(id, bmp, { pixelRatio: 2 }); // 2x for crisp result
  return id;
}

// helper: get local img path for a category
function imgPathForCategory(categoryId?: string) {
  const key = (categoryId || "").toLowerCase();
  return LOCAL_IMG_BY_CATEGORY[key] || LOCAL_IMG_BY_CATEGORY.default;
}

function iconForCategory(categoryId?: string) {
  return MAKI_ICON_BY_CATEGORY[`${categoryId ?? ""}`] || "marker-15";
}

// function ensurePinImage(map: Map, id = "pin-sdf-24") {
//   if (map.hasImage(id)) return id;

//   // Draw a small upside-down teardrop with a white center circle using Canvas.
//   const w = 48,
//     h = 64;
//   const canvas = document.createElement("canvas");
//   canvas.width = w;
//   canvas.height = h;
//   const ctx = canvas.getContext("2d")!;
//   ctx.clearRect(0, 0, w, h);

//   // Outer pin (teardrop)
//   ctx.beginPath();
//   // top arc
//   ctx.arc(w / 2, 12, 10, Math.PI, 0);
//   // bottom point
//   ctx.quadraticCurveTo(w / 2 + 10, 20, w / 2, h - 3);
//   ctx.quadraticCurveTo(w / 2 - 10, 20, w / 2 - 10, 12);
//   ctx.closePath();
//   ctx.fillStyle = "#3b82f6"; // base color; will be tinted via SDF 'icon-color' if needed
//   ctx.fill();

//   // inner white circle
//   ctx.beginPath();
//   ctx.arc(w / 2, 12, 6, 0, Math.PI * 2);
//   ctx.fillStyle = "#ffffff";
//   ctx.fill();

//   // Convert to ImageData for SDF-like usage (monochrome). If your map style needs true SDF,
//   // consider pre-generating an SDF sprite. For most cases, regular images work fine.
//   const img = ctx.getImageData(0, 0, w, h);
//   map.addImage(id, { width: w, height: h, data: img.data }, { pixelRatio: 2 });

//   return id;
// }

// ---------------------- Firestore fetchers ----------------------
async function getZones(categoryId: string) {
  const snap = await getDocs(
    query(collection(db, "zones"), where("categoryId", "==", categoryId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Array<{
    id: string;
    name: string;
    color?: string;
    categoryId: string;
  }>;
}

async function getZonePlacesFeatures(zoneId: string, zoneName: string) {
  const zref = doc(db, "zones", zoneId);
  const zdoc = await getDoc(zref);
  const z = zdoc.data() as any | undefined;
  const color = z?.color || "#3b82f6";

  const ps = await getDocs(collection(zref, "places"));

  const features = ps.docs
    .map((d) => {
      const p = d.data() as any;
      const { lat, lng } = toLatLng(p);
      if (typeof lat !== "number" || typeof lng !== "number") return null;

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat] as [number, number],
        },
        properties: {
          __source: "firestore",
          id: d.id,
          title: p.name ?? "Untitled",
          title_fr: p.name_fr ?? p.nameFr ?? "",
          info: p.info ?? "",
          info_fr: p.info_fr ?? p.infoFr ?? "",
          address: p.address ?? "",
          rating: typeof p.rating === "number" ? p.rating : null,
          tags: parseStringArray(p.tags),
          pointColor: p.pointColor ?? null, // kept (unused in icons-only view)
          imageUrl: p.imageUrl ?? null,
          brandTitle: p.brandTitle ?? null,
          brandSubtitle: p.brandSubtitle ?? null,
          locationLabel: p.locationLabel ?? zoneName,
          shortCode: p.shortCode ?? null,
          sportCount: typeof p.sportCount === "number" ? p.sportCount : null,
          sports: p.sports ?? null, // raw; normalized on click
          gradientFrom: p.gradientFrom ?? null,
          gradientTo: p.gradientTo ?? null,
          zoneName,
        },
      } as GeoJSON.Feature;
    })
    .filter(Boolean) as GeoJSON.Feature[];

  return { color, fc: { type: "FeatureCollection", features } as const };
}

async function getUnassignedFeatures(categoryId: string) {
  const ps = await getDocs(
    query(
      collection(db, "places"),
      where("categoryId", "==", categoryId),
      where("zoneId", "==", null),
    ),
  );

  const features = ps.docs
    .map((d) => {
      const p = d.data() as any;
      const { lat, lng } = toLatLng(p);
      if (typeof lat !== "number" || typeof lng !== "number") return null;

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat] as [number, number],
        },
        properties: {
          __source: "firestore",
          id: d.id,
          title: p.name ?? "Untitled",
          title_fr: p.name_fr ?? p.nameFr ?? "",
          info: p.info ?? "",
          info_fr: p.info_fr ?? p.infoFr ?? "",
          address: p.address ?? "",
          rating: typeof p.rating === "number" ? p.rating : null,
          tags: parseStringArray(p.tags),
          pointColor: p.pointColor ?? null, // kept (unused in icons-only view)
          imageUrl: p.imageUrl ?? null,
          brandTitle: p.brandTitle ?? null,
          brandSubtitle: p.brandSubtitle ?? null,
          locationLabel: p.locationLabel ?? "",
          shortCode: p.shortCode ?? null,
          sportCount: typeof p.sportCount === "number" ? p.sportCount : null,
          sports: p.sports ?? null, // raw; normalized on click
          gradientFrom: p.gradientFrom ?? null,
          gradientTo: p.gradientTo ?? null,
          zoneName: "Unassigned",
        },
      } as GeoJSON.Feature;
    })
    .filter(Boolean) as GeoJSON.Feature[];

  return {
    color: "#64748b",
    fc: { type: "FeatureCollection", features } as const,
    zoneName: "Unassigned",
  };
}

// ---------------------- cluster + icon layers (no circles) ----------------------
function addOrSetClusterSource(
  map: Map,
  sourceId: string,
  data: GeoJSON.FeatureCollection,
) {
  if (map.getSource(sourceId)) {
    const s = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
    s.setData(data as any);
  } else {
    map.addSource(sourceId, {
      type: "geojson",
      data: data as any,
      cluster: true,
      clusterRadius: 50,
      clusterMaxZoom: 14,
    });
  }
}

function removeLayerIfExists(map: Map, id: string) {
  if (map.getLayer(id)) map.removeLayer(id);
}

async function addClusterLayers(
  map: Map,
  baseSourceId: string,
  data: GeoJSON.FeatureCollection,
  _aboveLayerId: string | undefined,
  categoryId: string,
  opts: CategoryLayerOptions = {},
) {
  const { initiallyVisible = false } = opts;
  const clusterSourceId = `${baseSourceId}-clustered`;

  const clusterLayerId = `${clusterSourceId}-clusters`;
  const countLayerId = `${clusterSourceId}-cluster-count`;
  const symbolLayerId = `${clusterSourceId}-symbols`;

  const features = (data.features || []) as Array<
    GeoJSON.Feature<GeoJSON.Point, Record<string, any>>
  >;

  // 1) Register the local category image once
  const localPath = imgPathForCategory(categoryId);
  const localId = hashId(localPath);
  await ensureRuntimeImage(map, localId, localPath);

  // 2) For features with imageUrl, collect & register those too
  const need: Array<{ id: string; url: string }> = [];
  for (const f of features) {
    (f.properties ||= {})["__img"] = localId;
  }
  // for (const f of features) {
  //   const url = (f.properties?.imageUrl as string) || "";
  //   if (url) {
  //     const id = hashId(url);
  //     (f.properties ||= {})["__img"] = id;
  //     if (!need.find((n) => n.id === id)) need.push({ id, url });
  //   } else {
  //     // fallback to the already-registered local category image
  //     (f.properties ||= {})["__img"] = localId;
  //   }
  // }
  await Promise.all(need.map((n) => ensureRuntimeImage(map, n.id, n.url)));

  // 3) (Re)create the clustered source with __img set
  addOrSetClusterSource(map, clusterSourceId, data);

  if (!map.getLayer(`${clusterSourceId}-clusters-glow`)) {
    map.addLayer({
      id: `${clusterSourceId}-clusters-glow`,
      type: "circle",
      source: clusterSourceId,
      layout: { visibility: initiallyVisible ? "visible" : "none" },
      filter: ["has", "point_count"],
      paint: {
        "circle-color": CLUSTER_UI.GLOW, // alpha is in the color itself
        "circle-radius": [
          "step",
          ["get", "point_count"],
          22, // 0–9
          10,
          28, // 10–24
          25,
          34, // 25+
        ],
        "circle-pitch-scale": "viewport",
      },
    });
  }

  // 2) Core disk (white) with dark stroke
  if (!map.getLayer(`${clusterSourceId}-clusters-core`)) {
    map.addLayer({
      id: `${clusterSourceId}-clusters-core`,
      type: "circle",
      source: clusterSourceId,
      layout: { visibility: initiallyVisible ? "visible" : "none" },
      filter: ["has", "point_count"],
      paint: {
        "circle-color": CLUSTER_UI.CORE,
        "circle-radius": ["step", ["get", "point_count"], 12, 10, 14, 25, 16],
        "circle-stroke-color": CLUSTER_UI.STROKE,
        "circle-stroke-width": 2,
        "circle-pitch-scale": "viewport",
      },
    });
  }

  // 3) Thin blue ring (no fill)
  if (!map.getLayer(`${clusterSourceId}-clusters-ring`)) {
    map.addLayer({
      id: `${clusterSourceId}-clusters-ring`,
      type: "circle",
      source: clusterSourceId,
      layout: { visibility: initiallyVisible ? "visible" : "none" },
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "rgba(0,0,0,0)", // transparent fill
        "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 25, 22],
        "circle-stroke-color": CLUSTER_UI.RING,
        "circle-stroke-width": 2,
        "circle-pitch-scale": "viewport",
      },
    });
  }

  // Count label (dark text with soft white halo)
  if (!map.getLayer(countLayerId)) {
    map.addLayer({
      id: countLayerId,
      type: "symbol",
      source: clusterSourceId,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["to-string", ["get", "point_count"]],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"],
        "text-size": 12,
        visibility: initiallyVisible ? "visible" : "none",
      },
      paint: {
        "text-color": CLUSTER_UI.STROKE,
        "text-halo-color": CLUSTER_UI.HALO,
        "text-halo-width": 1.6,
        "text-halo-blur": 0.2,
      },
    });
  }

  if (!map.getLayer(symbolLayerId)) {
    map.addLayer({
      id: symbolLayerId,
      type: "symbol",
      source: clusterSourceId,
      filter: ["!", ["has", "point_count"]],
      layout: {
        "icon-image": ["get", "__img"],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-anchor": "bottom",
        // default sizes, will be replaced dynamically by highlightCategoryPlace()
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          0.9,
          14,
          1.1,
          16,
          1.25,
        ],
        "text-field": ["coalesce", ["get", "title"], ["get", "Name"], ""],
        "text-size": 11,
        "text-anchor": "top",
        "text-offset": [0, 1.0],
        "text-optional": true,
        visibility: initiallyVisible ? "visible" : "none",
      },
      paint: {
        "text-color": "#1f2937",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    });
  }

  const selectedHaloId = `${clusterSourceId}-selected-halo`;
  if (!map.getLayer(selectedHaloId)) {
    map.addLayer(
      {
        id: selectedHaloId,
        type: "circle",
        source: clusterSourceId,
        // only show real points (not clusters) and initially match nothing ("")
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          ["==", ["get", "id"], ""],
        ],
        layout: { visibility: initiallyVisible ? "visible" : "none" },
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            10,
            14,
            14,
            16,
            18,
          ],
          "circle-color": "rgba(59, 130, 246, 0.18)", // blue-ish glow
          "circle-stroke-color": "rgba(59, 130, 246, 0.55)",
          "circle-stroke-width": 1.5,
          "circle-pitch-scale": "viewport",
        },
      },
      symbolLayerId, // put halo right under symbols
    );
  }

  // clicks (unchanged) …
  map.on("click", clusterLayerId, (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: [clusterLayerId],
    });
    const clusterId = features[0]?.properties?.cluster_id;
    const src = map.getSource(clusterSourceId) as mapboxgl.GeoJSONSource;
    if (!src || clusterId == null) return;
    src.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err || zoom == null) return;
      const [lng, lat] = (features[0].geometry as any).coordinates as [
        number,
        number,
      ];
      map.easeTo({ center: [lng, lat], zoom });
    });
  });

  map.on("click", symbolLayerId, (e) => {
    const f = e.features?.[0];
    if (!f || f.geometry.type !== "Point") return;
    const coords = (f.geometry as any).coordinates as [number, number];
    const p = (f.properties || {}) as Record<string, any>;
    const title = (p["title"] as string) || (p["Name"] as string) || "Untitled";
    const titleFr =
      (p["title_fr"] as string) ||
      (p["name_fr"] as string) ||
      (p["nameFr"] as string) ||
      "";
    const gradient = gradientFromProps(p);
    const sports = parseArray<VenueSport>(p["sports"]) ?? [];
    const infoEn = (p["info"] as string) || "";
    const infoFr =
      (p["info_fr"] as string) || (p["infoFr"] as string) || "";
    console.log("[categoryPoints] popup info", {
      title,
      titleFr,
      infoEn,
      infoFr,
      props: p,
    });
    const node = renderVenuePopup({
      title,
      titleFr,
      zone: p["zoneName"] || categoryId,
      categoryId: p["categoryId"] || categoryId,
      info: infoEn,
      infoFr,
      imageUrl: (p["imageUrl"] as string) || undefined,
      address: (p["address"] as string) || "",
      rating:
        typeof p["rating"] === "number" ? (p["rating"] as number) : undefined,
      tags: parseStringArray(p["tags"]),
      coordinates: coords,
      onClose: () => popup.remove(),
      brandTitle: p["brandTitle"] as string | undefined,
      brandSubtitle: p["brandSubtitle"] as string | undefined,
      locationLabel: p["locationLabel"] as string | undefined,
      shortCode: p["shortCode"] as string | undefined,
      sportCount:
        typeof p["sportCount"] === "number"
          ? (p["sportCount"] as number)
          : sports.length,
      sports,
      gradient,
      website: p["website"] as string | undefined,
      socialHandle: p["socialHandle"] as string | undefined,
    });
    map.easeTo({ center: coords, zoom: Math.max(map.getZoom(), 15) });
    popup.setLngLat(coords).setDOMContent(node).addTo(map);
    popup.once("close", () => destroyPopup(node));
  });

  map.on(
    "mouseenter",
    clusterLayerId,
    () => (map.getCanvas().style.cursor = "pointer"),
  );
  map.on(
    "mouseenter",
    symbolLayerId,
    () => (map.getCanvas().style.cursor = "pointer"),
  );
  map.on(
    "mouseleave",
    clusterLayerId,
    () => (map.getCanvas().style.cursor = ""),
  );
  map.on(
    "mouseleave",
    symbolLayerId,
    () => (map.getCanvas().style.cursor = ""),
  );
}

// ---------------------- main entry (ICONS ONLY) ----------------------
export async function addDbCategoryPointsLayer(
  map: Map,
  categoryId: string,
  prefix: string,
  opts: CategoryLayerOptions = {},
) {
  // ZONED
  const zones = await getZones(categoryId);
  for (const z of zones) {
    const { fc } = await getZonePlacesFeatures(z.id, z.name);
    if (fc.features.length === 0) continue;

    // annotate icon + category (in-memory only)
    for (const f of fc.features) {
      (f.properties as any).__icon = iconForCategory(categoryId);
      (f.properties as any).categoryId = categoryId;
    }

    const sourceId = `${prefix}${slugify(z.name)}-sites`;
    const circleLayerId = `${sourceId}-points`; // legacy circle id (we will remove)

    // keep source for compatibility (not used by icons), optional
    addOrSetSource(map, sourceId, fc);

    // REMOVE any existing small circle layer for this source
    removeLayerIfExists(map, circleLayerId);

    // add clustered MAKI icons
    await addClusterLayers(
      map,
      sourceId,
      fc as GeoJSON.FeatureCollection,
      undefined,
      categoryId,
      opts,
    );
  }

  // UNASSIGNED
  const un = await getUnassignedFeatures(categoryId);
  if (un.fc.features.length > 0) {
    for (const f of un.fc.features) {
      (f.properties as any).__icon = iconForCategory(categoryId);
      (f.properties as any).categoryId = categoryId;
    }

    const sourceId = `${prefix}unassigned-sites`;
    const circleLayerId = `${sourceId}-points`; // legacy circle id

    addOrSetSource(map, sourceId, un.fc);

    // REMOVE any existing small circle layer
    removeLayerIfExists(map, circleLayerId);

    // add clustered MAKI icons
    await addClusterLayers(
      map,
      sourceId,
      un.fc as GeoJSON.FeatureCollection,
      undefined,
      categoryId,
      opts,
    );
  }
}

// PUT THIS NEAR THE BOTTOM OF categoryPoints.ts (export it):
function getSymbolHaloIds(map: Map) {
  const style = map.getStyle();
  if (!style?.layers) return { symbols: [] as string[], halos: [] as string[] };

  // match the layers we create in addClusterLayers()
  const ids = style.layers.map((l) => l.id);
  const symbols = ids.filter(
    (id) => id?.includes("-clustered-") && id?.endsWith("-symbols"),
  ) as string[];
  const halos = ids.filter(
    (id) => id?.includes("-clustered-") && id?.endsWith("-selected-halo"),
  ) as string[];
  return { symbols, halos };
}

export function highlightCategoryPlace(
  map: Map,
  _categoryId: string,
  placeId: string | null,
) {
  // Try to apply immediately; if nothing matched, retry a few times on the next frames.
  let attempts = 0;
  const maxAttempts = 8; // ~8 frames (~130ms on 60fps); bump if you want

  const apply = () => {
    const { symbols, halos } = getSymbolHaloIds(map);

    // Set halo filter for the selected feature
    let touched = 0;
    for (const haloId of halos) {
      if (!map.getLayer(haloId)) continue;
      map.setFilter(haloId, [
        "all",
        ["!", ["has", "point_count"]],
        ["==", ["get", "id"], placeId ?? ""],
      ] as any);
      touched++;
    }

    // Bump icon size for the selected feature
    const sizeExpr = [
      "interpolate",
      ["linear"],
      ["zoom"],
      10,
      ["case", ["==", ["get", "id"], placeId ?? ""], 1.3, 0.9],
      14,
      ["case", ["==", ["get", "id"], placeId ?? ""], 1.6, 1.1],
      16,
      ["case", ["==", ["get", "id"], placeId ?? ""], 1.8, 1.25],
    ];
    for (const symId of symbols) {
      if (!map.getLayer(symId)) continue;
      map.setLayoutProperty(symId, "icon-size", sizeExpr as any);
      touched++;
    }

    if (touched === 0 && attempts < maxAttempts) {
      attempts++;
      requestAnimationFrame(apply); // layers might not be in the style yet; try again next frame
    }
  };

  apply();
}

let _bounceRAF: number | null = null;

export function startBounceSelected(
  map: Map,
  _categoryId: string,
  placeId: string | null,
) {
  stopBounceSelected(map); // cancel any previous loop

  const t0 = performance.now();

  const tick = (t: number) => {
    const phase = (t - t0) / 1000;
    const bounce = Math.sin(phase * 2 * Math.PI); // ~1Hz
    const liftPx = -3 * Math.abs(bounce);
    const scale = 1.3 + 0.12 * Math.abs(bounce);
    const haloScale = 1 + 0.25 * Math.abs(bounce);

    // ⬇️ Re-scan the style *each frame* so late-added competition layers get included
    const { symbols, halos } = getSymbolHaloIds(map);

    const sizeExpr = [
      "interpolate",
      ["linear"],
      ["zoom"],
      10,
      ["case", ["==", ["get", "id"], placeId ?? ""], scale, 0.9],
      14,
      ["case", ["==", ["get", "id"], placeId ?? ""], scale + 0.2, 1.1],
      16,
      ["case", ["==", ["get", "id"], placeId ?? ""], scale + 0.35, 1.25],
    ];
    const offsetExpr = [
      "case",
      ["==", ["get", "id"], placeId ?? ""],
      ["literal", [0, liftPx]],
      ["literal", [0, 0]],
    ];

    for (const id of symbols) {
      if (!map.getLayer(id)) continue;
      map.setLayoutProperty(id, "icon-size", sizeExpr as any);
      map.setLayoutProperty(id, "icon-offset", offsetExpr as any);
    }

    for (const id of halos) {
      if (!map.getLayer(id)) continue;
      map.setPaintProperty(id, "circle-radius", [
        "interpolate",
        ["linear"],
        ["zoom"],
        10,
        10 * haloScale,
        14,
        14 * haloScale,
        16,
        18 * haloScale,
      ] as any);
    }

    _bounceRAF = requestAnimationFrame(tick);
  };

  _bounceRAF = requestAnimationFrame(tick);
}

export function stopBounceSelected(map?: Map) {
  if (_bounceRAF) cancelAnimationFrame(_bounceRAF);
  _bounceRAF = null;

  if (!map) return;
  const { symbols } = getSymbolHaloIds(map);
  for (const id of symbols) {
    if (map.getLayer(id))
      map.setLayoutProperty(id, "icon-offset", [0, 0] as any);
  }
}

const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: true });
