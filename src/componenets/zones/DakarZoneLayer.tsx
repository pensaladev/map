import { useEffect } from "react";
// import mapboxgl from "mapbox-gl";

export function DakarZoneLayer({ map }: { map: mapboxgl.Map }) {
  useEffect(() => {
    const loadGeoJson = async () => {
      const response = await fetch("/data/dakar_zone_comp.json");
      const geojson = await response.json();

      if (map.getSource("dakar-zone")) return;

      map.addSource("dakar-zone", {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: "dakar-zone-fill",
        type: "fill",
        source: "dakar-zone",
        paint: {
          "fill-color": "#3498db",
          "fill-opacity": 0.3,
        },
      });

      map.addLayer({
        id: "dakar-zone-outline",
        type: "line",
        source: "dakar-zone",
        paint: {
          "line-color": "#2c3e50",
          "line-width": 2,
        },
      });
    };

    map.on("load", loadGeoJson);
    return () => {
      if (map.getLayer("dakar-zone-fill")) map.removeLayer("dakar-zone-fill");
      if (map.getLayer("dakar-zone-outline"))
        map.removeLayer("dakar-zone-outline");
      if (map.getSource("dakar-zone")) map.removeSource("dakar-zone");
    };
  }, [map]);

  return null;
}
