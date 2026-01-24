// src/core/layers/competitionSites.ts
import mapboxgl, { Map as MapboxMap } from "mapbox-gl";
import { addOrSetSource } from "../map/utils";
import { destroyPopup, renderVenuePopup } from "../../componenets/popupRenderer";
import {
  getZonesForCategory,
  getZoneFeatureCollection,
} from "../../data/firestore/firestorePlaces";
import type { VenueSport } from "../../data/sitesMeta"; // ✅ add this

const sharedPopup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: true,
});

type LayerClickEvent = mapboxgl.MapMouseEvent & {
  features?: Array<
    GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>
  >;
};

// ---------- helpers to robustly parse props coming from mapbox ----------
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

function parseGradient(
  props: Record<string, any>,
): [string, string] | undefined {
  const g = parseArray<string>(props["gradient"]);
  if (g?.length === 2 && g[0] && g[1]) return [String(g[0]), String(g[1])];

  const gf = props["gradientFrom"];
  const gt = props["gradientTo"];
  if (typeof gf === "string" && typeof gt === "string" && gf && gt) {
    return [gf, gt];
  }
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

export async function addCompetitionSitesLayer(map: MapboxMap) {
  const zones = await getZonesForCategory("competition");

  for (const z of zones) {
    const zoneId = z.file.replace("firestore://", "");
    const sourceId = `comp-${z.name.toLowerCase()}-sites`;
    const layerId = `${sourceId}-points`;

    const { fc, color } = await getZoneFeatureCollection(zoneId);
    if (!fc.features.length) continue;

    addOrSetSource(map, sourceId, fc);

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": 6,
          "circle-color": [
            "coalesce",
            ["get", "pointColor"],
            z.color || color || "#3b82f6",
            "#3b82f6",
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
        },
      });

      map.on("click", layerId, (e: LayerClickEvent) => {
        const feature = e.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;

        const coords = feature.geometry.coordinates as [number, number];
        const props = (feature.properties || {}) as Record<string, any>;

        const title =
          (props["title"] as string) ||
          (props["Name"] as string) ||
          (props["Nom"] as string) ||
          "Unknown Venue";
        const titleFr =
          (props["title_fr"] as string) ||
          (props["name_fr"] as string) ||
          (props["nameFr"] as string) ||
          "";

        const info =
          (props["info"] as string) || (props["description"] as string) || "";
        const infoFr =
          (props["info_fr"] as string) || (props["infoFr"] as string) || "";
        console.log("[competitionSites] popup info", {
          title,
          titleFr,
          info,
          infoFr,
          props,
        });

        const imageUrl = (props["imageUrl"] as string) || undefined;
        const address = (props["address"] as string) || "";
        const rating =
          typeof props["rating"] === "number"
            ? (props["rating"] as number)
            : undefined;
        const tags = parseStringArray(props["tags"]);

        // ✅ typed as VenueSport[]
        const sports = parseArray<VenueSport>(props["sports"]) ?? [];
        const gradient = parseGradient(props);

        const isMobile = window.matchMedia("(max-width: 640px)").matches;
        if (isMobile) {
          const yOffset = Math.min(260, map.getCanvas().height * 0.33);
          map.easeTo({
            center: coords,
            offset: [0, -yOffset],
            duration: 250,
            essential: true,
          });
        }

        const node = renderVenuePopup({
          title,
          titleFr,
          zone: z.name,
          info,
          infoFr,
          imageUrl,
          address,
          rating,
          tags,
          coordinates: coords,
          onClose: () => sharedPopup.remove(),

          categoryId: "competition",
          brandTitle: props["brandTitle"] as string | undefined,
          brandSubtitle: props["brandSubtitle"] as string | undefined,
          locationLabel: (props["locationLabel"] as string) || z.name,
          shortCode: props["shortCode"] as string | undefined,
          sportCount:
            typeof props["sportCount"] === "number"
              ? (props["sportCount"] as number)
              : sports.length,
          sports, // ✅ VenueSport[]
          gradient,
          website: props["website"] as string | undefined,
          socialHandle: props["socialHandle"] as string | undefined,
        });

        sharedPopup.setLngLat(coords).setDOMContent(node).addTo(map);
        sharedPopup.once("close", () => destroyPopup(node));
      });

      map.on("mouseenter", layerId, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
      });
    } else {
      addOrSetSource(map, sourceId, fc);
    }
  }
}
