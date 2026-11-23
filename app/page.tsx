import Link from "next/link";
import { List, Plus, Upload } from "lucide-react";
import { AdminAttentionDashboard } from "@/components/AdminAttentionDashboard";
import { DashboardCard } from "@/components/DashboardCard";
import { DailyReportBox } from "@/components/DailyReportBox";
import { FreshStartSections } from "@/components/FreshStartSections";
import { OperationsQueue } from "@/components/OperationsQueue";
import { SupervisorBreakdown } from "@/components/SupervisorBreakdown";
import { SyncButton } from "@/components/SyncButton";
import { TitleTable } from "@/components/TitleTable";
import { buildAdminAttentionDashboard, type AdminAttentionDashboard as AttentionData } from "@/lib/adminAttention";
import { getDashboardData } from "@/lib/dashboardData";
import { getCurrentUserContext } from "@/lib/serverAuth";
import { toClientTitle } from "@/lib/tableTitle";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [data, userContext] = await Promise.all([getDashboardData(), getCurrentUserContext()]);
  const role = String(userContext.user?.role ?? "");
  const canDelete = role === "Admin" || role === "Supervisor";
  const canCreate = role === "Admin" || role === "Supervisor" || role === "Operations Supervisor";
  const attention = slimAttention(buildAdminAttentionDashboard(data.titles, userContext.user));
  const previewTitles = data.titles.slice(0, 25);
  const firstName = (userContext.user?.name ?? "").split(" ")[0];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">{todayLabel()}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[0] text-ink">{firstName ? `Hi ${firstName}` : "Production Overview"}</h1>
          <p className="mt-1 text-sm text-black/60">
            {data.titles.length.toLocaleString("en-IN")} titles tracked. Here is what needs attention first.
          </p>
          {data.setupWarning ? (
            <p className="mt-3 rounded-md border border-amberline/30 bg-[#fff8ec] px-3 py-2 text-sm font-medium text-amberline">
              {data.setupWarning}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link href="/titles" className="focus-ring inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-moss hover:text-moss">
            <List size={16} /> All Titles
          </Link>
          {canCreate ? (
            <Link href="/titles/new" className="focus-ring inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-moss hover:text-moss">
              <Plus size={16} /> New Title
            </Link>
          ) : null}
          {role === "Admin" || role === "Supervisor" ? (
            <Link href="/titles/import-approved" className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-moss">
              <Upload size={16} /> Import Approved
            </Link>
          ) : null}
        </div>
      </section>

      <AdminAttentionDashboard attention={attention} />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">Pipeline at a glance</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {data.cards.map((card) => (
            <DashboardCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      <FreshStartSections titles={data.titles} />

      <SupervisorBreakdown supervisors={data.supervisorSummary} />
      <OperationsQueue queue={data.operationsQueue} />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Recently updated titles</h2>
            <p className="mt-1 text-sm text-black/55">The 25 most recently touched titles. Open All Titles for the full list.</p>
          </div>
          <Link href="/titles" className="text-sm font-semibold text-moss hover:underline">
            View all
          </Link>
        </div>
        <TitleTable titles={previewTitles.length > 0 ? previewTitles : data.titles} canDelete={canDelete} />
      </section>

      <DailyReportBox report={data.dailyReport} />

      {role === "Admin" ? (
        <section className="flex flex-col gap-3 rounded-lg border border-dashed border-black/15 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-black/55">Old Google Sheets are archive-only. Import a reference copy if you need to look something up.</p>
          <SyncButton />
        </section>
      ) : null}
    </div>
  );
}

/**
 * The attention widget only shows 30 rows per card and 10 danger items, but it used to
 * receive every matching title with all nested data. Trim before sending to the browser.
 */
function slimAttention(attention: AttentionData): AttentionData {
  return {
    ...attention,
    cards: attention.cards.map((card) => ({
      ...card,
      titles: card.titles.slice(0, 30).map((item) => ({ ...item, title: toClientTitle(item.title) }))
    })),
    topDangerousItems: attention.topDangerousItems.map((item) => ({ ...item, title: toClientTitle(item.title) }))
  };
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(new Date());
}
