import { Icon } from "@iconify/react";

type Props = {
  onClick: () => void;
};

export default function LocationPickerButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Pick on map"
      aria-label="Pick on map"
      className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
    >
      <Icon icon="mdi:map-marker" className="h-5 w-5" />
    </button>
  );
}
