import {
  directionToIcon,
  normalizeModifier,
  type Direction,
} from "./StepIcons";

export function StepPin({ modifier }: { modifier?: string }) {
  const dir: Direction = normalizeModifier(modifier);
  const Icon = directionToIcon(dir);

  return (
    <div className="relative">
      <div className="w-8 h-8 rounded-full bg-white grid place-items-center border border-emerald-500 shadow-md">
        <Icon className="w-4 h-4 text-emerald-700" />
      </div>
      <div
        className="absolute left-1/2 -bottom-[6px] -translate-x-1/2 w-0 h-0
                      border-l-[6px] border-r-[6px] border-t-[6px] border-transparent
                      border-t-emerald-500/70"
      />
    </div>
  );
}
