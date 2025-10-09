import { useEffect, useMemo, useRef, useState } from "react";
import type { Feature, Point, GeoJsonProperties } from "geojson";
// import { MapManager } from "../../../core/MapManager";
// import {
//   getZonesForCategory,
//   getZoneFeatureCollection,
//   getUnassignedFeatureCollection,
// } from "../../../data/firestore/firestorePlaces";
import { MapManager } from "../../core/MapManager";
import {
  getUnassignedFeatureCollection,
  getZoneFeatureCollection,
  getZonesForCategory,
} from "../../data/firestore/firestorePlaces";
import { useTranslation } from "react-i18next";

// —— types & helpers ——
type VenueFeature = Feature<Point, GeoJsonProperties>;
type LoadedVenue = VenueFeature & {
  zoneColor: string;
  __catId: string;
  __catLabel: string;
  __zone: string;
};

export interface SiteConfig {
  name: string;
  file: string;
  color: string;
}
export interface CategoryConfig {
  id: string;
  label: string;
  sources: SiteConfig[];
  hint?: string;
}

function getFeatureCategoryId(props: GeoJsonProperties | undefined): string {
  const p = props || {};
  const v =
    (p.categoryId as string) ??
    (p.category as string) ??
    (p.cat as string) ??
    (p.type as string) ??
    "";
  return String(v).toLowerCase();
}

function layerPrefixFor(catId: string): string {
  if (catId === "competition") return "comp-";
  if (catId === "training") return "train-";
  if (catId === "fan-zones") return "fanz-";
  if (catId === "hotels") return "hotel-";
  if (catId === "restaurants") return "rest-";
  if (catId === "artworks") return "artworks-";
  if (catId === "attraction") return "attraction-";
  if (catId === "castle") return "castle-";
  if (catId === "church") return "church-";
  if (catId === "gallery") return "gallery-";
  if (catId === "memorial") return "memorial-";
  if (catId === "monument") return "monument-";
  if (catId === "mosque") return "mosque-";
  if (catId === "museum") return "museum-";
  if (catId === "viewpoints") return "viewpoints-";
  if (catId === "zoo") return "zoo-";
  if (catId === "hospitals") return "hosp-";
  if (catId === "transport") return "trans-";
  if (catId === "police") return "pol-";
  if (catId === "bank") return "ban-";
  if (catId === "atm") return "atm-";
  if (catId === "firestation") return "fires-";
  if (catId === "embassy") return "embassy-";
  if (catId === "consulate") return "consulate-";
  if (catId === "airport") return "airport-";
  if (catId === "bus") return "bus-";
  if (catId === "ferry") return "ferry-";
  if (catId === "railway") return "railway-";
  return `${catId}-`;
}

function getCategoryLayerIds(catId: string, map: mapboxgl.Map): string[] {
  const prefix = layerPrefixFor(catId);
  const style = map.getStyle();
  const layers = style?.layers || [];
  return layers
    .filter((l) => l.id?.startsWith?.(prefix) && l.id.endsWith("-points"))
    .map((l) => l.id);
}

function openPopupForCategory(
  catId: string,
  lng: number,
  lat: number,
  map: mapboxgl.Map,
) {
  const layerIds = getCategoryLayerIds(catId, map);
  if (layerIds.length === 0) return;

  const pt = map.project([lng, lat]);
  const bbox: [mapboxgl.PointLike, mapboxgl.PointLike] = [
    { x: pt.x - 6, y: pt.y - 6 } as any,
    { x: pt.x + 6, y: pt.y + 6 } as any,
  ];

  const hits = map.queryRenderedFeatures(bbox, { layers: layerIds });
  if (hits.length > 0) {
    (map as any).fire("click", {
      point: pt,
      lngLat: { lng, lat },
    });
  }
}

