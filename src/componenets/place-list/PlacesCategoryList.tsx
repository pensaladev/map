import React from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  CATEGORIES: any[];
  openCatId: string | null;
  activeCategory: any;
  setOpenCatId: (v: string | null) => void;

  checkedCats: Record<string, boolean>;
  handleCategoryCheck: (
    e: React.ChangeEvent<HTMLInputElement>,
    catId: string,
  ) => void;

  venues: any[];
  Chevron: React.FC<{ open: boolean }>;
  collapseVariants: any;

  loading: boolean;
  loadError: string | null;

  grouped: Record<string, any[]>;
  openZones: Record<string, boolean>;
  setOpenZones: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  handleClick: (
    lng: number,
    lat: number,
    title: string,
    id: string | undefined,
  ) => void;
  selectedTitle: string | null;
};

export function PlacesCategoryList({
  CATEGORIES,
  openCatId,
  activeCategory,
  setOpenCatId,
  checkedCats,
  handleCategoryCheck,
  venues,
  Chevron,
  collapseVariants,
  loading,
  loadError,
  grouped,
  openZones,
  setOpenZones,
  handleClick,
  selectedTitle,
}: Props) {
  return (
    <ul className="space-y-2">
      {CATEGORIES.map((cat) => {
        const isOpen = openCatId === cat.id;
        const isActive = cat.id === activeCategory.id;

        return (
          <motion.li
            key={cat.id}
            layout
            className="rounded-xl border border-slate-200/70 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left rounded-xl cursor-pointer select-none"
              onClick={() => setOpenCatId(isOpen ? null : cat.id)}
              onKeyDown={(e) => {
                const t = e.target as HTMLElement;
                if (
                  t.tagName === "INPUT" ||
                  t.tagName === "TEXTAREA" ||
                  t.isContentEditable
                )
                  return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenCatId(isOpen ? null : cat.id);
                }
              }}
            >
              {/* Checkbox + label */}
              <label
                className="flex items-center gap-2.5"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  className="accent-blue-600 h-4 w-4 rounded"
                  checked={!!checkedCats[cat.id]}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleCategoryCheck(e, cat.id);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onKeyDownCapture={(e) => e.stopPropagation()}
                  aria-label={`Toggle ${cat.label}`}
                />
                <span className="font-medium text-slate-800">{cat.label}</span>
              </label>

              {/* Count pill when active */}
              {isActive && (
                <span className="ml-auto inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {venues.length}
                </span>
              )}

              {/* Chevron */}
              <div className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <Chevron open={isOpen} />
              </div>
            </div>

            {/* Body */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  variants={collapseVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="overflow-hidden"
                >
                  <div className="px-3.5 pb-3.5">
                    {/* Loading */}
                    {loading && (
                      <div className="py-4 flex items-center gap-2 text-slate-600">
                        <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Loading…</span>
                      </div>
                    )}

                    {/* Error */}
                    {loadError && (
                      <div className="py-3 text-sm text-red-600">
                        {loadError}
                      </div>
                    )}

                    {/* Empty */}
                    {!loading && !loadError && venues.length === 0 && (
                      <div className="py-3 text-sm text-slate-600">
                        {cat.hint ?? "No items yet."}
                      </div>
                    )}

                    {/* Zones + Places */}
                    {!loading && !loadError && venues.length > 0 && (
                      <ul className="space-y-2">
                        {Object.entries(grouped).map(([zone, list]) => {
                          const color =
                            (list[0] as any)?.zoneColor ?? "#3b82f6";
                          const zoneOpen = !!openZones[zone];

                          return (
                            <motion.li
                              key={zone}
                              layout
                              className="rounded-lg border border-slate-200/60 bg-white/70"
                            >
                              {/* Zone header */}
                              <button
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 rounded-lg transition-colors"
                                onClick={() =>
                                  setOpenZones((prev) => ({
                                    ...prev,
                                    [zone]: !zoneOpen,
                                  }))
                                }
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                    <Chevron open={zoneOpen} />
                                  </div>
                                  <span
                                    className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white"
                                    style={{ backgroundColor: color }}
                                  />
                                </div>
                                <span className="font-medium text-slate-800">
                                  {zone}
                                </span>
                                <span className="ml-auto inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                  {list.length}
                                </span>
                              </button>

                              {/* Places */}
                              <AnimatePresence initial={false}>
                                {zoneOpen && (
                                  <motion.div
                                    variants={collapseVariants}
                                    initial="closed"
                                    animate="open"
                                    exit="closed"
                                    className="overflow-hidden"
                                  >
                                    <ul className="px-2.5 pb-2 space-y-1.5">
                                      {list.map((feature: any, idx: number) => {
                                        const title =
                                          (feature?.properties
                                            ?.Name as string) ||
                                          (feature?.properties
                                            ?.title as string) ||
                                          (feature?.properties
                                            ?.name as string) ||
                                          "Untitled";

                                        return (
                                          <li key={`${zone}-${idx}`}>
                                            <button
                                              onClick={() => {
                                                const [lng, lat] = feature
                                                  .geometry.coordinates as [
                                                  number,
                                                  number,
                                                ];
                                                const id =
                                                  (feature.properties
                                                    ?.id as string) ??
                                                  (feature.id as string) ??
                                                  (feature.properties
                                                    ?.docId as string) ??
                                                  (feature.properties
                                                    ?.placeId as string) ??
                                                  undefined;

                                                handleClick(
                                                  lng,
                                                  lat,
                                                  title,
                                                  id,
                                                );
                                              }}
                                              className={`w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                                selectedTitle === title
                                                  ? "bg-blue-100/70 font-semibold ring-1 ring-blue-200"
                                                  : "bg-white/60"
                                              }`}
                                            >
                                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
                                              <span className="truncate text-slate-800">
                                                {title}
                                              </span>
                                            </button>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        );
      })}
    </ul>
  );
}
