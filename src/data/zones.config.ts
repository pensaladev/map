export type ZoneConfig = { name: string; file: string; color: string };

export const ZONES: ZoneConfig[] = [
  { name: "Dakar", file: "/data/dakar_zone_comp.json", color: "transparent" },
  {
    name: "Diamniadio",
    file: "/data/diamniadio_zone_comp.json",
    color: "transparent",
  },
  { name: "Saly", file: "/data/saly_zone_comp.json", color: "transparent" },
  // {
  //   name: "Hospital_Hôpitaux",
  //   file: "/data/Hospital_H.json",
  //   color: "transparent",
  // },
];
