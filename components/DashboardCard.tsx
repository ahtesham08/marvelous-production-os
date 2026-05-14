import clsx from "clsx";

type DashboardCardProps = {
  label: string;
  value: number;
  tone?: "neutral" | "warning" | "danger" | "success";
};

const toneClass = {
  neutral: "border-black/10 bg-white",
  warning: "border-amberline/30 bg-[#fff8ec]",
  danger: "border-danger/30 bg-[#fff0ef]",
  success: "border-emerald-700/25 bg-[#eef8f0]"
};

export function DashboardCard({ label, value, tone = "neutral" }: DashboardCardProps) {
  return (
    <section className={clsx("rounded-lg border p-4 shadow-sm", toneClass[tone])}>
      <div className="text-3xl font-semibold text-ink">{value}</div>
      <div className="mt-2 text-sm font-medium text-black/65">{label}</div>
    </section>
  );
}
