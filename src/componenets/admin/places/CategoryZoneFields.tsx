import { Field } from "../../common/Field";

type Zone = { id: string; name: string; color: string; categoryId: string };

type Props = {
  categoryId: string;
  setCategoryId: (v: string) => void;
  CATEGORIES: { id: string; label: string }[];
  zonesLoading: boolean;
  hasFallback: boolean;
  zoneId: string;
  setZoneId: (v: string) => void;
  zonesPrimary: Zone[];
  zonesFallback: Zone[];
};

export default function CategoryZoneFields({
  categoryId,
  setCategoryId,
  CATEGORIES,
  zonesLoading,
  hasFallback,
  zoneId,
  setZoneId,
  zonesPrimary,
  zonesFallback,
}: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="category" label="Category" required>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-10 w-full rounded-xl border px-3 text-sm shadow-sm focus:border-gray-300 focus:ring-2 focus:ring-black/10"
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="zone"
        label="Zone"
        hint={
          zonesLoading
            ? "Loading zones…"
            : hasFallback
            ? "No zones in this category — showing Competition zones so you can still attach one."
            : "Optional. You can save without a zone."
        }
      >
        <select
          id="zone"
          disabled={zonesLoading}
          value={zoneId}
          onChange={(e) => setZoneId(e.target.value)}
          className="h-10 w-full rounded-xl border px-3 text-sm shadow-sm focus:border-gray-300 focus:ring-2 focus:ring-black/10 disabled:opacity-60"
        >
          <option value="">(No zone)</option>

          {/* Primary zones (for the selected category) */}
          {zonesPrimary.length > 0 && (
            <>
              <option value="" disabled>
                — Zones for this category —
              </option>
              {zonesPrimary.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </>
          )}

          {/* Fallback zones from Competition */}
          {zonesFallback.length > 0 && (
            <>
              <option value="" disabled>
                — Competition zones —
              </option>
              {zonesFallback.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </>
          )}
        </select>
      </Field>
    </div>
  );
}
