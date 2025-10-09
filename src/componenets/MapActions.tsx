import { Icon } from "@iconify/react";
import { MapManager } from "../core/MapManager";

export function MapActions() {
  const mapManager = MapManager.getInstance();

  const handleZoomIn = () => mapManager.getMap()?.zoomIn();
  const handleZoomOut = () => mapManager.getMap()?.zoomOut();

  return (
    <div className="flex gap-2">
      <button
        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
        onClick={handleZoomIn}
        title="Zoom In"
      >
        <Icon icon="mdi:plus" className="text-lg" />
      </button>
      <button
        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
        onClick={handleZoomOut}
        title="Zoom Out"
      >
        <Icon icon="mdi:minus" className="text-lg" />
      </button>
    </div>
  );
}
