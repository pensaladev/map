// src/core/MapManager.ts
import mapboxgl, { Map as MapboxMap } from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import { addZoneLayers } from "./layers/zones";
import { addDbCategoryPointsLayer } from "./layers/categoryPoints"; // ✅ generic DB-driven points
import {
  MAPBOX_ACCESS_TOKEN,
  INITIAL_CENTER,
  getInitialZoom,
} from "../utils/mapConfig";
import type { RouteDetails, RouteSummary } from "./map/types";
import { DUMMY_COORDS, USE_DUMMY_LOCATION } from "../config/map.constants";
import { clearRoute, drawRoute } from "../services/directions";

type BasemapId =
  | "mapbox-streets"
  | "mapbox-outdoors"
  | "mapbox-light"
  | "mapbox-dark"
  | "mapbox-satellite"
  | "mapbox-navigation-day"
  | "mapbox-navigation-night";

// Mapbox style URLs
const MAPBOX_STYLE_URLS: Record<BasemapId, string> = {
  "mapbox-streets": "mapbox://styles/mapbox/streets-v12",
  "mapbox-outdoors": "mapbox://styles/mapbox/outdoors-v12",
  "mapbox-light": "mapbox://styles/mapbox/light-v11",
  "mapbox-dark": "mapbox://styles/mapbox/dark-v11",
  "mapbox-satellite": "mapbox://styles/mapbox/satellite-streets-v12",
  "mapbox-navigation-day": "mapbox://styles/mapbox/navigation-day-v1",
  "mapbox-navigation-night": "mapbox://styles/mapbox/navigation-night-v1",
};
const DEFAULT_VISIBLE_CATS = new Set<string>(["competition"]);

const CATEGORY_PREFIX: Record<string, string> = {
  competition: "comp-",
  hotels: "hotel-",
  restaurants: "rest-",
  artworks: "artworks-",
  attraction: "attraction-",
  castle: "castle-",
  church: "church-",
  gallery: "gallery-",
  memorial: "memorial-",
  monument: "monument-",
  mosque: "mosque-",
  museum: "museum-",
  viewpoints: "viewpoints-",
  zoo: "zoo-",
  hospitals: "hosp-",
  transport: "trans-",
  police: "pol-",
  bank: "ban-",
  atm: "atm-",
  firestation: "fires-",
  embassy: "embassy-",
  consulate: "consulate-",
  airport: "airport-",
  bus: "bus-",
  ferry: "ferry-",
  railway: "railway-",
};

export class MapManager {
  private static instance: MapManager;
  private map: MapboxMap | null = null;
  private geocoder: MapboxGeocoder | null = null;
  private lastRouteDetails: RouteDetails | null = null;
  private lastRouteSummary: RouteSummary | null = null;
  private lastRouteEndpoints: {
    from: [number, number];
    to: [number, number];
  } | null = null;

  hasRoute() {
    return !!this.lastRouteEndpoints;
  }

  // 🔹 public: remove ONLY the route from the map (no camera reset)
  clearCurrentRoute() {
    if (!this.map) return;
    clearRoute(this.map); // remove route layers/sources/markers
    this.lastRouteDetails = null; // drop cached details
    this.lastRouteSummary = null;
    this.lastRouteEndpoints = null; // so it won't redraw on style change
  }

  private constructor() {
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
  }

  private readCategoryVisibility(): Record<string, boolean> {
    const map = this.map;
    const out: Record<string, boolean> = {};
    if (!map) return out;

    const layers = map.getStyle()?.layers ?? [];
    for (const [cat, prefix] of Object.entries(CATEGORY_PREFIX)) {
      const layer = layers.find(
        (l) => l.id?.startsWith(prefix) && l.id.includes("-clustered-"),
      );
      if (!layer) continue;
      const vis = map.getLayoutProperty(layer.id, "visibility");
      out[cat] = vis !== "none";
    }
    return out;
  }

  // apply an on/off map to all clustered layers for each category
  private applyCategoryVisibility(state: Record<string, boolean>) {
    const map = this.map;
    if (!map) return;

    const layers = map.getStyle()?.layers ?? [];
    for (const [cat, prefix] of Object.entries(CATEGORY_PREFIX)) {
      if (!(cat in state)) continue;
      const visible = state[cat];
      for (const l of layers) {
        const id = l.id;
        if (id?.startsWith(prefix) && id.includes("-clustered-")) {
          if (map.getLayer(id)) {
            map.setLayoutProperty(
              id,
              "visibility",
              visible ? "visible" : "none",
            );
          }
        }
      }
    }
  }

  static getInstance(): MapManager {
    if (!MapManager.instance) MapManager.instance = new MapManager();
    return MapManager.instance;
  }

