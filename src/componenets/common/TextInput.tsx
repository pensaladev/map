export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "h-10 w-full rounded-xl border px-3 text-sm shadow-sm outline-none transition",
        "focus:ring-2 focus:ring-black/10 focus:border-gray-300",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        props.className || "",
      ].join(" ")}
    />
  );
}
