// src/components/search/GlobalPlacesTab.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { MapManager } from "../../core/MapManager";
import { MAPBOX_ACCESS_TOKEN } from "../../utils/mapConfig";
import { useTranslation } from "react-i18next";

type MbFeature = {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
  context?: Array<{ id: string; text: string }>;
};

export function GlobalPlacesTab({
  query,
  onQueryChange,
  onPicked,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  onPicked: () => void;
}) {
  const { t } = useTranslation();
  const [results, setResults] = useState<MbFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const placeholder = t("search.placeholder.global");
  const tipText = t("search.tip.global");

  const mgr = MapManager.getInstance();
  const map = mgr.getMap();
  const proximity = useMemo(() => {
    const c = map?.getCenter();
    return c ? `${c.lng},${c.lat}` : undefined;
  }, [map]);

  // Debounced search against Mapbox Geocoding API
  useEffect(() => {
    if (!query?.trim()) {
      setResults([]);
      setErr(null);
      return;
    }

    setLoading(true);
    setErr(null);

    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const url = new URL(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query,
          )}.json`,
        );
        url.searchParams.set("access_token", MAPBOX_ACCESS_TOKEN);
        url.searchParams.set("autocomplete", "true");
        url.searchParams.set("limit", "8");
        url.searchParams.set("language", navigator.language || "en");
        // global search (no country filter); but bias near map center if we have one
        if (proximity) url.searchParams.set("proximity", proximity);
        // show mostly useful types; tweak as you wish
        url.searchParams.set(
          "types",
          "poi,address,place,locality,neighborhood",
        );

        const res = await fetch(url.toString(), { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setResults((data.features || []) as MbFeature[]);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setErr("Unable to search right now.");
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300); // debounce

    return () => {
      clearTimeout(handle);
      abortRef.current?.abort();
    };
  }, [query, proximity]);

  const handlePick = (f: MbFeature) => {
    const center = f.center as [number, number];
    const m = map || mgr.getMap();
    if (center && m) {
      m.flyTo({ center, zoom: 14, speed: 1.2 });
    }
    onPicked(); // close modal (or advance flow)
  };

  return (
    <div className="space-y-3">
      {/* Input */}
      <div className="rounded-xl ring-1 ring-black/10 bg-white/90 backdrop-blur px-1 sm:px-3 py-2">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-gray-400 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.currentTarget.value)}
            placeholder={placeholder}
            className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400"
            autoFocus
          />
          {!!query && (
            <button
              onClick={() => onQueryChange("")}
              aria-label="Clear"
              className="rounded-md px-1.5 py-1 hover:bg-black/5"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Results (inside modal) */}
      <div className="rounded-xl ring-1 ring-black/10 bg-white/85 backdrop-blur">
        <div className="max-h-72 overflow-auto divide-y divide-black/5">
          {/* States */}
          {!query && <div className="p-4 text-sm text-gray-500">{tipText}</div>}
          {query && loading && (
            <div className="p-4 text-sm text-gray-500">Searching…</div>
          )}
          {query && !loading && err && (
            <div className="p-4 text-sm text-red-600">{err}</div>
          )}
          {query && !loading && !err && results.length === 0 && (
            <div className="p-4 text-sm text-gray-500">No results.</div>
          )}

          {/* List */}
          {results.map((f) => (
            <button
              key={f.id}
              onClick={() => handlePick(f)}
              className="w-full text-left p-3 hover:bg-black/[0.04] transition flex gap-3"
            >
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500/15 to-blue-500/15 grid place-items-center shrink-0">
                <span className="text-lg">📍</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900  truncate">
                  {f.text}
                </div>
                <div className="text-xs text-gray-600  line-clamp-2">
                  {f.place_name}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Mapbox credit (required by TOS) */}
        <div className="px-3 py-2 text-[11px] text-gray-500  text-right">
          Powered by Mapbox
        </div>
      </div>
    </div>
  );
}
