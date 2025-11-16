// src/pages/MapPage.tsx
import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapManager } from "../../core/MapManager";
import { Sidebar } from "../../componenets/Sidebar";
import { HeaderBar } from "../../componenets/header/HeaderBar";
import { getInitialZoom } from "../../utils/mapConfig";

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapManager = MapManager.getInstance();
  const [longitude, setLongitude] = useState(-74.0242);
  const [latitude, setLatitude] = useState(40.6941);
  const [zoom, setZoom] = useState(() => getInitialZoom());

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const map = mapManager.initMap(mapContainerRef.current);

    const onMove = () => {
      const center = map.getCenter();
      setLongitude(center.lng);
      setLatitude(center.lat);
      setZoom(map.getZoom());
    };

    map.on("move", onMove);
    return () => {
      map.off("move", onMove);
      mapManager.destroyMap();
    };
  }, [mapManager]);

  const handleReset = () => mapManager.resetView();
  const handleClear = () => {
    MapManager.getInstance().clearCurrentRoute();
    //  setRoute(null);
  };

  return (
    <div className="relative w-full h-[100dvh]">
      <HeaderBar title="DAKAR JOJ 2026 MAP" onReset={handleReset} />
      {/* Top-left: Admin link (only if admin) */}

      {/* Sidebar (original) */}
      <div className="flex justify-center items-center flex-col bg-red-300">
        <Sidebar
          longitude={longitude}
          latitude={latitude}
          zoom={zoom}
          onReset={handleReset}
          onClearRoute={handleClear}
        />
      </div>

      {/* The mighty map (original) */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
