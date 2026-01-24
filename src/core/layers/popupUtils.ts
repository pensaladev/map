import type mapboxgl from "mapbox-gl";

export function keepPopupInView(
  map: mapboxgl.Map,
  popup: mapboxgl.Popup,
  padding = 12,
) {
  requestAnimationFrame(() => {
    const el = popup.getElement();
    if (!el) return;
    const mapRect = map.getContainer().getBoundingClientRect();
    const rect = el.getBoundingClientRect();

    let dx = 0;
    let dy = 0;

    if (rect.left < mapRect.left + padding) {
      dx = rect.left - (mapRect.left + padding);
    } else if (rect.right > mapRect.right - padding) {
      dx = rect.right - (mapRect.right - padding);
    }

    if (rect.top < mapRect.top + padding) {
      dy = rect.top - (mapRect.top + padding);
    } else if (rect.bottom > mapRect.bottom - padding) {
      dy = rect.bottom - (mapRect.bottom - padding);
    }

    if (dx || dy) {
      map.panBy([dx, dy], { duration: 250 });
    }
  });
}
