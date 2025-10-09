import mapboxgl, { type Map, type LngLatLike } from "mapbox-gl";
import type {
  RouteDetails,
  StepDetail,
  RouteAnnotations,
  RouteAlternative,
} from "../core/map/types";
import {
  fitToLine,
  ensureNoLayer,
  ensureNoSource,
  addOrSetSource,
} from "../core/map/utils";
import { LAYER_IDS } from "../config/map.constants";
import { renderStepPopup } from "../componenets/renderers/renderStepPopup";
import { StepPin } from "../componenets/markers/StepPin";
import { createRoot } from "react-dom/client";

/** Keep per-map step markers so we can clear them between calls */
const STEP_MARKERS = new WeakMap<Map, mapboxgl.Marker[]>();
export const STEP_SOURCE_ID = "steps-source";
export const STEP_LAYER_ID = "steps-layer";

function clearStepMarkers(map: Map) {
  const markers = STEP_MARKERS.get(map);
  if (markers) markers.forEach((m) => m.remove());
  STEP_MARKERS.set(map, []);
}

function pushMarker(map: Map, marker: mapboxgl.Marker) {
  const arr = STEP_MARKERS.get(map) ?? [];
  arr.push(marker);
  STEP_MARKERS.set(map, arr);
}

/** Remove all route artifacts (line, alt lines if any, step markers & layers) */
export function clearRoute(map: Map) {
  // main route
  ensureNoLayer(map, LAYER_IDS.routeLayer);
  ensureNoSource(map, LAYER_IDS.routeSource);

  // optional: remove any alt route layers/sources you may have added
  // (prefix match is handy if you add route-alt-1, route-alt-2, etc.)
  const style = map.getStyle();
  if (style?.layers) {
    for (const { id } of [...style.layers]) {
      if (id.startsWith("route-alt-")) ensureNoLayer(map, id);
    }
  }
  if (style?.sources) {
    for (const id of Object.keys(style.sources)) {
      if (id.startsWith("route-alt-")) ensureNoSource(map, id);
    }
  }

  // step symbol layer (if used)
  ensureNoLayer(map, STEP_LAYER_ID);
  ensureNoSource(map, STEP_SOURCE_ID);

  // HTML markers (React markers)
  clearStepMarkers(map);
}

export function addStepMarker(map: Map, step: StepDetail) {
  const el = document.createElement("div");
  createRoot(el).render(<StepPin modifier={step.maneuver?.modifier} />);

  const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
    .setLngLat(step.location as LngLatLike)
    .setPopup(
      new mapboxgl.Popup({ offset: 10 }).setDOMContent(
        renderStepPopup({
          instruction: step.instruction,
          distance: step.distance,
          duration: step.duration,
          name: step.name,
          maneuver: step.maneuver, // shows right/left etc inside the popup too
        }),
      ),
    )
    .addTo(map);

  pushMarker(map, marker);
}

export async function drawRoute(
  map: Map,
  origin: [number, number],
  to: [number, number],
): Promise<RouteDetails> {
  const profile = "mapbox/driving-traffic"; // use driving-traffic for congestion, else "mapbox/driving"
  const params = new URLSearchParams({
    steps: "true",
    alternatives: "true",
    geometries: "geojson",
    overview: "full",
    annotations: "distance,duration,speed,congestion,maxspeed",
    banner_instructions: "true",
    voice_instructions: "true",
    voice_units: "metric",
    language: "en",
    access_token: mapboxgl.accessToken!, // ensure this is set at app init
  });

  const url = `https://api.mapbox.com/directions/v5/${profile}/${origin[0]},${
    origin[1]
  };${to[0]},${to[1]}?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Directions request failed (${res.status}): ${text || "No body"}`,
    );
  }

  const data = await res.json();
  if (!data?.routes?.[0]) throw new Error("No route found");

  const route = data.routes[0];
  const line = route.geometry as GeoJSON.LineString;

  // Remove previous line + source and previous step markers
  ensureNoLayer(map, LAYER_IDS.routeLayer);
  ensureNoSource(map, LAYER_IDS.routeSource);
  clearStepMarkers(map);

  // Add/update route source + layer
  addOrSetSource(map, LAYER_IDS.routeSource, {
    type: "Feature",
    geometry: line,
    properties: {},
  });

  map.addLayer({
    id: LAYER_IDS.routeLayer,
    type: "line",
    source: LAYER_IDS.routeSource,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#3b82f6", "line-width": 4 },
  });

  // Fit to route line
  fitToLine(map, line, 40);

  // Parse leg details
  const leg = route.legs?.[0];
  const annotations = (leg?.annotation ?? undefined) as
    | RouteAnnotations
    | undefined;

  const steps: StepDetail[] = (leg?.steps ?? []).map((s: any) => ({
    instruction: s?.maneuver?.instruction ?? "",
    location: (s?.maneuver?.location ?? [0, 0]) as [number, number],
    distance: s?.distance ?? 0,
    duration: s?.duration ?? 0,
    name: s?.name,
    mode: s?.mode,
    geometry: s?.geometry as GeoJSON.LineString | undefined,
    banner: s?.bannerInstructions ?? null,
    maneuver: {
      type: s?.maneuver?.type,
      modifier: s?.maneuver?.modifier,
      bearing_before: s?.maneuver?.bearing_before,
      bearing_after: s?.maneuver?.bearing_after,
      exit: s?.maneuver?.exit,
    },
  }));

  // Drop markers (optional)
  steps.forEach((s) => addStepMarker(map, s));

  // Alternatives (optional)
  const alternatives: RouteAlternative[] | undefined =
    data.routes.length > 1
      ? data.routes.slice(1).map((r: any) => ({
          distance: r.distance,
          duration: r.duration,
          geometry: r.geometry as GeoJSON.LineString,
        }))
      : undefined;

  return {
    distance: route.distance,
    duration: route.duration,
    steps,
    annotations,
    alternatives,
  };
}
