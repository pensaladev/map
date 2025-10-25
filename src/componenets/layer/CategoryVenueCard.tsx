// src/componenets/popup/CategoryVenueCard.tsx
import React, { useId, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import type { RouteDetails } from "../../core/map/types";
import { MapManager } from "../../core/MapManager";
import { ManeuverIcon } from "../maneuverIcons";
import { useTranslation } from "react-i18next";

type Props = {
  title: string;
  zone: string; // e.g., "Hotels", "Restaurants"
  info?: string;
  address?: string;
  tags?: string[];
  icon: string; // iconify name e.g. "mdi:hotel"
  color?: string; // accent color for header gradient
  onClose: () => void;
  onClear: () => void;
  onGetDirections: () => void;
  coordinates?: [number, number];
  rating?: number;
  phone?: string;
  website?: string;
  openingHours?: string; // e.g. "Mon–Sun 9:00–18:00"
  priceLevel?: string; // e.g. "$$", "€€", etc.
  imageUrl?: string; // small header/hero (optional)
};

const CategoryVenueCard: React.FC<Props> = ({
  title,
  zone,
  info = "",
  address = "",
  tags,
  icon,
  color = "#0ea5e9",
  onClose,
  onGetDirections,
  coordinates,
  rating,
  phone,
  website,
  openingHours,
  priceLevel,
  imageUrl,
  onClear,
}) => {
  const [route, setRoute] = useState<RouteDetails | null>(null);
  const [expanded, setExpanded] = useState(false);
  const routePanelId = useId();
  const { t } = useTranslation();

  const visibleSteps = route
    ? expanded
      ? route.steps
      : route.steps.slice(0, 4)
    : [];
  const remaining = route
    ? Math.max(0, route.steps.length - visibleSteps.length)
    : 0;

  async function handleGetDirections() {
    // If we have a destination, do the full flow here (geolocate -> draw -> read summary)
    if (coordinates && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const origin: [number, number] = [
              pos.coords.longitude,
              pos.coords.latitude,
            ];
            await MapManager.getInstance().showRouteToVenue(
              origin,
              coordinates,
            );
            const details = MapManager.getInstance().getLastRouteDetails?.();
            if (details) setRoute(details as RouteDetails);
          } catch {
            // fallback to parent if something goes wrong
            onGetDirections?.();
            setTimeout(() => {
              const d = MapManager.getInstance().getLastRouteDetails?.();
              if (d) setRoute(d as RouteDetails);
            }, 300);
          }
        },
        // geolocation error -> fallback to parent
        () => {
          onGetDirections?.();
          setTimeout(() => {
            const d = MapManager.getInstance().getLastRouteDetails?.();
            if (d) setRoute(d as RouteDetails);
          }, 300);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
      );
      return;
    }

    // No coordinates provided (or no geolocation): use parent behavior + timed read
    onGetDirections?.();
    setTimeout(() => {
      const details = MapManager.getInstance().getLastRouteDetails?.();
      if (details) setRoute(details as RouteDetails);
    }, 300);
  }

  return (
    <div className="w-[92vw] sm:w-[340px] shadow-xl border border-gray-300/80 bg-white overflow-hidden rounded-md">
      {/* Optional hero image */}
      {imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-32 object-cover"
          />
          <button
            onClick={onClose}
            className="absolute right-2 top-2 w-8 h-8 bg-black/30 hover:bg-black/40 rounded-full grid place-items-center transition"
            aria-label={t("layer.actions.close")}
          >
            <Icon icon="mdi:close" className="text-white text-xl" />
          </button>
        </div>
      ) : null}

      {/* Header: icon + zone tag */}
      <div
        className="px-3 py-3 text-white flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${color}, #111827)` }}
      >
        <div className="flex items-center gap-3">
          <span className="grid place-items-center rounded-lg bg-white/15 p-2">
            <Icon icon={icon} className="w-6 h-6 text-white" />
          </span>
          <div className="leading-tight">
            <div className="text-[10px] uppercase opacity-90 tracking-wide">
              {zone === "Unassigned" ? "" : zone}
            </div>
            <div className="text-lg font-semibold">{title}</div>
          </div>
        </div>

        {!imageUrl && (
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/15 hover:bg-white/25 rounded-full grid place-items-center transition"
            aria-label={t("layer.actions.close")}
          >
            <Icon icon="mdi:close" className="text-white text-xl" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-3 text-sm text-gray-800">
        {info && <p className="mb-1">{info}</p>}
        {address && <p className="text-xs text-gray-500">{address}</p>}

        {/* Extra place facts */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {typeof rating === "number" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
              <Icon icon="mdi:star" className="w-3.5 h-3.5" />
              {rating.toFixed(1)}
            </span>
          )}
          {priceLevel && (
            <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5">
              {priceLevel}
            </span>
          )}
          {openingHours && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">
              {openingHours}
            </span>
          )}
          {phone && (
            <a
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 hover:underline"
            >
              <Icon icon="mdi:phone" className="w-3.5 h-3.5" />
              {phone}
            </a>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-800 px-2 py-0.5 hover:underline"
            >
              <Icon icon="mdi:link-variant" className="w-3.5 h-3.5" />
              {website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>

        {/* Route summary (scrollable + expandable) */}
        {route && (
          <div className="mt-2 text-xs text-gray-800 bg-white/85 rounded px-2 py-1 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <div>
                <strong>{t("layer.route.distanceLabel")}:</strong>{" "}
                {(route.distance / 1000).toFixed(2)}{" "}
                {t("layer.route.unit.kilometer")}
              </div>
              <div>
                <strong>{t("layer.route.timeLabel")}:</strong>{" "}
                {Math.round(route.duration / 60)}{" "}
                {t("layer.route.unit.minute")}
              </div>
            </div>

            <ul
              id={routePanelId}
              className="
                mt-1 space-y-1 overflow-y-auto
                max-h-40 sm:max-h-56
                pr-1
              "
            >
              {visibleSteps.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-[2px] inline-grid place-items-center w-5 h-5 rounded-full bg-emerald-500/15 shrink-0">
                    <ManeuverIcon
                      type={s.maneuver?.type}
                      modifier={s.maneuver?.modifier}
                      exit={s.maneuver?.exit}
                      className="w-3.5 h-3.5 text-emerald-700"
                    />
                  </span>
                  <span className="text-[12.5px] leading-snug">
                    {s.instruction}{" "}
                    <span className="text-gray-500">
                      ({(s.distance / 1000).toFixed(1)}{" "}
                      {t("layer.route.unit.kilometer")})
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            {route.steps.length > 4 && (
              <button
                type="button"
                className="mt-1 underline underline-offset-2 hover:opacity-80 transition"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                aria-controls={routePanelId}
              >
                {expanded
                  ? t("layer.route.showLess")
                  : t("layer.route.showFullRoute", { count: remaining })}
              </button>
            )}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={handleGetDirections}
            className="flex-1 bg-black text-white rounded-3xl hover:opacity-90 font-semibold text-sm px-3 py-1.5 transition"
          >
            {t("layer.actions.getDirections")}
          </button>
          {route && (
            <button
              onClick={onClear}
              className="flex-.5 rounded-3xl bg-white hover:bg-gray-100 font-semibold text-sm px-4 w-fit py-1.5 transition"
            >
              {t("layer.actions.clearRoute")}
            </button>
          )}
        </div>

        {!!tags?.length && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] bg-gray-200/70 px-2 py-0.5 rounded-full text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryVenueCard;
