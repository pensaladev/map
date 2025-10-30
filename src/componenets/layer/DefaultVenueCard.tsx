import React from "react";
import { ManeuverIcon } from "../maneuverIcons";
import { useTranslation } from "react-i18next";

type RouteStep = {
  instruction: string;
  location: [number, number];
  distance: number;
  duration: number;
  name?: string;
  maneuver?: { type?: string; modifier?: string; exit?: number };
};

export type RouteSummary = {
  distance: number;
  duration: number;
  steps: RouteStep[];
} | null;

type Props = {
  title: string;
  zone: string;
  info: string;
  infoFr?: string;
  imageUrl: string;
  address: string;
  rating: number;
  tags: string[];
  route: RouteSummary;
  onGetDirections: () => void;
  onClose: () => void;
  onClear: () => void;
};

const DefaultVenueCard: React.FC<Props> = ({
  title,
  zone,
  info,
  infoFr,
  imageUrl,
  address,
  rating,
  tags,
  route,
  onGetDirections,
  onClose,
  onClear,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || "en";
  const infoText = lang.startsWith("fr")
    ? (infoFr ?? "").trim() || info
    : info;

  return (
    <div
      className="w-[350px] rounded-2xl shadow-xl border border-gray-300/80 backdrop-blur-lg bg-white/80"
      style={{
        fontFamily: "Inter, sans-serif",
        border: "1px solid rgba(200, 200, 200, 0.5)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div className="relative">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-36 object-cover rounded-t-2xl"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <h3 className="text-white text-lg font-semibold leading-tight">
            {title}
          </h3>
        </div>
      </div>

      <div className="p-4 text-gray-900">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            <strong>{t("layer.default.zoneLabel")}:</strong> {zone}
          </span>
          <span className="text-sm bg-yellow-400 text-black px-2 py-0.5 rounded-full">
            ⭐ {rating.toFixed(1)}
          </span>
        </div>

        <p className="text-sm text-gray-800 leading-snug mb-2">{infoText}</p>
        <p className="text-xs text-gray-600 mb-2">
          <strong>{t("layer.default.addressLabel")}:</strong> {address}
        </p>

        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-xs bg-gray-200/70 px-2 py-0.5 rounded-full text-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Route summary (conditionally rendered) */}
        {route && (
          <div className="mb-2 text-xs text-gray-700 bg-gray-100 rounded px-2 py-1">
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

            <ul className="mt-1 space-y-1">
              {route.steps.slice(0, 4).map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-[2px] inline-grid place-items-center w-5 h-5 rounded-full bg-emerald-500/15">
                    <ManeuverIcon
                      type={s.maneuver?.type}
                      modifier={s.maneuver?.modifier}
                      exit={s.maneuver?.exit}
                      className="w-3.5 h-3.5 text-emerald-700"
                    />
                  </span>
                  <span className="text-[13px] leading-snug">
                    {s.instruction}{" "}
                    <span className="text-gray-500">
                      ({(s.distance / 1000).toFixed(1)}{" "}
                      {t("layer.route.unit.kilometer")})
                    </span>
                  </span>
                </li>
              ))}
              {route.steps.length > 4 && (
                <li className="text-[13px] text-gray-500 italic">
                  {t("layer.route.remainingSteps", {
                    count: route.steps.length - 4,
                  })}
                </li>
              )}
            </ul>
          </div>
        )}

        <button
          onClick={onGetDirections}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-3xl transition"
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
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full w-7 h-7 flex items-center justify-center shadow"
          aria-label={t("layer.actions.close")}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default DefaultVenueCard;
