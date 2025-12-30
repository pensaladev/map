import { Icon } from "@iconify/react/dist/iconify.js";
import { ManeuverIcon } from "./maneuverIcons";

export type StepPopupProps = {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  name?: string; // road name
  congestion?: "unknown" | "low" | "moderate" | "heavy" | "severe";
  maneuver?: { type?: string; modifier?: string; exit?: number };
};

const badgeColor: Record<NonNullable<StepPopupProps["congestion"]>, string> = {
  unknown: "bg-white",
  low: "bg-green-200 text-green-800",
  moderate: "bg-yellow-200 text-yellow-800",
  heavy: "bg-orange-200 text-orange-800",
  severe: "bg-red-200 text-red-800",
};

const fmtKm = (m: number) => (m / 1000).toFixed(2) + " km";
const fmtMin = (s: number) => Math.round(s / 60) + " min";
const congestionLabel: Record<
  NonNullable<StepPopupProps["congestion"]>,
  string
> = {
  unknown: "-",
  low: "Low",
  moderate: "Moderate",
  heavy: "Heavy",
  severe: "Severe",
};
export function StepPopup({
  instruction,
  distance,
  duration,
  name,
  congestion = "unknown",
  maneuver,
}: StepPopupProps) {
  return (
    <div className="w-[190px] sm:w-[240px] rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-2 sm:p-3 shadow-lg">
      <div className="flex flex-col items-start gap-2">
        <div className="shrink-0 mt-0.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/15 grid place-items-center">
            {/* <span className="text-xs font-bold text-emerald-600">→</span> */}
            <ManeuverIcon
              type={maneuver?.type}
              modifier={maneuver?.modifier}
              exit={maneuver?.exit}
              className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-700"
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="text-[12px] sm:text-sm font-semibold text-gray-900 leading-snug">
            {instruction}
          </div>
          {name && (
            <div className="text-[10.5px] sm:text-xs text-gray-600 mt-0.5">
              Road: <span className="font-medium">{name}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between text-[10.5px] sm:text-xs">
            <div className="text-gray-700">
              <span className="font-medium">{fmtKm(distance)}</span>
              <span className="mx-1.5 text-gray-400">•</span>
              <span className="font-medium">{fmtMin(duration)}</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full flex items-center gap-1 capitalize ${badgeColor[congestion]}`}
              title="Traffic"
            >
              <Icon
                icon="emojione-v1:vertical-traffic-light"
                className="w-3.5 h-3.5"
              />
              {congestionLabel[congestion]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
