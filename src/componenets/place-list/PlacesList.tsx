// src/componenets/PlacesList.tsx
import { useEffect, useMemo, useState } from "react";
import { MapManager } from "../../core/MapManager";
import type { Feature, Point, GeoJsonProperties } from "geojson";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedButton } from "../buttons/AnimatedButton";
import {
  getUnassignedFeatureCollection,
  getZoneFeatureCollection,
  getZonesForCategory,
} from "../../data/firestore/firestorePlaces";
import { PlacesCategoryList } from "./PlacesCategoryList";
import {
  highlightCategoryPlace,
  startBounceSelected,
  stopBounceSelected,
} from "../../core/layers/categoryPoints";
import mapboxgl from "mapbox-gl";
import { CATEGORIES } from "./place-list-utils";
import { Modal } from "../common/Modal";

type VenueFeature = Feature<Point, GeoJsonProperties>;
const DEFAULT_VISIBLE_CATS = new Set<string>(["competition"]);
export interface SiteConfig {
  name: string; // zone name
  file: string; // firestore://<zoneId>
  color: string;
}
export interface CategoryConfig {
  id: string;
  label: string;
  sources: SiteConfig[];
  hint?: string;
}

type LoadedVenue = VenueFeature & { zoneColor: string };

const collapseVariants = {
  closed: {
    height: 0,
    opacity: 0,
    transition: { type: "tween" as const, duration: 0.2 },
  },
  open: {
    height: "auto",
    opacity: 1,
    transition: { type: "tween" as const, duration: 0.25 },
  },
};

// --- helpers to read category from feature props safely
function getFeatureCategoryId(props: GeoJsonProperties | undefined): string {
  const p = props || {};
  // prefer the Firestore field name used in AddPlaceFull
  const v =
    (p.categoryId as string) ??
    (p.category as string) ??
    (p.cat as string) ??
    (p.type as string) ??
    "";
  return String(v).toLowerCase();
}

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return m;
}

