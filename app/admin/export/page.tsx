const exports = [
  ["Titles CSV", "/api/export/titles"],
  ["Production CSV", "/api/export/production"],
  ["Activity log CSV", "/api/export/activity"],
  ["Users CSV", "/api/export/users"]
];

export default function AdminExportPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Admin</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Data Export</h1>
        <p className="mt-2 text-sm text-black/60">Download CSV files so Ahtesham always owns the data.</p>
      </div>
      <section className="grid gap-3 md:grid-cols-2">
        {exports.map(([label, href]) => (
          <a key={href} href={href} className="rounded-lg border border-black/10 bg-white p-4 font-semibold text-ink shadow-sm transition hover:border-moss hover:text-moss">
            {label}
          </a>
        ))}
      </section>
    </div>
  );
}
