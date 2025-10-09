import { Icon } from "@iconify/react";
import { Field } from "../../common/Field";
import { TextInput } from "../../common/TextInput";
import { TextArea } from "../../common/TextArea";
import { ColorInput } from "../../common/ColorInput";
import { Chip } from "../../common/Chip";
import { Section } from "../../common/Section";
import type { VenueSport } from "../../../data/sitesMeta";
import LocationPickerModal from "../../../core/map/LocationPickerModal";
import { useState } from "react";
import LocationPickerButton from "../../../core/map/LocationPickerButton";

type Props = {
  name: string;
  setName: (v: string) => void;
  lat: number | "";
  setLat: (v: number | "") => void;
  lng: number | "";
  setLng: (v: number | "") => void;
  address: string;
  setAddress: (v: string) => void;
  info: string;
  setInfo: (v: string) => void;
  rating: number | "";
  setRating: (v: number | "") => void;
  tags: string;
  setTags: (v: string) => void;
  tagList: string[];
  pointColor: string;
  setPointColor: (v: string) => void;

  categoryId: string;
  ALL_SPORT_OPTIONS: VenueSport[];
  sports: VenueSport[];
  setSports: (fn: (prev: VenueSport[]) => VenueSport[]) => void;
  sportsTouched: boolean;
  setSportsTouched: (v: boolean) => void;
  uniqSports: (list: VenueSport[]) => VenueSport[];
};

export default function BasicDetailsFields(props: Props) {
  const {
    name,
    setName,
    lat,
    setLat,
    lng,
    setLng,
    address,
    setAddress,
    info,
    setInfo,
    rating,
    setRating,
    tags,
    setTags,
    tagList,
    pointColor,
    setPointColor,
    categoryId,
    ALL_SPORT_OPTIONS,
    sports,
    setSports,
    // sportsTouched,
    setSportsTouched,
    uniqSports,
  } = props;

  const [mapOpen, setMapOpen] = useState(false);

  return (
    <>
      <Section title="Basic details">
        {/* Row 1: name */}
        <div className="grid gap-4 sm:grid-cols-1">
          <Field id="name" label="Place name" required>
            <TextInput
              id="name"
              placeholder="e.g. Iba Mar Diop Stadium"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        </div>
        {/* Row 1.1:  lat, lng + map picker */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="lat" label="Latitude" required>
            <TextInput
              id="lat"
              type="number"
              step="any"
              placeholder="14.6928"
              value={lat as any}
              onChange={(e) =>
                setLat(e.target.value === "" ? "" : parseFloat(e.target.value))
              }
            />
          </Field>

          <Field id="lng" label="Longitude" required>
            <div className="flex items-center gap-3">
              <TextInput
                id="lng"
                type="number"
                step="any"
                placeholder="-17.4467"
                value={lng as any}
                onChange={(e) =>
                  setLng(
                    e.target.value === "" ? "" : parseFloat(e.target.value),
                  )
                }
                className="flex-1"
              />
              <LocationPickerButton onClick={() => setMapOpen(true)} />
            </div>
          </Field>
        </div>

        <Field id="address" label="Address">
          <TextInput
            id="address"
            placeholder="Street, City"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>

        <Field
          id="info"
          label="About / Info"
          hint="Short description shown in the card/popup."
        >
          <TextArea
            id="info"
            placeholder="Historic multi-use stadium in Dakar."
            value={info}
            onChange={(e) => setInfo(e.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="rating" label="Rating (0–5)">
            <TextInput
              id="rating"
              type="number"
              step="0.1"
              min={0}
              max={5}
              placeholder="4.6"
              value={rating as any}
              onChange={(e) =>
                setRating(
                  e.target.value === "" ? "" : parseFloat(e.target.value),
                )
              }
            />
          </Field>
          <Field id="tags" label="Tags" hint="Comma separated. Shown as chips.">
            <TextInput
              id="tags"
              placeholder="Stadium, Sports, Events"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </Field>
          <Field
            id="pointColor"
            label="Point color"
            hint="Marker color on the map."
          >
            <ColorInput value={pointColor} onChange={setPointColor} />
          </Field>
        </div>

        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {tagList.map((t, i) => (
              <Chip key={i}>{t}</Chip>
            ))}
          </div>
        )}
      </Section>

      {categoryId === "competition" && (
        <Section
          title="Competition Sports"
          desc="Select all sports hosted at this venue. Defaults come from the site meta when available."
        >
          {ALL_SPORT_OPTIONS.length === 0 ? (
            <p className="text-sm text-gray-600">
              No sport options found in site meta.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_SPORT_OPTIONS.map((s) => {
                const checked = sports.some((x) => x.key === s.key);
                return (
                  <label
                    key={s.key}
                    className="flex items-center gap-3 rounded-xl border bg-white/70 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSportsTouched(true);
                        setSports((prev) =>
                          e.target.checked
                            ? uniqSports([...prev, s])
                            : prev.filter((x) => x.key !== s.key),
                        );
                      }}
                    />
                    <span className="inline-flex items-center gap-2">
                      {s.icon ? (
                        <Icon icon={s.icon} width={18} height={18} />
                      ) : null}
                      <span className="font-medium">{s.label}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {sports.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {sports.map((s) => (
                <span
                  key={s.key}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs bg-white/70"
                >
                  {s.icon ? (
                    <Icon icon={s.icon} width={14} height={14} />
                  ) : null}
                  {s.label}
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Modal lives here so the component stays self-contained */}
      <LocationPickerModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        initialLat={typeof lat === "number" ? lat : undefined}
        initialLng={typeof lng === "number" ? lng : undefined}
        onSelect={(selLat, selLng, addr) => {
          setLat(selLat);
          setLng(selLng);
          if (addr && !address) setAddress(addr);
        }}
      />
    </>
  );
}