export function PlacesList() {
  const isMobile = useIsMobile();
  const mapManager = MapManager.getInstance();
  const [panelOpen, setPanelOpen] = useState(false);

  const [openCatId, setOpenCatId] = useState<string | null>(CATEGORIES[0].id);
  const [openZones, setOpenZones] = useState<Record<string, boolean>>({});

  const [checkedCats, setCheckedCats] = useState<Record<string, boolean>>(
    Object.fromEntries(
      CATEGORIES.map((c) => [c.id, DEFAULT_VISIBLE_CATS.has(c.id)]),
    ),
  );

  const activeCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === openCatId) ?? CATEGORIES[0],
    [openCatId],
  );

  const [venues, setVenues] = useState<LoadedVenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchForCategory(cat: CategoryConfig) {
      setLoading(true);
      setLoadError(null);
      setVenues([]);

      try {
        const sources = await getZonesForCategory(cat.id); // zones that belong to this category (may be [])

        const all: LoadedVenue[] = [];

        // 1) ZONED places — filter features to THIS category only
        for (const site of sources) {
          try {
            const zoneId = site.file.replace("firestore://", "");
            const { fc, color } = await getZoneFeatureCollection(zoneId);
            const features = (fc.features || []) as VenueFeature[];

            features
              .filter((f) => {
                const catProp = getFeatureCategoryId(f.properties);
                if (!catProp) {
                  // legacy records without categoryId — since we loaded this zone
                  // via getZonesForCategory(cat.id), treat them as this category
                  return true;
                }
                if (catProp === cat.id) return true;

                // Heuristic for competition data:
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
                f.properties = { ...f.properties, zone: site.name };
                all.push({ ...f, zoneColor: site.color || color });
              });
          } catch (err) {
            console.error(`Failed to load ${site.name}:`, err);
          }
        }

        // 2) UNASSIGNED places (API already takes cat, but filter defensively)
        const { fc: unFc, color: unColor } =
          await getUnassignedFeatureCollection(cat.id);
        const unFeatures = (unFc.features || []) as VenueFeature[];
        unFeatures.forEach((f) => {
          const zoneLabel = (f.properties?.zone as string) || "Unassigned";
          f.properties = { ...f.properties, zone: zoneLabel };
          all.push({ ...f, zoneColor: unColor });
        });

        if (cancelled) return;

        setVenues(all);

        // expand all zones initially
        const init: Record<string, boolean> = {};
        const zones = new Set(
          all.map((v) => (v.properties?.zone as string) ?? "Unknown"),
        );
        zones.forEach((z) => (init[z] = true));
        setOpenZones(init);
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message ?? "Failed to load venues.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchForCategory(activeCategory);
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  // === layer helpers (prefixes must match your style layer ids) ===
  function layerPrefixFor(catId: string): string {
    if (catId === "competition") return "comp-";
    if (catId === "training") return "train-";
    if (catId === "castle") return "castle-";
    if (catId === "hotels") return "hotel-";
    if (catId === "restaurants") return "rest-";
    if (catId === "artworks") return "artworks-";
    if (catId === "attraction") return "attraction-";
    if (catId === "church") return "church-";
    if (catId === "gallery") return "gallery-";
    if (catId === "memorial") return "memorial-";
    if (catId === "mosque") return "mosque-";
    if (catId === "monument") return "monument-";
    if (catId === "museum") return "museum-";
    if (catId === "viewpoints") return "viewpoints-";
    if (catId === "zoo") return "zoo-";
    if (catId === "hospitals") return "hosp-";
    if (catId === "transport") return "trans-";
    if (catId === "police") return "pol-";
    if (catId === "bank") return "ban-";
    if (catId === "atm") return "atm-";
    if (catId === "firestation") return "fires-";
    if (catId === "airport") return "airport-";
    if (catId === "bus") return "bus-";
    if (catId === "ferry") return "ferry-";
    if (catId === "railway") return "railway-";
    return `${catId}-`;
  }

  function getCategoryLayerIds(catId: string): string[] {
    const map = mapManager.getMap();
    if (!map) return [];
    const prefix = layerPrefixFor(catId);
    const style = map.getStyle();
    const layers = style?.layers || [];

    return layers
      .filter((l) => l.id?.startsWith?.(prefix) && l.id.includes("-clustered-"))
      .map((l) => l.id);
  }

  // NEW: only symbol layers for a category (the ones that have the feature ids)
  function getCategorySymbolLayerIds(catId: string): string[] {
    const map = mapManager.getMap();
    if (!map) return [];
    const prefix = layerPrefixFor(catId);
    const style = map.getStyle();
    const layers = style?.layers || [];
    return layers
      .map((l) => l.id)
      .filter(
        (id) =>
          id?.startsWith(prefix) &&
          id?.includes("-clustered-") &&
          id?.endsWith("-symbols"),
      ) as string[];
  }

  function setCategoryVisibility(catId: string, visible: boolean) {
    const map = mapManager.getMap();
    if (!map) return;
    const ids = getCategoryLayerIds(catId);
    for (const id of ids) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
      }
    }
  }

  function applyCategoryEmphasis(catId: string, checked: boolean) {
    const map = mapManager.getMap();
    if (!map) return;
    const layerIds = getCategoryLayerIds(catId);

    const radiusExpr: any = [
      "interpolate",
      ["linear"],
      ["zoom"],
      8,
      checked ? 8 : 4,
      12,
      checked ? 12 : 6,
      16,
      checked ? 18 : 10,
    ];

    for (const layerId of layerIds) {
      if (!map.getLayer(layerId)) continue;
      const type = (map.getStyle().layers || []).find(
        (l) => l.id === layerId,
      )?.type;

      if (type === "circle") {
        map.setPaintProperty(layerId, "circle-radius", radiusExpr);
      }
    }
  }

  function handleCategoryCheck(
    e: React.ChangeEvent<HTMLInputElement>,
    catId: string,
  ) {
    const next = e.target.checked;

    setCategoryVisibility(catId, next); // 👈 show/hide clusters + symbols
    applyCategoryEmphasis(catId, next); // optional size emphasis

    setCheckedCats((prev) => ({ ...prev, [catId]: next }));
    e.stopPropagation();
  }

  // Hit-test near [lng,lat] on the category's symbol layers and pull a usable id
  function findFeatureIdAt(
    catId: string,
    lng: number,
    lat: number,
  ): string | null {
    const map = mapManager.getMap();
    if (!map) return null;

    const pt = map.project([lng, lat]);
    const p1 = new mapboxgl.Point(pt.x - 6, pt.y - 6);
    const p2 = new mapboxgl.Point(pt.x + 6, pt.y + 6);

    const layers = getCategorySymbolLayerIds(catId);
    if (!layers.length) return null;

    const hits = map.queryRenderedFeatures([p1, p2], { layers });
    if (!hits.length) return null;

    const f: any = hits[0];
    // Try a few common locations for the id
    return (
      (f.properties &&
        (f.properties.id || f.properties.docId || f.properties.placeId)) ||
      (f.id as string) ||
      null
    );
  }

  // 🔔 open the correct popup for the active category near [lng,lat]
  function openPopupForCategory(catId: string, lng: number, lat: number) {
    const map = mapManager.getMap();
    if (!map) return;

    const layerIds = getCategoryLayerIds(catId);
    if (layerIds.length === 0) return;

    const pt = map.project([lng, lat]);
    const p1 = new mapboxgl.Point(pt.x - 6, pt.y - 6);
    const p2 = new mapboxgl.Point(pt.x + 6, pt.y + 6);

    const hits = map.queryRenderedFeatures([p1, p2], { layers: layerIds });
    if (hits.length > 0) {
      (map as any).fire("click", { point: pt, lngLat: { lng, lat } });
    }
  }

  // update signature to accept id
  const handleClick = (
    lng: number,
    lat: number,
    title: string,
    id?: string,
  ) => {
    setSelectedTitle(title);
    const map = mapManager.getMap();
    if (map) {
      // Ensure this category is visible
      setCategoryVisibility(activeCategory.id, true);
      setCheckedCats((prev) => ({ ...prev, [activeCategory.id]: true }));

      // Stop any previous bounce right away
      stopBounceSelected(map);

      // If we already have an id from the list, apply immediately
      const apply = (pid: string | null) => {
        if (!pid) return;
        highlightCategoryPlace(map, activeCategory.id, pid);
        startBounceSelected(map, activeCategory.id, pid);
      };
      if (id) apply(id);

      map.flyTo({
        center: [lng, lat],
        // > clusterMaxZoom (14) ensures clusters split so symbols are queryable
        zoom: Math.max(15, map.getZoom()),
        speed: 1.2,
      });

      const once = () => {
        // If no id was supplied, recover it from rendered symbol features now
        if (!id) {
          const recovered = findFeatureIdAt(activeCategory.id, lng, lat);
          apply(recovered);
        }
        openPopupForCategory(activeCategory.id, lng, lat);
        map.off("moveend", once);
      };
      map.on("moveend", once);
    }
    if (window.innerWidth < 768) setPanelOpen(false);
  };

  const grouped = useMemo(() => {
    const by: Record<string, LoadedVenue[]> = {};
    for (const v of venues) {
      const zone = (v.properties?.zone as string) ?? "Unknown";
      (by[zone] ||= []).push(v);
    }
    return by;
  }, [venues]);

  // re-apply emphasis on hot reload / map mount
  useEffect(() => {
    const map = mapManager.getMap();
    if (!map) return;
    Object.entries(checkedCats).forEach(([catId, isChecked]) => {
      setCategoryVisibility(catId, isChecked); // 👈 ensure visibility matches UI
      applyCategoryEmphasis(catId, isChecked);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapManager]);

  useEffect(() => {
    // when category changes, stop current bounce
    const map = mapManager.getMap();
    if (map) stopBounceSelected(map);
  }, [openCatId]);

  const Chevron = ({ open }: { open: boolean }) => (
    <svg
      className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M7.23 14.77a.75.75 0 01-1.06-1.06l4-4-4-4a.75.75 0 111.06-1.06l4.53 4.53a.75.75 0 010 1.06l-4.53 4.53z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <>
      <div className="relative inline-block z-40">
        <AnimatedButton
          isOpen={panelOpen}
          onClick={() => setPanelOpen(!panelOpen)}
        />

        {/* 👉 MOBILE: full modal */}
        {isMobile ? (
          <Modal
            isOpen={panelOpen}
            onClose={() => setPanelOpen(false)}
            // showClose={false}
            // title="Places"
            title={null}
            // make it full-width on mobile; desktop keeps default
            panelClassName="w-full max-w-dvw sm:max-w-md rounded-xl sm:rounded-xl rounded-none"
            contentClassName="px-0 py-0 m-0 h-[85vh]" // tall, scrollable
          >
            <div className="text-sm h-full overflow-y-auto">
              <PlacesCategoryList
                CATEGORIES={CATEGORIES}
                openCatId={openCatId}
                activeCategory={activeCategory}
                setOpenCatId={setOpenCatId}
                checkedCats={checkedCats}
                handleCategoryCheck={handleCategoryCheck}
                venues={venues}
                Chevron={Chevron}
                collapseVariants={collapseVariants}
                loading={loading}
                loadError={loadError}
                grouped={grouped}
                openZones={openZones}
                setOpenZones={setOpenZones}
                handleClick={handleClick}
                selectedTitle={selectedTitle}
              />
            </div>
          </Modal>
        ) : (
          // 💻 DESKTOP/TABLET: keep your anchored popover
          <AnimatePresence>
            {panelOpen && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0, x: 8 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0.95, opacity: 0, x: 8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="absolute top-0 right-full mr-3
                       bg-white/70 backdrop-blur-md shadow-lg
                       rounded-xl sm:rounded p-4 text-sm
                       w-[90vw] sm:w-72 max-h-[50dvh] overflow-y-auto"
              >
                <PlacesCategoryList
                  CATEGORIES={CATEGORIES}
                  openCatId={openCatId}
                  activeCategory={activeCategory}
                  setOpenCatId={setOpenCatId}
                  checkedCats={checkedCats}
                  handleCategoryCheck={handleCategoryCheck}
                  venues={venues}
                  Chevron={Chevron}
                  collapseVariants={collapseVariants}
                  loading={loading}
                  loadError={loadError}
                  grouped={grouped}
                  openZones={openZones}
                  setOpenZones={setOpenZones}
                  handleClick={handleClick}
                  selectedTitle={selectedTitle}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </>
  );
}
