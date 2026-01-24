// src/components/map/EventVenueCard.tsx
import React, { useEffect, useId, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import type { VenueSport } from "../../data/sitesMeta";
import type { RouteDetails } from "../../core/map/types";

import { ManeuverIcon } from "../maneuverIcons";
import { useTranslation } from "react-i18next";

type Props = {
  title: string;
  info: string;
  infoFr?: string;
  imageUrl?: string; // defensive: may be absent
  address?: string;
  tags?: string[];
  brandTitle?: string;
  brandSubtitle?: string;
  locationLabel?: string;
  shortCode?: string;
  sportCount?: number;
  sports?: VenueSport[] | string; // defensive: could arrive stringified
  gradient?: [string, string]; // defensive: could be missing
  website?: string;
  socialHandle?: string;
  onClose: () => void;
  onGetDirections: () => void;
  onClear: () => void;
  route?: RouteDetails | null;
};

function normGradient(g?: [string, string]): [string, string] {
  if (Array.isArray(g) && g[0] && g[1]) return [String(g[0]), String(g[1])];
  return ["#12B76A", "#0A6B4A"]; // default like before
}
function normSports(s?: Props["sports"]): VenueSport[] {
  if (!s) return [];
  if (Array.isArray(s)) return s.filter(Boolean) as VenueSport[];
  if (typeof s === "string") {
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed)
        ? (parsed.filter(Boolean) as VenueSport[])
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

const EventVenueCard: React.FC<Props> = ({
  title,
  info,
  infoFr,
  imageUrl,
  address,
  tags,
  brandTitle,
  brandSubtitle,
  locationLabel,
  shortCode,
  sportCount,
  sports: sportsIn,
  gradient: gradientIn,
  website,
  socialHandle,
  onClose,
  onGetDirections,
  onClear,
  route,
}) => {
  const [g0, g1] = normGradient(gradientIn);
  const sports = normSports(sportsIn);
  const [expanded, setExpanded] = useState(false);
  const routePanelId = useId();
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || "en";
  const infoText = lang.startsWith("fr") ? (infoFr ?? "").trim() || info : info;
  const [infoExpanded, setInfoExpanded] = useState(false);

  useEffect(() => {
    console.log("[EventVenueCard] info props", {
      title,
      lang,
      info,
      infoFr,
      renderedInfo: infoText,
    });
  }, [title, lang, info, infoFr, infoText]);
  const hasSportCount = typeof sportCount === "number";
  const paddedSportCount = hasSportCount
    ? String(sportCount).padStart(2, "0")
    : "";
  const sportsCountLabel = hasSportCount
    ? t("layer.event.sportsLabel", {
        count: sportCount,
        padded: paddedSportCount,
      })
    : "";

  const visibleSteps = route
    ? expanded
      ? route.steps
      : route.steps.slice(0, 4)
    : [];

  const remaining = route
    ? Math.max(0, route.steps.length - visibleSteps.length)
    : 0;

  return (
    <div
      className="w-[82vw] max-w-[320px] sm:w-[450px] sm:max-w-none shadow-xl rounded-3xl border border-gray-300/80 bg-white overflow-hidden p-2 sm:p-3"
      style={{
        fontFamily: "Inter, sans-serif",
        background: `linear-gradient(135deg, ${g0}, ${g1})`,
      }}
    >
      {/* Header gradient with brand + location pill */}
      <div className="text-white">
        <div className="flex items-center justify-between">
          <div className="text-xs leading-tight ">
            {brandTitle && (
              <div className="font-semibold text-center">{brandTitle}</div>
            )}
            {brandSubtitle && (
              <div className="uppercase tracking-wide text-[8px]">
                {brandSubtitle}
              </div>
            )}
          </div>
          {locationLabel && (
            <span
              style={{ color: `${g1}` }}
              className="text-xs flex items-center justify-center bg-white/90 px-2 py-0.5 rounded-full font-medium"
            >
              <Icon icon="mdi:map-marker" className="mr-1" /> {locationLabel}
            </span>
          )}
        </div>

        <h3 className="mt-2 text-lg sm:text-2xl py-2 sm:py-3 font-extrabold uppercase text-center tracking-wide">
          {title}
        </h3>

        {(shortCode || sportsCountLabel) && (
          <div className="mt-1 text-[11px] tracking-widest text-white">
            {shortCode ?? ""} {shortCode && " ///// "} {sportsCountLabel}
          </div>
        )}
      </div>

      {/* Hero image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-36 sm:h-52 object-cover my-1 rounded-3xl border-6 border-white"
        />
      ) : null}

      {/* Sports strip */}
      {sports?.length ? (
        <div className="grid grid-cols-6 gap-1 pt-1 pb-2 rounded-2xl">
          {sports.map((s, i) => (
            <div
              key={i}
              className="border rounded-xl bg-white flex-col border-white pt-2 flex items-center"
            >
              {s.icon ? (
                <Icon icon={s.icon} className="w-6 h-6 text-black" />
              ) : (s as any).iconUrl ? (
                <img
                  src={(s as any).iconUrl}
                  alt={s.label}
                  className="w-6 h-6"
                />
              ) : (
                <div className="text-xs font-semibold  text-white"></div>
              )}
              <span className="text-[8px] uppercase text-center w-full text-black font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Body */}
      <div className=" text-gray-900">
        <p
          className="text-[11px] sm:text-xs leading-snug text-white"
          style={
            infoExpanded
              ? undefined
              : {
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }
          }
        >
          {infoText}
        </p>
        {infoText && (
          <button
            type="button"
            onClick={() => setInfoExpanded((v) => !v)}
            className="mt-1 text-[10px] sm:text-[11px] font-semibold text-white/90 hover:text-white underline underline-offset-2"
          >
            {infoExpanded ? "See less" : "See more"}
          </button>
        )}
        <p className="text-[12px] sm:text-sm mt-1 text-gray-300">{address}</p>

        {route && (
          <div className="mt-2 text-[11px] sm:text-xs text-gray-800 bg-white/85 rounded px-2 py-1 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <div>
                <strong>{t("layer.route.distanceLabel")}:</strong>{" "}
                {(route.distance / 1000).toFixed(2)}{" "}
                {t("layer.route.unit.kilometer")}
              </div>
              <div>
                <strong>{t("layer.route.timeLabel")}:</strong>{" "}
                {Math.round(route.duration / 60)} {t("layer.route.unit.minute")}
              </div>
            </div>

            <ul
              id={routePanelId}
              className="
                mt-1 space-y-1 overflow-y-auto
                max-h-24 sm:max-h-48      /* tighter mobile, roomy desktop */
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
                  <span className="text-[11.5px] sm:text-[12.5px] leading-snug">
                    {s.instruction}{" "}
                    <span className="text-gray-500">
                      ({(s.distance / 1000).toFixed(1)}{" "}
                      {t("layer.route.unit.kilometer")})
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Expand / collapse control */}
            {route.steps.length > 4 && (
              <button
                type="button"
                className="mt-1 underline underline-offset-2 hover:opacity-80 transition"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                aria-controls={routePanelId}
              >
                {expanded
                  ? t("layer.route.hideSteps")
                  : t("layer.route.showFullRoute", { count: remaining })}
              </button>
            )}
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <button
            onClick={onGetDirections}
            className="flex-1 bg-white rounded-3xl hover:bg-blue-100 font-semibold text-[12.5px] sm:text-sm px-3 py-1.5 transition duration-300"
            style={{ color: `${g1}` }}
          >
            {t("layer.actions.getDirections")}
          </button>
          {route && (
            <button
              onClick={onClear}
              className="flex-.5 rounded-3xl bg-white hover:bg-gray-100 font-semibold text-[12.5px] sm:text-sm px-3.5 w-fit py-1.5 transition"
              style={{ color: `${g1}` }}
            >
              {t("layer.actions.clearRoute")}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center"
            aria-label={t("layer.actions.close")}
          >
            <Icon
              icon="mdi:close"
              className="text-lg"
              style={{ color: `${g1}` }}
            />
          </button>
        </div>

        {/* Optional site tags */}
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

        {/* Footer links (optional) */}
        {(website || socialHandle) && (
          <div className="flex items-center text-white mt-1 justify-between text-[11px] font-extralight">
            {website && (
              <a
                className="underline"
                href={website}
                target="_blank"
                rel="noreferrer"
              >
                {website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {socialHandle && <span>{socialHandle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventVenueCard;
