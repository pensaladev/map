import { TextInput } from "./TextInput";

export function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 cursor-pointer rounded-md border p-0"
        aria-label="Pick color"
      />
      <TextInput value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
