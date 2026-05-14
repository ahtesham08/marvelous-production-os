import { getLaunchChecklist } from "@/lib/launchChecklist";

export const dynamic = "force-dynamic";

export default async function LaunchChecklistPage() {
  const items = await getLaunchChecklist();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Production Deployment</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Launch Checklist</h1>
        <p className="mt-2 text-sm text-black/60">Use this before sharing the app URL with the team.</p>
      </div>
      <section className="grid gap-3">
        {items.map((item) => (
          <article key={item.label} className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-ink">{item.label}</h2>
              <span className={item.ok ? "rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800" : "rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-danger"}>
                {item.ok ? "Ready" : "Needs Fix"}
              </span>
            </div>
            <p className="mt-2 text-sm text-black/60">{item.detail}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