// —— component ——
export function LocalPlacesTab({
  categories,
  query,
  onQueryChange,
  onPicked,
}: {
  categories: CategoryConfig[];
  query: string;
  onQueryChange: (q: string) => void;
  onPicked: () => void;
}) {
  const { t } = useTranslation();
  const mapManager = MapManager.getInstance();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dataLoadedRef = useRef(false);
  const [venues, setVenues] = useState<LoadedVenue[]>([]);

  // load once, first time this tab is shown
  useEffect(() => {
    if (dataLoadedRef.current) return;

    let cancelled = false;
    async function loadAll() {
      setLoading(true);
      setError(null);
      const all: LoadedVenue[] = [];

      try {
        for (const cat of categories) {
          const sources = await getZonesForCategory(cat.id);

          for (const site of sources) {
            try {
              const zoneId = site.file.replace("firestore://", "");
              const { fc, color } = await getZoneFeatureCollection(zoneId);
              const features = (fc.features || []) as VenueFeature[];

              features
                .filter((f) => {
                  const catProp = getFeatureCategoryId(f.properties);
                  if (!catProp) return true;
                  if (catProp === cat.id) return true;

                  if (cat.id === "competition") {
                    const sc = Number(f.properties?.sportCount ?? 0);
                    const hasSportsArr =
                      Array.isArray(f.properties?.sports) &&
                      f.properties!.sports.length > 0;
                    return sc > 0 || hasSportsArr;
                  }
                  return false;
                })
                .forEach((f) => {
                  const zoneLabel = site.name;
                  const props = { ...f.properties, zone: zoneLabel };
                  const enriched: LoadedVenue = {
                    ...f,
                    properties: props,
                    zoneColor: site.color || color,
                    __catId: cat.id,
                    __catLabel: cat.label,
                    __zone: zoneLabel,
                  };
                  all.push(enriched);
                });
            } catch (err) {
              console.error(`Failed zone ${site.name}:`, err);
            }
          }

          const { fc: unFc, color: unColor } =
            await getUnassignedFeatureCollection(cat.id);
          const unFeatures = (unFc.features || []) as VenueFeature[];
          unFeatures.forEach((f) => {
            const zoneLabel =
              (f.properties?.zone as string) || t("local.zone.unassigned");
            const props = { ...f.properties, zone: zoneLabel };
            const enriched: LoadedVenue = {
              ...f,
              properties: props,
              zoneColor: unColor,
              __catId: cat.id,
              __catLabel: cat.label,
              __zone: zoneLabel,
            };
            all.push(enriched);
          });
        }

        if (!cancelled) {
          setVenues(all);
          dataLoadedRef.current = true;
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? t("local.error.loadPlaces"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [categories]);

  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return venues;
    return venues.filter((v) => {
      const name =
        (v.properties?.Name as string) ||
        (v.properties?.title as string) ||
        (v.properties?.name as string) ||
        "";
      return (
        name.toLowerCase().includes(t) ||
        v.__zone.toLowerCase().includes(t) ||
        v.__catLabel.toLowerCase().includes(t)
      );
    });
  }, [query, venues]);

  const handleSelect = (v: LoadedVenue) => {
    const map = mapManager.getMap();
    if (!map) return;
    const [lng, lat] = v.geometry.coordinates;

    map.flyTo({ center: [lng, lat], zoom: 14, speed: 1.2 });
    const once = () => {
      openPopupForCategory(v.__catId, lng, lat, map);
      map.off("moveend", once);
    };
    map.on("moveend", once);

    onPicked();
  };

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t("local.search.placeholder")}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          ⌘K
        </span>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid place-items-center py-10">
          <div className="flex items-center gap-3 text-gray-600">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
            <span>{t("local.loading")}</span>
          </div>
        </div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500">{t("local.noMatches")}</div>
      ) : (
        <ul className="max-h-[60vh] overflow-y-auto divide-y divide-black/5">
          {filtered.map((v, i) => {
            const name =
              (v.properties?.Name as string) ||
              (v.properties?.title as string) ||
              (v.properties?.name as string) ||
              t("local.untitled");
            const [lng, lat] = v.geometry.coordinates;
            return (
              <li key={`${name}-${i}`}>
                <button
                  onClick={() => handleSelect(v)}
                  className="w-full text-left px-3 py-3 hover:bg-black/5 transition flex items-center gap-3"
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: v.zoneColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {v.__catLabel} • {v.__zone} • {lng.toFixed(4)},
                      {lat.toFixed(4)}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
