export function TabBar({
  tabs,
  activeId,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="w-full">
      <div className="inline-flex rounded-xl bg-black/5 p-1">
        {tabs.map((t) => {
          const active = t.id === activeId;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={[
                "px-4 py-2 rounded-lg text-sm transition",
                active
                  ? "bg-white shadow ring-1 ring-black/5"
                  : "text-gray-600 hover:bg-black/10",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
