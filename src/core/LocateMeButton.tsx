import { useRef } from "react";
import mapboxgl from "mapbox-gl";
import { MapManager } from "./MapManager";
import { AnimatedButton } from "../componenets/buttons/AnimatedButton";

export function LocateMeButton({ className = "" }: { className?: string }) {
  const mgr = MapManager.getInstance();
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const goTo = (lng: number, lat: number) => {
    const map = mgr.getMap();
    if (!map) return;

    // add/update a pulsing dot marker
    const el = document.createElement("div");
    el.className = "locate-me-pulse";
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    } else {
      markerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);
    }

    map.flyTo({ center: [lng, lat], zoom: 14, speed: 1.2 });
  };

  const handleClick = () => {
    const map = mgr.getMap();
    if (!map) return;

    if (!("geolocation" in navigator)) {
      console.warn("Geolocation not available in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        goTo(pos.coords.longitude, pos.coords.latitude);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        // silently ignore; you could show a toast if you have one
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  };

  return (
    <>
      <AnimatedButton
        icon="mdi:crosshairs-gps"
        title="Locate Me"
        onClick={handleClick}
        className={className}
      />
      {/* Pulse dot styles */}
      <style>{`
        .locate-me-pulse {
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: #3b82f6; /* Tailwind blue-500 */
          border: 2px solid #fff;
          box-shadow: 0 0 0 0 rgba(59,130,246,.5);
          animation: locate-pulse 2s infinite;
        }
        @keyframes locate-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(59,130,246,.5); }
          70%  { box-shadow: 0 0 0 16px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
      `}</style>
    </>
  );
}
