export const INITIAL_CENTER: [number, number] = [-17.194, 14.583];
export const INITIAL_ZOOM = 10.12;
export const MOBILE_INITIAL_ZOOM = 8.2;

export const getInitialZoom = (): number => {
  if (typeof window === "undefined") return INITIAL_ZOOM;
  const isMobile = window.matchMedia("(max-width: 640px)").matches;
  return isMobile ? MOBILE_INITIAL_ZOOM : INITIAL_ZOOM;
};

export const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiZnJhbmNpc2VoZW1iYTIwMjIiLCJhIjoiY2w0eDV3eWI3MDJ5MTNibnRjcGZvY3RreiJ9.bsWdoYU3jS88zOXzBy1MPQ";
