type Props = {
  gradientFrom: string;
  setGradientFrom: (v: string) => void;
  gradientTo: string;
  setGradientTo: (v: string) => void;

  file: File | null;
  setFile: (f: File | null) => void;
  uploadPct: number;
  preview: string | null;
};

/**
 * Matches the exact UI and behavior of the original inline Visuals block.
 * We mirror the "Field" + "ColorInput" UX using the same classes so nothing changes visually.
 */
export default function VisualsFields({
  gradientFrom,
  setGradientFrom,
  gradientTo,
  setGradientTo,
  file,
  setFile,
  uploadPct,
  preview,
}: Props) {
  const gradientStyle = {
    background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
  };

  return (
    <>
      {/* Gradient pickers */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Field: Gradient from */}
        <div className="grid gap-1.5">
          <label
            htmlFor="gradFrom"
            className="text-sm font-medium text-gray-800"
          >
            Gradient from
          </label>
          <div className="flex items-center gap-2">
            <input
              id="gradFrom"
              type="color"
              value={gradientFrom}
              onChange={(e) => setGradientFrom(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded-md border p-0"
              aria-label="Pick color"
            />
            <input
              value={gradientFrom}
              onChange={(e) => setGradientFrom(e.target.value)}
              className={[
                "h-10 w-full rounded-xl border px-3 text-sm shadow-sm outline-none transition",
                "focus:ring-2 focus:ring-black/10 focus:border-gray-300",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              ].join(" ")}
            />
          </div>
        </div>

        {/* Field: Gradient to */}
        <div className="grid gap-1.5">
          <label htmlFor="gradTo" className="text-sm font-medium text-gray-800">
            Gradient to
          </label>
          <div className="flex items-center gap-2">
            <input
              id="gradTo"
              type="color"
              value={gradientTo}
              onChange={(e) => setGradientTo(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded-md border p-0"
              aria-label="Pick color"
            />
            <input
              value={gradientTo}
              onChange={(e) => setGradientTo(e.target.value)}
              className={[
                "h-10 w-full rounded-xl border px-3 text-sm shadow-sm outline-none transition",
                "focus:ring-2 focus:ring-black/10 focus:border-gray-300",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              ].join(" ")}
            />
          </div>
        </div>
      </div>

      {/* Live gradient preview */}
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-40 rounded-full border"
          style={gradientStyle}
          aria-label="Gradient preview"
        />
        <span className="text-xs text-gray-600">Live gradient preview</span>
      </div>

      {/* Cover image */}
      <div className="grid gap-1.5">
        <label htmlFor="image" className="text-sm font-medium text-gray-800">
          Cover image
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file && (
            <div className="text-xs text-gray-600">
              {uploadPct > 0 && uploadPct < 100
                ? `Uploading ${uploadPct}%…`
                : "Ready to upload"}
            </div>
          )}
        </div>
        {preview && (
          <img
            src={preview}
            alt="preview"
            className="mt-2 max-h-44 w-auto rounded-xl border shadow-sm"
          />
        )}
      </div>
    </>
  );
}
