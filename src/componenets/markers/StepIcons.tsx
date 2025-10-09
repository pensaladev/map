export type Direction =
  | "straight"
  | "right"
  | "left"
  | "slight right"
  | "slight left"
  | "sharp right"
  | "sharp left"
  | "uturn";

type IconProps = { className?: string };

export const IconStraight = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 3l5 5h-3v13h-4V8H7l5-5z" fill="currentColor" />
  </svg>
);
export const IconRight = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    style={{ transform: "rotate(90deg)" }}
  >
    <path d="M12 3l5 5h-3v13h-4V8H7l5-5z" fill="currentColor" />
  </svg>
);
export const IconLeft = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    style={{ transform: "rotate(-90deg)" }}
  >
    <path d="M12 3l5 5h-3v13h-4V8H7l5-5z" fill="currentColor" />
  </svg>
);
export const IconSlightRight = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    style={{ transform: "rotate(45deg)" }}
  >
    <path d="M12 3l5 5h-3v13h-4V8H7l5-5z" fill="currentColor" />
  </svg>
);
export const IconSlightLeft = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    style={{ transform: "rotate(-45deg)" }}
  >
    <path d="M12 3l5 5h-3v13h-4V8H7l5-5z" fill="currentColor" />
  </svg>
);
export const IconSharpRight = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    style={{ transform: "rotate(135deg)" }}
  >
    <path d="M12 3l5 5h-3v13h-4V8H7l5-5z" fill="currentColor" />
  </svg>
);
export const IconSharpLeft = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    style={{ transform: "rotate(-135deg)" }}
  >
    <path d="M12 3l5 5h-3v13h-4V8H7l5-5z" fill="currentColor" />
  </svg>
);
export const IconUTurn = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      d="M12 3a6 6 0 016 6v11h-4V9a2 2 0 10-4 0v11H6V9a6 6 0 016-6z"
      fill="currentColor"
    />
  </svg>
);

export function directionToIcon(dir: Direction) {
  switch (dir) {
    case "right":
      return IconRight;
    case "left":
      return IconLeft;
    case "slight right":
      return IconSlightRight;
    case "slight left":
      return IconSlightLeft;
    case "sharp right":
      return IconSharpRight;
    case "sharp left":
      return IconSharpLeft;
    case "uturn":
      return IconUTurn;
    case "straight":
    default:
      return IconStraight;
  }
}

export const normalizeModifier = (s?: string): Direction => {
  const m = (s || "straight").toLowerCase().replace(/[_-]+/g, " ").trim();
  if (
    [
      "right",
      "left",
      "uturn",
      "straight",
      "slight right",
      "slight left",
      "sharp right",
      "sharp left",
    ].includes(m)
  ) {
    return m as Direction;
  }
  return "straight";
};
