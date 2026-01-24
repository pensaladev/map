// import type mapboxgl from "mapbox-gl";

export function keepPopupInView(
  map: mapboxgl.Map,
  popup: mapboxgl.Popup,
  padding = 12,
) {
  const run = () => {
    const el = popup.getElement();
    if (!el) return;
    const mapRect = map.getContainer().getBoundingClientRect();
    const rect = el.getBoundingClientRect();

    const padX = padding;
    const padTop = padding;
    const padBottom = Math.max(padding, 28); // extra space for bottom edges

    let dx = 0;
    let dy = 0;

    if (rect.left < mapRect.left + padX) {
      dx = rect.left - (mapRect.left + padX);
    } else if (rect.right > mapRect.right - padX) {
      dx = rect.right - (mapRect.right - padX);
    }

    if (rect.top < mapRect.top + padTop) {
      dy = rect.top - (mapRect.top + padTop);
    } else if (rect.bottom > mapRect.bottom - padBottom) {
      dy = rect.bottom - (mapRect.bottom - padBottom);
    }

    if (dx || dy) map.panBy([dx, dy], { duration: 250 });
  };

  // Multiple passes to account for layout + image/font settling.
  const tick = (count: number) => {
    run();
    if (count > 0) requestAnimationFrame(() => tick(count - 1));
  };
  requestAnimationFrame(() => tick(6));
  setTimeout(run, 50);
  setTimeout(run, 150);

  const el = popup.getElement();
  if (el && typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => run());
    ro.observe(el);
    setTimeout(() => ro.disconnect(), 600);
  }
}
