export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={[
        "min-h-[92px] w-full rounded-xl border px-3 py-2 text-sm shadow-sm outline-none transition",
        "focus:ring-2 focus:ring-black/10 focus:border-gray-300",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        props.className || "",
      ].join(" ")}
    />
  );
}