  initMap(container: HTMLDivElement): MapboxMap {
    if (this.map) return this.map;

    this.map = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/streets-v11",
      center: INITIAL_CENTER,
      zoom: getInitialZoom(),
    });

    // 🔎 Geocoder
    this.geocoder = new MapboxGeocoder({
      accessToken: MAPBOX_ACCESS_TOKEN as string,
      mapboxgl: mapboxgl as unknown as typeof import("mapbox-gl"),
      marker: false,
      placeholder: "Search places",
      flyTo: { zoom: 14 },
      countries: "sn",
    });

    // Geocoder events
    this.geocoder.on(
      "result",
      async (e: { result: { center: [number, number] } }) => {
        const dest = e.result.center as [number, number];
        const origin = await this.getUserLocationSafe();
        await this.showRouteToVenue(origin, dest);
        document.querySelector(".mapboxgl-popup")?.remove();
      },
    );
    // this.geocoder.on("clear", () => this.map && clearRoute(this.map));
    this.geocoder.on("clear", () => this.clearCurrentRoute());

    this.map.once("load", async () => {
      await this.addAppLayers();
    });

    return this.map;
  }

  private async addAppLayers() {
    if (!this.map) return;

    await addZoneLayers(this.map);

    await Promise.all([
      addDbCategoryPointsLayer(this.map, "competition", "comp-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("competition"),
      }),
      addDbCategoryPointsLayer(this.map, "hotels", "hotel-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("hotels"),
      }),
      addDbCategoryPointsLayer(this.map, "restaurants", "rest-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("restaurants"),
      }),
      addDbCategoryPointsLayer(this.map, "artworks", "artworks-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("artworks"),
      }),
      addDbCategoryPointsLayer(this.map, "attraction", "attraction-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("attraction"),
      }),
      addDbCategoryPointsLayer(this.map, "castle", "castle-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("castle"),
      }),
      addDbCategoryPointsLayer(this.map, "church", "church-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("church"),
      }),
      addDbCategoryPointsLayer(this.map, "gallery", "gallery-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("gallery"),
      }),
      addDbCategoryPointsLayer(this.map, "memorial", "memorial-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("memorial"),
      }),
      addDbCategoryPointsLayer(this.map, "monument", "monument-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("monument"),
      }),
      addDbCategoryPointsLayer(this.map, "mosque", "mosque-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("mosque"),
      }),
      addDbCategoryPointsLayer(this.map, "museum", "museum-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("museum"),
      }),
      addDbCategoryPointsLayer(this.map, "viewpoints", "viewpoints-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("viewpoints"),
      }),
      addDbCategoryPointsLayer(this.map, "zoo", "zoo-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("zoo"),
      }),
      addDbCategoryPointsLayer(this.map, "hospitals", "hosp-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("hospitals"),
      }),
      addDbCategoryPointsLayer(this.map, "transport", "trans-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("transport"),
      }),
      addDbCategoryPointsLayer(this.map, "police", "pol-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("police"),
      }),
      addDbCategoryPointsLayer(this.map, "bank", "ban-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("bank"),
      }),
      addDbCategoryPointsLayer(this.map, "atm", "atm-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("atm"),
      }),
      addDbCategoryPointsLayer(this.map, "firestation", "fires-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("firestation"),
      }),
      addDbCategoryPointsLayer(this.map, "embassy", "embassy-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("embassy"),
      }),
      addDbCategoryPointsLayer(this.map, "consulate", "consulate-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("consulate"),
      }),
      addDbCategoryPointsLayer(this.map, "airport", "airport-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("airport"),
      }),
      addDbCategoryPointsLayer(this.map, "bus", "bus-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("bus"),
      }),
      addDbCategoryPointsLayer(this.map, "ferry", "ferry-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("ferry"),
      }),
      addDbCategoryPointsLayer(this.map, "railway", "railway-", {
        initiallyVisible: DEFAULT_VISIBLE_CATS.has("railway"),
      }),
    ]);

    // if you add label/overlay ordering, you can insert layers before a ref layer id here
  }

  async setBasemap(id: BasemapId) {
    if (!this.map) return;

    // 1) remember current view
    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    const bearing = this.map.getBearing();
    const pitch = this.map.getPitch();

    // 2) remember which categories are visible right now
    const prevVisibility = this.readCategoryVisibility();

    // 3) swap style
    const nextStyle = MAPBOX_STYLE_URLS[id];
    this.map.setStyle(nextStyle as any);

    // 4) after style & sources come back
    this.map.once("style.load", async () => {
      this.map!.jumpTo({ center, zoom, bearing, pitch });

      await this.addAppLayers(); // re-create your data layers

      // 5) re-apply the user’s on/off toggles
      this.applyCategoryVisibility(prevVisibility);

      // 6) redraw route if needed (your code)
      if (this.lastRouteEndpoints) {
        const { from, to } = this.lastRouteEndpoints;
        const details = await drawRoute(this.map!, from, to);
        this.lastRouteDetails = details;
        this.lastRouteSummary = {
          distance: details.distance,
          duration: details.duration,
        };
      }
    });
  }

  private async getUserLocationSafe(): Promise<[number, number]> {
    if (USE_DUMMY_LOCATION || !("geolocation" in navigator))
      return DUMMY_COORDS;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 30000,
        }),
      );
      return [pos.coords.longitude, pos.coords.latitude];
    } catch {
      return DUMMY_COORDS;
    }
  }

  async showRouteToVenue(from: [number, number] | null, to: [number, number]) {
    if (!this.map) return;
    const origin = from && !USE_DUMMY_LOCATION ? from : DUMMY_COORDS;
    const details = await drawRoute(this.map, origin, to);
    this.lastRouteDetails = details;
    this.lastRouteSummary = {
      distance: details.distance,
      duration: details.duration,
    };
    this.lastRouteEndpoints = { from: origin, to };
    return details;
  }

  getLastRouteDetails() {
    return this.lastRouteDetails;
  }
  getLastRouteSummary() {
    return this.lastRouteSummary;
  }
  getMap() {
    return this.map;
  }

  resetView() {
    if (!this.map) return;
    clearRoute(this.map);
    this.map.flyTo({ center: INITIAL_CENTER, zoom: getInitialZoom() });
  }

  destroyMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.geocoder = null;
    }
  }
}
