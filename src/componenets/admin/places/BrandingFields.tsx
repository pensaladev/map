type Props = {
  brandTitle: string;
  setBrandTitle: (v: string) => void;
  brandSubtitle: string;
  setBrandSubtitle: (v: string) => void;
  locationLabel: string;
  setLocationLabel: (v: string) => void;
  shortCode: string;
  setShortCode: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
  socialHandle: string;
  setSocialHandle: (v: string) => void;
};

/**
 * Matches the exact UI and behavior of the original inline block that used <Field> and <TextInput>.
 * We recreate the same structure/classes so nothing changes visually.
 */
export default function BrandingFields({
  brandTitle,
  setBrandTitle,
  brandSubtitle,
  setBrandSubtitle,
  locationLabel,
  setLocationLabel,
  shortCode,
  setShortCode,
  website,
  setWebsite,
  socialHandle,
  setSocialHandle,
}: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Brand title */}
      <div className="grid gap-1.5">
        <label
          htmlFor="brandTitle"
          className="text-sm font-medium text-gray-800"
        >
          Brand title
        </label>
        <input
          id="brandTitle"
          placeholder="DAKAR 2026"
          value={brandTitle}
          onChange={(e) => setBrandTitle(e.target.value)}
          className={[
            "h-10 w-full rounded-xl border px-3 text-sm shadow-sm outline-none transition",
            "focus:ring-2 focus:ring-black/10 focus:border-gray-300",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          ].join(" ")}
        />
      </div>

      {/* Brand subtitle */}
      <div className="grid gap-1.5">
        <label
          htmlFor="brandSubtitle"
          className="text-sm font-medium text-gray-800"
        >
          Brand subtitle
        </label>
        <input
          id="brandSubtitle"
          placeholder="YOUTH OLYMPIC GAMES"
          value={brandSubtitle}
          onChange={(e) => setBrandSubtitle(e.target.value)}
          className={[
            "h-10 w-full rounded-xl border px-3 text-sm shadow-sm outline-none transition",
            "focus:ring-2 focus:ring-black/10 focus:border-gray-300",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          ].join(" ")}
        />
      </div>

      {/* Location label */}
      <div className="grid gap-1.5">
        <label
          htmlFor="locationLabel"
          className="text-sm font-medium text-gray-800"
        >
          Location label
        </label>
        <input
          id="locationLabel"
          placeholder="Diamniadio"
          value={locationLabel}
          onChange={(e) => setLocationLabel(e.target.value)}
          className={[
            "h-10 w-full rounded-xl border px-3 text-sm shadow-sm outline-none transition",
            "focus:ring-2 focus:ring-black/10 focus:border-gray-300",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          ].join(" ")}
        />
      </div>

      {/* Short code */}
      <div className="grid gap-1.5">
        <label
          htmlFor="shortCode"
          className="text-sm font-medium text-gray-800"
        >
          Short code
        </label>
        <input
          id="shortCode"
          placeholder="DEX"
          value={shortCode}
          onChange={(e) => setShortCode(e.target.value)}
          className={[
            "h-10 w-full rounded-xl border px-3 text-sm shadow-sm outline-none transition",
            "focus:ring-2 focus:ring-black/10 focus:border-gray-300",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          ].join(" ")}
        />
      </div>

      {/* Website */}
      <div className="grid gap-1.5">
        <label htmlFor="website" className="text-sm font-medium text-gray-800">
          Website
        </label>
        <input
          id="website"
          placeholder="https://www.dakar2026.org"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className={[
            "h-10 w-full rounded-xl border px-3 text-sm shadow-sm outline-none transition",
            "focus:ring-2 focus:ring-black/10 focus:border-gray-300",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          ].join(" ")}
        />
      </div>

      {/* Social handle */}
      <div className="grid gap-1.5">
        <label htmlFor="social" className="text-sm font-medium text-gray-800">
          Social handle
        </label>
        <input
          id="social"
          placeholder="@jojdakar2026"
          value={socialHandle}
          onChange={(e) => setSocialHandle(e.target.value)}
          className={[
            "h-10 w-full rounded-xl border px-3 text-sm shadow-sm outline-none transition",
            "focus:ring-2 focus:ring-black/10 focus:border-gray-300",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          ].join(" ")}
        />
      </div>
    </div>
  );
}
