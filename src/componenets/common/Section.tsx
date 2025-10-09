export function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-2 py-10 border-b border-gray-200">
      <header className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {desc ? <p className="mt-1 text-sm text-gray-500">{desc}</p> : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
