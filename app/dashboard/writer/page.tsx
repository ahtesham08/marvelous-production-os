import { QueueTable } from "@/components/mvp3/QueueTable";
import { getDashboardData } from "@/lib/dashboardData";

export const dynamic = "force-dynamic";

export default async function WriterDashboard() {
  const data = await getDashboardData();
  const titles = data.titles.filter((title) => title.writer !== "Missing" && !["Completed", "Cancelled"].includes(title.status));
  return <RolePage label="Writer Dashboard" title="Assigned Scripts" titles={titles} />;
}

function RolePage({ label, title, titles }: { label: string; title: string; titles: Parameters<typeof QueueTable>[0]["titles"] }) {
  return (
    <div className="space-y-5">
      <div><p className="text-sm font-semibold uppercase text-moss">{label}</p><h1 className="mt-1 text-3xl font-semibold text-ink">{title}</h1></div>
      <QueueTable titles={titles} />
    </div>
  );
}
