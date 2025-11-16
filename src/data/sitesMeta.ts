// src/data/sitesMeta.ts

import type { SportIconKey } from "./sports";

export type VenueSport = {
  key: SportIconKey;
  label: string; // e.g. "Escrime"
  icon?: string;
  iconUrl?: string; // optional (use your own black/white pictos)
};

export type VenueMeta = {
  // existing
  imageUrl?: string;
  address?: string;
  rating?: number;
  tags?: string[];
  info?: string;
  info_fr?: string;
  pointColor?: string;

  // new (for Dakar 2026 card style)
  brandTitle?: string; // "DAKAR 2026"
  brandSubtitle?: string; // "YOUTH OLYMPIC GAMES"
  locationLabel?: string; // "Diamniadio"
  shortCode?: string; // "DEX"
  sportCount?: number; // 6
  sports?: VenueSport[]; // list with labels + icons
  gradient?: [string, string]; // header gradient [from, to]
  website?: string; // "https://www.dakar2026.org"
  socialHandle?: string; // "@jojdakar2026"
};

// Keyed by site name (Dakar / Diamniadio / Saly), then by feature Name
export const SITES_META: Record<string, Record<string, VenueMeta>> = {
  Dakar: {
    "Iba Mar Diop Stadium": {
      imageUrl: "/v-img/stade-iba-mar-diop.jpg",
      address: "Dakar, Senegal",
      rating: 4.6,
      tags: ["Stadium", "Sports", "Events"],
      pointColor: "#E91E63",
      info: "Historic multi-use stadium in Dakar.",
      info_fr: "Stade historique polyvalent de Dakar.",
    },
    "Egg Tower Complex": {
      imageUrl: "/v-img/egg-tower.jpg",
      address: "Dakar, Senegal",
      rating: 4.4,
      tags: ["Complex", "Events"],
      pointColor: "#9C27B0",
      brandTitle: "DAKAR 2026",
      brandSubtitle: "YOUTH OLYMPIC GAMES",
      locationLabel: "Dakar",
      shortCode: "DEX",
      sportCount: 6,
      // Green header gradient sampled from poster vibe
      gradient: ["#0034A0", "#01ABD1"],

      website: "https://www.dakar2026.org",
      socialHandle: "@jojdakar2026",

      info: "Centre des expositions de Diamniadio (Dakar Expo Center).",
      info_fr: "Centre des expositions de Diamniadio (Dakar Expo Center).",

      sports: [
        // Material Design Icons set is broad and stable:
        { key: "fencing", label: "Escrime", icon: "mdi:sword-cross" },
        {
          key: "table_tennis",
          label: "Tennis de table",
          icon: "mdi:table-tennis",
        },
        { key: "taekwondo", label: "Taekwondo", icon: "mdi:karate" },
        { key: "wushu_taolu", label: "Wushu Taolu", icon: "mdi:sword" },
        { key: "judo", label: "Judo", icon: "mdi:karate" }, // swap to "game-icons:judo" if you prefer that set
        // Gymnastics: pick one of these depending on your taste/availability
        // "icon-park-outline:gymnastics" or a safe emoji-based one:
        // {
        //   key: "gymnastics_artistic",
        //   label: "Gymnastique artistique",
        //   icon: "noto:person-cartwheeling",
        // },
      ],
    },
    "West Corniche": {
      imageUrl: "/v-img/corniche-ouest.jpg",
      address: "Corniche Ouest, Dakar",
      rating: 4.8,
      tags: ["Coast", "Scenic", "Outdoor"],
      pointColor: "#03A9F4",
      info: "Scenic coastal road and recreation area.",
      info_fr: "Route côtière pittoresque et espace de loisirs.",
    },
  },

  Diamniadio: {
    "Dakar Arena": {
      imageUrl: "/v-img/dakar-arena.jpg",
      address: "Diamniadio, Senegal",
      rating: 4.7,
      tags: ["Arena", "Sports", "Concerts"],
      pointColor: "#2ECC71",
      sports: [
        // Material Design Icons set is broad and stable:
        { key: "fencing", label: "Escrime", icon: "mdi:sword-cross" },
        {
          key: "table_tennis",
          label: "Tennis de table",
          icon: "mdi:table-tennis",
        },
        { key: "taekwondo", label: "Taekwondo", icon: "mdi:karate" },
        { key: "wushu_taolu", label: "Wushu Taolu", icon: "mdi:sword" },
        { key: "judo", label: "Judo", icon: "mdi:karate" }, // swap to "game-icons:judo" if you prefer that set
        // Gymnastics: pick one of these depending on your taste/availability
        // "icon-park-outline:gymnastics" or a safe emoji-based one:
        // {
        //   // key: "gymnastics_artistic",
        //   label: "Gymnastique artistique",
        //   icon: "noto:person-cartwheeling",
        // },
      ],
      info: "State-of-the-art multi-purpose arena.",
      info_fr: "Arène polyvalente ultramoderne.",
    },
    "Me Abdoulaye Wade Stadium": {
      imageUrl: "/v-img/stade-abdoulaye-WADE.jpg",
      address: "Diamniadio, Senegal",
      rating: 4.9,
      tags: ["Stadium", "Football"],
      pointColor: "#1ABC9C",
      info: "National stadium for football and large events.",
      info_fr: "Stade national pour le football et les grands événements.",
    },
    "Diamniadio Gendarmerie Equestrian Center": {
      imageUrl: "/v-img/centre-equestre.jpg",
      address: "Diamniadio, Senegal",
      rating: 4.5,
      tags: ["Equestrian", "Sports"],
      pointColor: "#8BC34A",
      info: "Equestrian training and competition facility.",
      info_fr: "Centre d'entraînement et de compétition équestre.",
    },

    // ⭐ Matches your JSON "Diamniadio Exhibition Center"
    "Diamniadio Exhibition Center": {
      // Use your actual asset path:
      imageUrl: "/v-img/dxc.jpg",
      address: "Diamniadio, Senegal",
      rating: 4.6,
      tags: ["Exhibition", "Events", "Business"],
      pointColor: "#FF9800",

      // Card bits from the poster
      brandTitle: "DAKAR 2026",
      brandSubtitle: "YOUTH OLYMPIC GAMES",
      locationLabel: "Diamniadio",
      shortCode: "DEX",
      sportCount: 6,
      // Green header gradient sampled from poster vibe
      gradient: ["#12B76A", "#0A6B4A"],

      website: "https://www.dakar2026.org",
      socialHandle: "@jojdakar2026",

      info: "Centre des expositions de Diamniadio (Dakar Expo Center).",
      info_fr: "Centre des expositions de Diamniadio (Dakar Expo Center).",

      sports: [
        // Material Design Icons set is broad and stable:
        { key: "fencing", label: "Escrime", icon: "mdi:sword-cross" },
        {
          key: "table_tennis",
          label: "Tennis de table",
          icon: "mdi:table-tennis",
        },

        { key: "judo", label: "Judo", icon: "mdi:karate" }, // swap to "game-icons:judo" if you prefer that set
        // Gymnastics: pick one of these depending on your taste/availability
        // "icon-park-outline:gymnastics" or a safe emoji-based one:
        // {
        //   key: "gymnastics_artistic",
        //   label: "Gymnastique artistique",
        //   icon: "noto:person-cartwheeling",
        // },
      ],
    },
  },

  Saly: {
    "Saly Beach": {
      imageUrl: "/v-img/plage-de-saly.jpg",
      address: "Saly, M'Bour, Senegal",
      rating: 4.8,
      tags: ["Beach", "Family", "Surf"],
      pointColor: "#FF8C00",
      info: "Popular beach with water sports and food stalls.",
      info_fr: "Plage populaire avec sports nautiques et stands de restauration.",
    },
  },
};
