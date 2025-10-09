type Props = {
  type?: string;
  modifier?: string;
  exit?: number;
  className?: string;
  bearing_before?: number;
  bearing_after?: number;
};

const norm = (s?: string) =>
  (s || "").toLowerCase().replace(/[_-]+/g, " ").trim();

const rotateFor = (modifier?: string) => {
  switch (norm(modifier)) {
    case "left":
      return -90;
    case "slight left":
      return -45;
    case "sharp left":
      return -135;
    case "right":
      return 90;
    case "slight right":
      return 45;
    case "sharp right":
      return 135;
    case "uturn":
      return 180;
    case "straight":
    default:
      return 0;
  }
};

const bearingDelta = (before?: number, after?: number) => {
  if (before == null || after == null) return 0;
  let d = after - before; // -359..359
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d; // degrees, clockwise positive
};

export function ManeuverIcon({
  type,
  modifier,
  exit,
  className,
  bearing_before,
  bearing_after,
}: Props) {
  const t = norm(type);
  let deg = rotateFor(modifier);

  // Fallback: if no modifier, infer from bearings
  if (!modifier && bearing_before != null && bearing_after != null) {
    deg = bearingDelta(bearing_before, bearing_after);
  }

  const Arrow = ({ deg = 0 }) => (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "w-4 h-4 text-emerald-700"}
      style={{ transform: `rotate(${deg}deg)` }}
      aria-hidden
    >
      <path d="M12 3l5 5h-3v8h-4V8H7l5-5z" fill="currentColor" />
    </svg>
  );

  const UTurn = () => (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "w-4 h-4 text-emerald-700"}
    >
      <path
        d="M12 3a6 6 0 016 6v9h-4V9a2 2 0 10-4 0v9H6V9a6 6 0 016-6z"
        fill="currentColor"
      />
    </svg>
  );

  const Roundabout = () => (
    <div className="relative inline-block">
      <svg
        viewBox="0 0 24 24"
        className={className ?? "w-4 h-4 text-emerald-700"}
      >
        <path
          d="M12 2a10 10 0 1010 10h-3a7 7 0 11-7-7V2z"
          fill="currentColor"
        />
      </svg>
      {exit ? (
        <span className="absolute -right-1 -top-1 text-[9px] leading-none px-1 rounded bg-emerald-600 text-white">
          {exit}
        </span>
      ) : null}
    </div>
  );

  if (t === "uturn") return <UTurn />;
  if (t === "roundabout") return <Roundabout />;
  if (
    ["turn", "merge", "fork", "off ramp", "on ramp", "continue"].includes(t)
  ) {
    return <Arrow deg={deg} />;
  }
  if (t === "arrive") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className ?? "w-4 h-4 text-emerald-700"}
      >
        <path d="M12 2l7 7-7 13-7-13 7-7z" fill="currentColor" />
      </svg>
    );
  }
  if (t === "depart") return <Arrow deg={0} />;

  return <Arrow deg={deg} />;
}
