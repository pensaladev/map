import mapboxgl, { Map } from "mapbox-gl";

export const addOrSetSource = (map: Map, id: string, data: GeoJSON.GeoJSON) => {
  const existing = map.getSource(id) as mapboxgl.GeoJSONSource | undefined;
  if (existing) {
    existing.setData(data);
  } else {
    map.addSource(id, { type: "geojson", data });
  }
};

export const ensureNoLayer = (map: Map, id: string) => {
  if (map.getLayer(id)) map.removeLayer(id);
};

export const ensureNoSource = (map: Map, id: string) => {
  if (map.getSource(id)) map.removeSource(id);
};

export const fitToLine = (map: Map, line: GeoJSON.LineString, padding = 40) => {
  const coords = line.coordinates as [number, number][];
  if (!coords?.length) return;
  const bounds = coords.reduce(
    (b, c) => b.extend(c),
    new mapboxgl.LngLatBounds(coords[0], coords[0]),
  );
  map.fitBounds(bounds, { padding });
};
