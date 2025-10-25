// src/core/layers/zones.ts
import { Map } from "mapbox-gl";
import { ZONES } from "../../data/zones.config";
import { addOrSetSource } from "../map/utils";

// ---- Neon palette (blue, pleasant & legible at night) ----
const NEON_OUTER = "#0066FF"; // electric royal blue (soft aura)
const NEON_INNER = "#00E5FF"; // bright aqua (tight glow)
const NEON_CORE = "#E6F7FF"; // very light blue (crisp tube)

// ---- helpers ----
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^\w\s-]/g, "") // remove other specials
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

function ensureSource(map: Map, sourceId: string, data: GeoJSON.GeoJSON) {
  if (map.getSource(sourceId)) return;
  addOrSetSource(map, sourceId, data);
}
function ensureLayer(map: Map, layer: mapboxgl.AnyLayer, beforeId?: string) {
  if (map.getLayer(layer.id)) return;
  map.addLayer(layer, beforeId);
}

export async function addZoneLayers(map: Map) {
  // Make sure style is loaded before adding layers
  if (!map.isStyleLoaded()) {
    await new Promise<void>((resolve) => {
      const handler = () => {
        map.off("styledata", handler);
        resolve();
      };
      map.on("styledata", handler);
    });
  }

  await Promise.all(
    ZONES.map(async (zone) => {
      const base = slug(zone.name); // e.g., "hospital-hopitaux"
      const sourceId = `${base}-zone`;
      const fillId = `${base}-fill`;
      const glow1Id = `${base}-glow1`; // outer aura
      const glow2Id = `${base}-glow2`; // inner glow
      const outlineId = `${base}-outline`; // crisp core
      const labelId = `${base}-label`;

      // fetch source if needed
      if (!map.getSource(sourceId)) {
        const res = await fetch(zone.file);
        const geojson = (await res.json()) as GeoJSON.GeoJSON;
        ensureSource(map, sourceId, geojson);
      }

      // invisible fill (kept for hit-testing if needed)
      ensureLayer(map, {
        id: fillId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": zone.color || "transparent",
          "fill-opacity": 0,
        },
      });

      // ---- Neon outline (3-layer stack) ----

      // Outer glow (soft aura)
      ensureLayer(map, {
        id: glow1Id,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": NEON_OUTER,
          "line-width": 18,
          "line-blur": 12,
          "line-opacity": 0.45,
        },
      });

      // Inner glow (tighter, brighter)
      ensureLayer(map, {
        id: glow2Id,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": NEON_INNER,
          "line-width": 10,
          "line-blur": 6,
          "line-opacity": 0.7,
        },
      });

      // Core tube (crisp line)
      ensureLayer(map, {
        id: outlineId,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": NEON_CORE,
          "line-width": 2.4,
          "line-opacity": 1,
        },
      });

      // ---- Label (force it to show) ----
      // If this still doesn't appear, it's almost always collision rules:
      // we explicitly allow overlap & ignore placement.
      ensureLayer(map, {
        id: labelId,
        type: "symbol",
        source: sourceId,
        layout: {
          "symbol-placement": "point",
          // "text-field": zone.name, // <- from ZONES config
          "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8,
            12,
            12,
            16,
            16,
            22,
          ],
          "text-anchor": "center",
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-color": "#0B1220", // dark slate for readability
          "text-halo-color": "#FFFFFF",
          "text-halo-width": 1.6,
          "text-halo-blur": 0.4,
        },
      });
    }),
  );
}
