// src/admin/types.ts
import type { Timestamp, GeoPoint } from "firebase/firestore";

export interface Category {
  id: string;
  label: string;
  hint?: string;
  order?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  categoryId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Place {
  id: string;
  name: string;
  location: GeoPoint;
  address?: string;
  info?: string;
  info_fr?: string;
  rating?: number;
  tags: string[];
  pointColor?: string;
  imageUrl?: string;
  brandTitle?: string;
  brandSubtitle?: string;
  locationLabel?: string;
  shortCode?: string;
  gradientFrom?: string;
  gradientTo?: string;
  website?: string;
  socialHandle?: string;
  sportCount: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Sport {
  id: string; // e.g., "fencing"
  label: string; // "Escrime"
  icon?: string;
  iconUrl?: string;
}

export interface PlaceSport {
  id: string;
  sportId: string;
  labelOverride?: string;
  iconOverride?: string;
  iconUrlOverride?: string;
  order?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
