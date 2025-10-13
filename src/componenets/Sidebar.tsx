// src/componenets/Sidebar.tsx
import { useState } from "react";
import { AnimatedButton } from "./buttons/AnimatedButton";
import { PlacesList } from "./place-list/PlacesList";
import { SearchPlacesModal } from "./search/SearchPlacesModal";
import { BasemapSwitcherModal } from "../core/BasemapSwitcherModal";
import { ZoomPill } from "../core/ZoomPill";
import { LocateMeButton } from "../core/LocateMeButton";
import { toast } from "sonner";
import { CATEGORIES } from "./place-list/place-list-utils";

type SidebarProps = {
  longitude: number;
  latitude: number;
  zoom: number;
  onReset: () => void;
  onClearRoute: () => void;
};

export function Sidebar({
  onReset,
  longitude,
  latitude,
  zoom,
  onClearRoute,
}: SidebarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);

  const handleShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("lng", longitude.toFixed(6));
      url.searchParams.set("lat", latitude.toFixed(6));
      url.searchParams.set("z", zoom.toFixed(2));

      const shareData: ShareData = {
        title: document.title || "Map",
        text: "Check out this map view",
        url: url.toString(),
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard?.writeText(shareData.url || url.toString());
        toast.success("Link copied to clipboard");
      }
    } catch (err) {
      console.error("Share failed:", err);
      try {
        await navigator.clipboard?.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      } catch {
        prompt("Copy this link:", window.location.href);
      }
    }
  };

  return (
    // Position: right side; centered on desktop, bottom-right on mobile
    <div
      className="
      pointer-events-none
      absolute right-3 top-1/2 -translate-y-1/2
      md:right-4 md:top-1/2 md:-translate-y-1/2
      sm:bottom-3 sm:top-auto sm:-translate-y-0
      z-50
    "
    >
      {/* Glass Dock */}
      <div
        className="
        pointer-events-auto
        flex flex-col items-center gap-2
        p-2 md:p-2.5
        rounded-2xl
        backdrop-blur-xl
        bg-white/55
        shadow-[0_8px_30px_rgba(0,0,0,0.12)]
        ring-1 ring-black/5
      "
      >
        {/* Top group */}
        <AnimatedButton
          icon="f7:search-circle"
          title="Search Places"
          tooltip="Search"
          onClick={() => setSearchOpen(true)}
        />
        <AnimatedButton
          icon="mdi:layers-triple-outline"
          title="Map Layers"
          tooltip="Layers"
          onClick={() => setLayersOpen(true)}
        />
        {/* thin divider */}
        <div className="h-px w-9 bg-gradient-to-r from-transparent via-black/10 to-transparent my-1" />
        {/* Utility group */}
        <LocateMeButton className="!bg-white/90" />
        <PlacesList /> {/* keeps its own popover; button fits the dock */}
        {/* Zoom */}
        <ZoomPill className="rounded-2xl ring-1 ring-black/5" />
        {/* thin divider */}
        <div className="h-px w-9 bg-gradient-to-r from-transparent via-black/10 to-transparent my-1" />
        {/* Bottom group */}
        <AnimatedButton
          icon="mdi:home-circle-outline"
          title="Reset View"
          tooltip="Reset View"
          onClick={onReset}
        />
        <AnimatedButton
          icon="material-symbols-light:conversion-path-off-rounded"
          title="Reset View"
          tooltip="Reset View"
          onClick={onClearRoute}
        />
        <AnimatedButton
          icon="mdi:share-variant"
          title="Share Map"
          tooltip="Share"
          onClick={handleShare}
        />
      </div>

      {/* Modals */}
      <SearchPlacesModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        categories={CATEGORIES}
      />
      <BasemapSwitcherModal
        isOpen={layersOpen}
        onClose={() => setLayersOpen(false)}
      />
    </div>
  );
}
