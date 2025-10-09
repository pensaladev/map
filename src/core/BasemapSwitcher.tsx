import { useState } from "react";
import { MapManager } from "./MapManager";

// Keep this in sync with MapManager.ts
type BasemapId =
  | "mapbox-streets"
  | "mapbox-outdoors"
  | "mapbox-light"
  | "mapbox-dark"
  | "mapbox-satellite"
  | "mapbox-navigation-day"
  | "mapbox-navigation-night";

const OPTIONS: { id: BasemapId; label: string }[] = [
  { id: "mapbox-streets", label: "Streets" },
  { id: "mapbox-outdoors", label: "Outdoors" },
  { id: "mapbox-light", label: "Light" },
  { id: "mapbox-dark", label: "Dark" },
  { id: "mapbox-satellite", label: "Satellite" },
  { id: "mapbox-navigation-day", label: "Navigation Day" },
  { id: "mapbox-navigation-night", label: "Navigation Night" },
];

export function BasemapSwitcher() {
  const [active, setActive] = useState<BasemapId>("mapbox-streets");
  const mgr = MapManager.getInstance();

  const setBase = async (id: BasemapId) => {
    setActive(id);
    await mgr.setBasemap(id);
  };

  return (
    <div className="inline-flex rounded-xl bg-black/5 p-1">
      {OPTIONS.map((opt) => {
        const isActive = opt.id === active;
        return (
          <button
            key={opt.id}
            onClick={() => setBase(opt.id)}
            aria-pressed={isActive}
            className={[
              "px-3 py-1.5 rounded-lg text-sm transition",
              isActive
                ? "bg-white shadow ring-1 ring-black/5"
                : "text-gray-700 hover:bg-black/10",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
