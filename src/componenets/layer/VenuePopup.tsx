// src/components/map/VenuePopup.tsx (or wherever your VenuePopup lives)
import React, { useState } from "react";
import type { VenueSport } from "../../data/sitesMeta";
import EventVenueCard from "./EventVenueCard";
import DefaultVenueCard from "./DefaultVenueCard";
import CategoryVenueCard from "./CategoryVenueCard";
import { MapManager } from "../../core/MapManager";
import type { RouteDetails } from "../../core/map/types";
import { toast } from "sonner";
import { extractDirectionsMessage } from "../../utils/error";

export interface VenuePopupProps {
  title: string;
  zone: string;
  info: string;
  imageUrl?: string;
  address?: string;
  rating?: number;
  tags?: string[] | string;
  coordinates?: [number, number];
  onClose: () => void;

  // 🔽 NEW
  categoryId?: string;

  // existing “event/brand” bits
  brandTitle?: string;
  brandSubtitle?: string;
  locationLabel?: string;
  shortCode?: string;
  sportCount?: number;
  sports?: VenueSport[];
  gradient?: [string, string];
  website?: string;
  socialHandle?: string;
}

const CATEGORY_ICON: Record<string, { icon: string; color: string }> = {
  hotels: { icon: "mdi:hotel", color: "#2962FF" },
  restaurants: { icon: "mdi:silverware-fork-knife", color: "#00BFA5" },
  artworks: { icon: "mdi:art", color: "#8E24AA" },
  attraction: { icon: "mdi:local-attraction", color: "#8E24AA" },
  castle: { icon: "material-symbols:castle", color: "#8E24AA" },
  church: { icon: "material-symbols:church", color: "#8E24AA" },
  gallery: {
    icon: "material-symbols:gallery-thumbnail-outline-rounded",
    color: "#8E24AA",
  },
  memorial: {
    icon: "game-icons:martyr-memorial",
    color: "#8E24AA",
  },
  monument: {
    icon: "mingcute:monument-line",
    color: "#8E24AA",
  },
  mosque: {
    icon: "material-symbols:mosque",
    color: "#8E24AA",
  },
  museum: {
    icon: "material-symbols:museum",
    color: "#8E24AA",
  },
  viewpoints: {
    icon: "iconoir:binocular",
    color: "#8E24AA",
  },
  zoo: {
    icon: "guidance:zoo",
    color: "#8E24AA",
  },
  hospitals: { icon: "mdi:hospital-building", color: "#D32F2F" },
  transport: { icon: "mdi:bus", color: "#F9A825" },
  transportation: { icon: "mdi:bus", color: "#F9A825" },
  police: { icon: "mdi:shield-account", color: "#455A64" },
  bank: { icon: "ri:bank-fill", color: "#455A64" },
  atm: { icon: "map:atm", color: "#455A64" },
  firestation: { icon: "fluent-emoji-flat:fire-engine", color: "#455A64" },
  embassy: { icon: "maki:embassy", color: "#455A64" },
  consulate: { icon: "map:embassy", color: "#455A64" },
  airport: { icon: "picon:airport", color: "#455A64" },
  bus: { icon: "mdi:bus", color: "#455A64" },
  ferry: { icon: "mdi:ferry", color: "#455A64" },
  railway: { icon: "twemoji:mountain-railway", color: "#455A64" },
};

function norm(s?: string) {
  return (s || "").trim().toLowerCase();
}

function normTags(v?: string[] | string): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export const VenuePopup: React.FC<VenuePopupProps> = ({
  title,
  zone,
  info,
  imageUrl = "https://picsum.photos/300/200",
  address = "No address provided",
  rating = 4.5,
  tags = ["Event", "Outdoor"],
  coordinates,
  onClose,
  // 🔽 NEW
  categoryId,
  brandTitle,
  brandSubtitle,
  locationLabel,
  shortCode,
  sportCount,
  sports,
  gradient = ["#12B76A", "#0A6B4A"],
  website,
  socialHandle,
}) => {
  const [route, setRoute] = useState<{
    distance: number;
    duration: number;
    steps: {
      instruction: string;
      location: [number, number];
      distance: number;
      duration: number;
      name?: string;
      maneuver?: { type?: string; modifier?: string; exit?: number };
    }[];
  } | null>(null);

  const handleGetDirections = () => {
    // reset previous route
    setRoute(null);

    if (!coordinates) {
      toast.error("No destination coordinates available for this place.");
      return;
    }
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const origin: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        try {
          // 🧭 draw + get details immediately (MapManager now returns details)
          const details =
            (await MapManager.getInstance().showRouteToVenue(
              origin,
              coordinates,
            )) || null;
          if (details) {
            setRoute(details);
            return;
          }

          // fast fallback: small polling window (up to ~600ms)
          let tries = 0;
          const tick = () => {
            tries++;
            const d = MapManager.getInstance().getLastRouteDetails?.();
            if (d) {
              setRoute(d as RouteDetails);
              return;
            }
            if (tries < 6) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        } catch (e) {
          console.error("Directions failed:", e);
          const msg = extractDirectionsMessage(e);
          toast.error("Unable to retrieve directions", { description: msg });
        }
      },
      () => {
        toast.error("Unable to retrieve your location.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  };

  const handleClear = () => {
    MapManager.getInstance().clearCurrentRoute();
    setRoute(null);
  };

  // 🔑 Decide popup type using categoryId (not the zone name)
  const catKey = norm(categoryId);
  const catMeta = CATEGORY_ICON[catKey];

  const hasSports = Array.isArray(sports)
    ? sports.length > 0
    : Number(sportCount ?? 0) > 0;

  const isCompetition = catKey === "competition";
  const showEventCard = isCompetition && (hasSports || !!brandTitle);
  const tagsArr = normTags(tags);

  // Non-competition categories (hotels/restaurants/etc.) get the category card
  if (!showEventCard && catMeta && !isCompetition) {
    return (
      <CategoryVenueCard
        title={title}
        zone={zone}
        info={info}
        address={address}
        tags={tagsArr}
        icon={catMeta.icon}
        color={catMeta.color}
        onClose={onClose}
        onGetDirections={handleGetDirections}
        coordinates={coordinates}
        onClear={handleClear}
      />
    );
  }

  if (showEventCard) {
    return (
      <EventVenueCard
        title={title}
        info={info}
        imageUrl={imageUrl}
        address={address}
        tags={tagsArr}
        brandTitle={brandTitle}
        brandSubtitle={brandSubtitle}
        locationLabel={locationLabel}
        shortCode={shortCode}
        sportCount={sportCount}
        sports={Array.isArray(sports) ? sports : []}
        gradient={[gradient?.[0] ?? "#12B76A", gradient?.[1] ?? "#0A6B4A"]}
        website={website}
        socialHandle={socialHandle}
        onClose={onClose}
        onGetDirections={handleGetDirections}
        onClear={handleClear}
        route={route}
      />
    );
  }

  // Fallback
  return (
    <DefaultVenueCard
      title={title}
      zone={zone}
      info={info}
      imageUrl={imageUrl}
      address={address}
      rating={rating}
      tags={tagsArr}
      route={route}
      onGetDirections={handleGetDirections}
      onClose={onClose}
      onClear={handleClear}
    />
  );
};
