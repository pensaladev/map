import type { VenueSport } from "./sitesMeta";

export type SportIconKey =
  | "rugby_sevens"
  | "athletics"
  | "boxing"
  | "futsal"
  | "swimming"
  | "3x3_basketball"
  | "breaking"
  | "baseball5"
  | "skateboarding_street"
  | "cycling_road"
  | "weightlifting"
  | "tennis"
  | "karate"
  | "shooting"
  | "surfing"
  | "sport_climbing"
  | "hockey"
  | "golf"
  | "modern_pentathlon"
  | "canoe"
  | "archery"
  | "cycling"
  | "badminton"
  | "fencing"
  | "table_tennis"
  | "taekwondo"
  | "wushu_taolu"
  | "artistic_gymnastics"
  | "judo"
  | "sailing_windsurfing"
  | "rowing_coastal_beach_sprints"
  | "beach_volleyball"
  | "beach_handball"
  | "beach_wrestling"
  | "gymnastics_artistic"
  | "equitation"
  | "triathlon";

// types: { key: string; label: string; icon: string }
export const ALL_SPORT_OPTIONS: VenueSport[] = [
  { key: "rugby_sevens", label: "Rugby à sept", icon: "mdi:rugby" },
  { key: "athletics", label: "Athlétisme", icon: "mdi:run-fast" },
  { key: "boxing", label: "Boxe", icon: "mdi:boxing-glove" },
  { key: "futsal", label: "Futsal", icon: "mdi:soccer" },
  { key: "swimming", label: "Natation", icon: "mdi:swim" },
  { key: "3x3_basketball", label: "Basketball 3*3", icon: "mdi:basketball" },
  { key: "breaking", label: "Break dance", icon: "mdi:human-female-dance" },
  { key: "baseball5", label: "Baseball5", icon: "mdi:baseball" },
  {
    key: "skateboarding_street",
    label: "Skateboard (rue)",
    icon: "mdi:skateboard",
  },
  { key: "cycling_road", label: "Cyclisme sur route", icon: "mdi:bike" },
  { key: "weightlifting", label: "Haltérophilie", icon: "mdi:weight-lifter" },
  { key: "tennis", label: "Tennis", icon: "mdi:tennis" },
  { key: "karate", label: "Karaté", icon: "mdi:karate" },
  { key: "shooting", label: "Tir", icon: "mdi:target" },
  { key: "surfing", label: "Surf", icon: "mdi:surfing" },
  { key: "sport_climbing", label: "Escalade sportive", icon: "mdi:mountain" },
  { key: "hockey", label: "Hockey", icon: "mdi:hockey-sticks" },
  { key: "golf", label: "Golf", icon: "cil:golf" },
  { key: "modern_pentathlon", label: "Pentathlon moderne", icon: "mdi:medal" },
  { key: "canoe", label: "Canoe", icon: "game-icons:canoe" },
  { key: "archery", label: "Tir à l'arc", icon: "mdi:bow-arrow" },
  { key: "cycling", label: "Cyclisme", icon: "mdi:bike" },
  { key: "badminton", label: "Badminton", icon: "mdi:badminton" },

  { key: "fencing", label: "Escrime", icon: "mdi:sword-cross" },
  { key: "taekwondo", label: "Taekwondo", icon: "mdi:karate" },
  { key: "table_tennis", label: "Tennis de table", icon: "mdi:table-tennis" },
  { key: "wushu_taolu", label: "Wushu Taolu", icon: "mdi:sword" },
  {
    key: "equitation",
    label: "Équitation (saut d'obstacles)",
    icon: "mdi:equestrian",
  },
  {
    key: "gymnastics_artistic",
    label: "Gymnastique artistique",
    icon: "noto:person-cartwheeling",
  },
  { key: "judo", label: "Judo", icon: "mdi:karate" },

  {
    key: "sailing_windsurfing",
    label: "Voile (Planche à voile)",
    icon: "mdi:sail-boat",
  },
  {
    key: "rowing_coastal_beach_sprints",
    label: "Sprints d'aviron sur la plage côtière",
    icon: "mdi:rowing",
  },
  { key: "beach_volleyball", label: "Beach-volley", icon: "mdi:volleyball" },
  { key: "beach_handball", label: "Handball de plage", icon: "mdi:handball" },
  { key: "beach_wrestling", label: "Lutte de plage", icon: "mdi:wrestling" },
  { key: "triathlon", label: "Triathlon", icon: "game-icons:strong-man" },
];
