// src/admin/places/PlacePreview.tsx

import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import type { VenueSport } from "../../../data/sitesMeta";

type Props = {
  // visuals
  gradientFrom: string;
  gradientTo: string;
  preview: string | null;

  // branding
  brandTitle: string;
  brandSubtitle: string;
  locationLabel: string;
  shortCode: string;

  // content
  name: string;
  nameFr?: string;
  info: string;
  infoFr?: string;
  address: string;

  // meta
  categoryId: string;
  sports: VenueSport[];

  // links/tags
  tagList: string[];
  website: string;
  socialHandle: string;

  // optional actions for parity with EventVenueCard (noop in preview)
  onClose?: () => void;
  onGetDirections?: () => void;
};

// ---- helpers to match EventVenueCard behavior ----
function normGradient(g0?: string, g1?: string): [string, string] {
  const a = typeof g0 === "string" && g0.length ? g0 : "#12B76A";
  const b = typeof g1 === "string" && g1.length ? g1 : "#0A6B4A";
  return [a, b];
}

export default function PlacePreview({
  gradientFrom,
  gradientTo,
  preview,
  brandTitle,
  brandSubtitle,
  locationLabel,
  shortCode,
  name,
  nameFr,
  info,
  infoFr,
  address,
  categoryId,
  sports,
  tagList,
  website,
  socialHandle,
  onClose,
  onGetDirections,
}: Props) {
  const { i18n } = useTranslation();
  const activeLang = i18n.resolvedLanguage || i18n.language || "en";
  const infoText = activeLang.startsWith("fr")
    ? (infoFr ?? "").trim() || info
    : info;
  const nameText = activeLang.startsWith("fr")
    ? (nameFr ?? "").trim() || name
    : name;
  const [g0, g1] = normGradient(gradientFrom, gradientTo);
  const sportCount =
    categoryId === "competition"
      ? Array.isArray(sports)
        ? sports.length
        : 0
      : 0;

  return (
    <div
      className="w-full shadow-xl border border-gray-300/80 bg-white overflow-hidden p-3"
      style={{
        fontFamily: "Inter, sans-serif",
        background: `linear-gradient(135deg, ${g0}, ${g1})`,
      }}
    >
      {/* Header gradient with brand + location pill */}
      <div className="text-white">
        <div className="flex items-center justify-between">
          <div className="text-xs leading-tight ">
            {brandTitle && <div className="font-semibold">{brandTitle}</div>}
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

        <h3 className="mt-2 text-2xl py-3 font-extrabold uppercase text-center tracking-wide">
          {nameText || "EGG TOWER COMPLEX"}
        </h3>

        {(shortCode || sportCount) && (
          <div className="mt-1 text-[11px] px-2 text-black tracking-widest bg-white">
            {shortCode ?? ""} {shortCode && " ///// "}{" "}
            {sportCount ? `${String(sportCount).padStart(2, "0")} Sports` : ""}
          </div>
        )}
      </div>

      {/* Hero image */}
      <img
        src={preview ?? "/v-img/default.jpg"}
        alt={nameText || "cover"}
        className="w-full h-44 object-cover border-6 border-white"
      />

      {/* Sports strip */}
      {categoryId === "competition" && sports?.length ? (
        <div className="grid grid-cols-6 gap-1 px-2 pt-1 pb-2 bg-white">
          {sports.map((s, i) => (
            <div
              key={i}
              className="border flex-col border-black pt-2 flex items-center"
              title={s.label}
            >
              {"icon" in s && s.icon ? (
                <Icon icon={s.icon as string} className="w-6 h-6 text-black" />
              ) : (s as any).iconUrl ? (
                <img
                  src={(s as any).iconUrl}
                  alt={s.label}
                  className="w-6 h-6"
                />
              ) : (
                <div className="text-xs font-semibold" />
              )}
              <span className="text-[8px] uppercase text-center w-full bg-black text-white font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Body */}
      <div className=" text-gray-900">
        <p className="text-sm leading-snug mt-2 text-white">{infoText}</p>
        <p className="text-xs text-gray-300">{address}</p>

        <div className="mt-3 flex gap-2">
          <button
            onClick={onGetDirections || (() => {})}
            className="flex-1 bg-white rounded-lg hover:bg-blue-100 font-semibold text-sm px-3 py-1.5 transition duration-300"
            style={{ color: `${g1}` }}
            title="Preview"
          >
            Get Directions
          </button>
          <button
            onClick={onClose || (() => {})}
            className="w-8 h-8 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center"
            aria-label="Close"
            title="Preview"
          >
            <Icon
              icon="mdi:close"
              className="text-lg"
              style={{ color: `${g1}` }}
            />
          </button>
        </div>

        {/* Optional site tags */}
        {!!tagList?.length && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tagList.map((tag, idx) => (
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
}
