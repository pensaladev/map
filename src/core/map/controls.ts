import mapboxgl, { Map } from "mapbox-gl";

export const addGeolocate = (map: Map) => {
  const geolocate = new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true,
  });
  map.addControl(geolocate, "bottom-right");
};
