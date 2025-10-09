export type CongestionLevel =
  | "unknown"
  | "low"
  | "moderate"
  | "heavy"
  | "severe";

export type RouteAnnotations = {
  distance?: number[]; // meters per segment
  duration?: number[]; // seconds per segment
  speed?: number[]; // m/s per segment
  congestion?: CongestionLevel[]; // per segment
  maxspeed?: ({ unknown?: boolean; unit?: string; speed?: number } | null)[];
};

export type ManeuverInfo = {
  type?: string; // e.g., "turn", "roundabout", "merge", "uturn", "arrive"
  modifier?: string; // e.g., "left", "slight right", "straight"
  bearing_before?: number;
  bearing_after?: number;
  exit?: number;
};

export type StepDetail = {
  instruction: string;
  location: [number, number];
  distance: number; // meters
  duration: number; // seconds
  name?: string; // road name
  mode?: string; // driving, etc.
  geometry?: GeoJSON.LineString;
  banner?: unknown; // Mapbox banner instruction object
  maneuver?: ManeuverInfo;
};

export type RouteAlternative = {
  distance: number;
  duration: number;
  geometry: GeoJSON.LineString;
};

export type RouteDetails = {
  distance: number;
  duration: number;
  steps: StepDetail[];
  annotations?: RouteAnnotations;
  alternatives?: RouteAlternative[];
};

export type RouteSummary = Pick<RouteDetails, "distance" | "duration">;
