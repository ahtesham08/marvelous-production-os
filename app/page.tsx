import { DashboardCard } from "@/components/DashboardCard";
import { DailyReportBox } from "@/components/DailyReportBox";
import { FreshStartSections } from "@/components/FreshStartSections";
import { OperationsQueue } from "@/components/OperationsQueue";
import { SupervisorBreakdown } from "@/components/SupervisorBreakdown";
import { SyncButton } from "@/components/SyncButton";
import { TitleTable } from "@/components/TitleTable";
import { getDashboardData } from "@/lib/dashboardData";
import { getCurrentUserContext } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [data, userContext] = await Promise.all([getDashboardData(), getCurrentUserContext()]);
  const canDelete = userContext.user?.role === "Admin" || userContext.user?.role === "Supervisor";
  const previewTitles = data.titles.slice(0, 25);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">Owner Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[0] text-ink">Marvelous Production OS</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-black/65">
            Fresh Start Mode: new approved brainstorming titles are created here. Old Google Sheets are archive-only.
          </p>
          {data.setupWarning ? (
            <p className="mt-3 rounded-md border border-amberline/30 bg-[#fff8ec] px-3 py-2 text-sm font-medium text-amberline">
              {data.setupWarning}
            </p>
          ) : null}
        </div>
        <SyncButton />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.cards.map((card) => (
          <DashboardCard key={card.label} {...card} />
        ))}
      </section>

      <FreshStartSections titles={data.titles} />

      <SupervisorBreakdown supervisors={data.supervisorSummary} />
      <OperationsQueue queue={data.operationsQueue} />

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Main Title Table</h2>
          <p className="mt-1 text-sm text-black/55">Showing the highest-risk titles first.</p>
        </div>
        <TitleTable titles={previewTitles.length > 0 ? previewTitles : data.titles} canDelete={canDelete} />
      </section>

      <DailyReportBox report={data.dailyReport} />
    </div>
  );
}
