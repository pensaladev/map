// src/core/BasemapSwitcherModal.tsx
import { useState } from "react";
import { Icon } from "@iconify/react";
import { MapManager } from "./MapManager";
import { Modal } from "../componenets/common/Modal";
import { useTranslation } from "react-i18next";

type BasemapId =
  | "mapbox-streets"
  | "mapbox-outdoors"
  | "mapbox-light"
  | "mapbox-dark"
  | "mapbox-satellite"
  | "mapbox-navigation-day"
  | "mapbox-navigation-night";

const OPTIONS: {
  id: BasemapId;
  icon: string;
  labelKey: string;
  descKey: string;
  // 👇 human fallback shown if i18n key missing
  labelFallback: string;
  descFallback: string;
}[] = [
  {
    id: "mapbox-streets",
    icon: "mdi:map-outline",
    labelKey: "basemap.option.mapbox_streets.label",
    descKey: "basemap.option.mapbox_streets.desc",
    labelFallback: "Mapbox Streets",
    descFallback: "Default road map with labels.",
  },
  {
    id: "mapbox-outdoors",
    icon: "mdi:terrain",
    labelKey: "basemap.option.mapbox_outdoors.label",
    descKey: "basemap.option.mapbox_outdoors.desc",
    labelFallback: "Outdoors (Mapbox)",
    descFallback: "Terrain-focused map with trails and contours.",
  },
  {
    id: "mapbox-light",
    icon: "mdi:white-balance-sunny",
    labelKey: "basemap.option.mapbox_light.label",
    descKey: "basemap.option.mapbox_light.desc",
    labelFallback: "Light (Mapbox)",
    descFallback: "Clean, light basemap for data overlays.",
  },
  {
    id: "mapbox-dark",
    icon: "mdi:weather-night",
    labelKey: "basemap.option.mapbox_dark.label",
    descKey: "basemap.option.mapbox_dark.desc",
    labelFallback: "Dark (Mapbox)",
    descFallback: "Dark basemap that makes markers pop.",
  },
  {
    id: "mapbox-satellite",
    icon: "mdi:satellite-variant",
    labelKey: "basemap.option.mapbox_satellite.label",
    descKey: "basemap.option.mapbox_satellite.desc",
    labelFallback: "Satellite (Mapbox)",
    descFallback: "Satellite imagery with road overlay.",
  },
  {
    id: "mapbox-navigation-day",
    icon: "mdi:car",
    labelKey: "basemap.option.mapbox_nav_day.label",
    descKey: "basemap.option.mapbox_nav_day.desc",
    labelFallback: "Navigation Day (Mapbox)",
    descFallback: "High-contrast day style optimized for driving.",
  },
  {
    id: "mapbox-navigation-night",
    icon: "mdi:car-shift-pattern",
    labelKey: "basemap.option.mapbox_nav_night.label",
    descKey: "basemap.option.mapbox_nav_night.desc",
    labelFallback: "Navigation Night (Mapbox)",
    descFallback: "Night style designed for in-car use.",
  },
];

export function BasemapSwitcherModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [active, setActive] = useState<BasemapId>("mapbox-streets");
  const mgr = MapManager.getInstance();

  // Helper: translate with a guaranteed fallback
  const tr = (key: string, fallback: string) => {
    const out = t(key, { defaultValue: fallback });
    return out === key ? fallback : out;
  };

  const apply = async (id: BasemapId) => {
    setActive(id);
    await mgr.setBasemap(id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tr("basemap.modal.title", "Map Layers")}
      size="md"
      contentClassName="px-0 py-0"
    >
      <ul className="p-2">
        {OPTIONS.map((opt) => {
          const selected = opt.id === active;
          return (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => apply(opt.id)}
                className={[
                  "w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3",
                  selected
                    ? "bg-white shadow ring-1 ring-black/5"
                    : "hover:bg-black/5",
                ].join(" ")}
                aria-pressed={selected}
              >
                <span className="grid place-items-center rounded-lg bg-black/5 w-9 h-9">
                  <Icon icon={opt.icon} className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {tr(opt.labelKey, opt.labelFallback)}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {tr(opt.descKey, opt.descFallback)}
                  </div>
                </div>
                {selected && (
                  <Icon
                    icon="mdi:check-circle"
                    className="w-5 h-5 text-blue-600"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="px-4 pb-4 text-xs text-gray-500">
        {tr(
          "basemap.tip",
          "Tip: you can change the basemap at any time. Your custom layers will reload automatically.",
        )}
      </div>
    </Modal>
  );
}
