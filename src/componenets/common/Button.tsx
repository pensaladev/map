export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: any) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-black/10";
  const styles =
    variant === "primary"
      ? "bg-black text-white hover:bg-zinc-900 disabled:bg-zinc-400"
      : variant === "ghost"
      ? "hover:bg-black/5"
      : "border bg-white hover:bg-black/5";
  return (
    <button className={[base, styles, className].join(" ")} {...rest}>
      {children}
    </button>
  );
}
