import { Icon } from "@iconify/react";
import { MapManager } from "./MapManager";
import { cn } from "../utils/utils";

export function ZoomPill({ className = "" }: { className?: string }) {
  const mgr = MapManager.getInstance();

  const handleZoomIn = () => mgr.getMap()?.zoomIn({ duration: 200 });
  const handleZoomOut = () => mgr.getMap()?.zoomOut({ duration: 200 });

  return (
    <div
      aria-label="Map zoom controls"
      aria-orientation="vertical"
      className={cn(
        "inline-flex flex-col items-center justify-center bg-white/90 backdrop-blur-md shadow-md shadow-black/10 rounded-full overflow-hidden",
        className,
      )}
    >
      <button
        type="button"
        onClick={handleZoomIn}
        title="Zoom In"
        className="grid place-items-center h-11 w-11 md:h-12 md:w-12 hover:bg-black/5 focus-visible:outline focus-visible:outline-blue-500/40"
        aria-label="Zoom In"
      >
        <Icon icon="mdi:plus" className="block h-5 w-5 md:h-6 md:w-6" />
      </button>

      {/* divider */}
      <div className="h-px w-7 md:w-8 bg-black/10" />

      <button
        type="button"
        onClick={handleZoomOut}
        title="Zoom Out"
        className="grid place-items-center h-11 w-11 md:h-12 md:w-12 hover:bg-black/5 focus-visible:outline focus-visible:outline-blue-500/40"
        aria-label="Zoom Out"
      >
        <Icon icon="mdi:minus" className="block h-5 w-5 md:h-6 md:w-6" />
      </button>
    </div>
  );
}
