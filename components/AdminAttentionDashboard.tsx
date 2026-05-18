"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import type { AdminAttentionDashboard as AttentionDashboardData, AttentionSeverity } from "@/lib/adminAttention";

type Props = {
  attention: AttentionDashboardData;
};

const severityClass: Record<AttentionSeverity, string> = {
  critical: "border-red-400 bg-red-50 text-red-950 shadow-[0_0_0_1px_rgba(248,113,113,0.18)]",
  high: "border-orange-300 bg-orange-50 text-orange-950",
  medium: "border-amber-300 bg-amber-50 text-amber-950",
  low: "border-black/10 bg-white text-ink"
};

const severityDot: Record<AttentionSeverity, string> = {
  critical: "bg-red-600",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-slate-400"
};

export function AdminAttentionDashboard({ attention }: Props) {
  const firstNonEmpty = useMemo(
    () => attention.cards.find((card) => card.count > 0)?.key ?? attention.cards[0]?.key ?? "",
    [attention.cards]
  );
  const [activeKey, setActiveKey] = useState(firstNonEmpty);
  const activeCard = attention.cards.find((card) => card.key === activeKey) ?? attention.cards[0];

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-black/10 bg-[#101812] p-5 text-white shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-200">Attention Command Center</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-[0]">Needs Attention Today</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
              {attention.roleView === "supervisor"
                ? "Filtered to your assigned titles so the urgent work is not buried."
                : attention.roleView === "operations"
                  ? "Production-focused risks for submitted scripts, assignments, and completion blockers."
                  : "Owner view across all supervisors, channels, and production stages."}
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white/80">
            Tracking {attention.scopedTitleCount} active title records
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {attention.cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => setActiveKey(card.key)}
            className={clsx(
              "focus-ring rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft",
              severityClass[card.severity],
              card.severity === "critical" && card.count > 0 && "animate-pulse",
              activeKey === card.key && "ring-2 ring-ink/20"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-3xl font-semibold">{card.count}</div>
                <div className="mt-2 text-sm font-semibold">{card.label}</div>
              </div>
              <span className={clsx("mt-1 h-3 w-3 rounded-full", severityDot[card.severity])} />
            </div>
            <p className="mt-3 text-sm leading-5 opacity-75">{card.description}</p>
          </button>
        ))}
      </div>

      {activeCard ? (
        <section className="rounded-lg border border-black/10 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-black/10 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-ink">{activeCard.label}</h3>
              <p className="mt-1 text-sm text-black/60">{activeCard.description}</p>
            </div>
            <Link
              href={activeCard.titleHref}
              className="focus-ring rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-moss hover:text-moss"
            >
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] divide-y divide-black/10 text-left text-sm">
              <thead className="bg-[#eef1eb] text-xs uppercase text-black/55">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Supervisor</th>
                  <th className="px-4 py-3">Writer</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Delay</th>
                  <th className="px-4 py-3">Freshness</th>
                  <th className="px-4 py-3">Next Action</th>
                  <th className="px-4 py-3">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {activeCard.titles.slice(0, 30).map((item) => (
                  <tr key={item.title.id} className="align-top hover:bg-[#faf9f5]">
                    <td className="max-w-sm px-4 py-3 font-semibold text-ink">
                      <Link href={`/titles/${item.title.id}?return=${encodeURIComponent("/")}`} className="hover:text-moss hover:underline">
                        {item.title.title}
                      </Link>
                      <div className="mt-1 text-xs font-medium text-danger">{item.problem}</div>
                    </td>
                    <td className="px-4 py-3 text-black/65">{item.title.channel}</td>
                    <td className="px-4 py-3 text-black/65">{item.title.supervisor}</td>
                    <td className="px-4 py-3 text-black/65">{item.title.writer}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={item.title.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={item.title.status} /></td>
                    <td className="px-4 py-3 text-black/65">{item.title.writerDueDate || "Not set"}</td>
                    <td className="px-4 py-3 text-black/65">{item.delayInfo}</td>
                    <td className="px-4 py-3"><FreshnessBadge label={item.freshness} /></td>
                    <td className="max-w-xs px-4 py-3 text-black/65">{item.title.nextAction}</td>
                    <td className="px-4 py-3">
                      <Link href={`/titles/${item.title.id}?return=${encodeURIComponent("/")}`} className="font-semibold text-moss hover:underline">
                        Open Title
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {activeCard.titles.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-black/55">Nothing in this risk bucket right now.</div>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <h3 className="text-xl font-semibold text-ink">Top 10 Most Dangerous Items Right Now</h3>
          <div className="mt-4 space-y-3">
            {attention.topDangerousItems.map((item, index) => (
              <div key={item.title.id} className={clsx("rounded-lg border p-3", severityClass[item.severity])}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase opacity-60">#{index + 1} | {item.problem}</div>
                    <Link href={`/titles/${item.title.id}?return=${encodeURIComponent("/")}`} className="mt-1 block font-semibold text-ink hover:text-moss hover:underline">
                      {item.title.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <PriorityBadge priority={item.title.priority} />
                      <StatusBadge status={item.title.status} />
                      <FreshnessBadge label={item.freshness} />
                    </div>
                  </div>
                  <Link href={`/titles/${item.title.id}?return=${encodeURIComponent("/")}`} className="focus-ring rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-moss">
                    Open
                  </Link>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-black/65 md:grid-cols-3">
                  <span>Supervisor: {item.title.supervisor}</span>
                  <span>Delay: {item.delayInfo}</span>
                  <span>Next: {item.title.nextAction}</span>
                </div>
              </div>
            ))}
            {attention.topDangerousItems.length === 0 ? <p className="text-sm text-black/55">No dangerous items found.</p> : null}
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <h3 className="text-xl font-semibold text-ink">Today's Required Actions</h3>
            <div className="mt-4 space-y-2">
              {attention.todaysRequiredActions.map((action) => (
                <button
                  key={`${action.cardKey}-${action.label}`}
                  type="button"
                  onClick={() => setActiveKey(action.cardKey)}
                  className={clsx("focus-ring flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-semibold", severityClass[action.severity])}
                >
                  <span>{action.label}</span>
                  <span>{action.count}</span>
                </button>
              ))}
              {attention.todaysRequiredActions.length === 0 ? <p className="text-sm text-black/55">No required actions are currently flagged.</p> : null}
            </div>
          </section>

          <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <h3 className="text-xl font-semibold text-ink">Supervisor Risk Snapshot</h3>
            <div className="mt-4 space-y-3">
              {attention.supervisorRiskSnapshot.map((supervisor) => (
                <Link
                  key={supervisor.name}
                  href={`/titles?supervisor=${encodeURIComponent(supervisor.name)}`}
                  className="block rounded-lg border border-black/10 p-3 transition hover:border-moss hover:bg-[#faf9f5]"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-ink">{supervisor.name}</div>
                    <div className="text-xs font-semibold text-black/45">{supervisor.total} titles</div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-black/65">
                    <Risk label="Ultra" value={supervisor.ultraUrgent} />
                    <Risk label="Delayed" value={supervisor.delayed} />
                    <Risk label="Overdue" value={supervisor.overdueScripts} />
                    <Risk label="Blocked" value={supervisor.blocked} />
                    <Risk label="No update 48h" value={supervisor.stale48} />
                    <Risk label="No writer" value={supervisor.missingWriter} />
                    <Risk label="No help doc" value={supervisor.missingHelpDoc} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </section>
  );
}

function Risk({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center justify-between rounded-md bg-[#f6f4ee] px-2 py-1">
      <span>{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </span>
  );
}
