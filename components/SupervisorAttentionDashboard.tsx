"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import type {
  SupervisorAttentionDashboard as SupervisorAttentionData,
  SupervisorAttentionItem,
  SupervisorSeverity,
  WriterFollowUp
} from "@/lib/supervisorAttention";

type Props = {
  attention: SupervisorAttentionData;
  canMarkReviewed: boolean;
};

const severityClass: Record<SupervisorSeverity, string> = {
  critical: "border-red-400 bg-red-50 text-red-950 shadow-[0_0_0_1px_rgba(248,113,113,0.18)]",
  high: "border-orange-300 bg-orange-50 text-orange-950",
  medium: "border-amber-300 bg-amber-50 text-amber-950",
  low: "border-black/10 bg-white text-ink"
};

const dotClass: Record<SupervisorSeverity, string> = {
  critical: "bg-red-600",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-slate-400"
};

export function SupervisorAttentionDashboard({ attention, canMarkReviewed }: Props) {
  const firstNonEmpty = useMemo(
    () => attention.cards.find((card) => card.count > 0)?.key ?? attention.cards[0]?.key ?? "",
    [attention.cards]
  );
  const [activeKey, setActiveKey] = useState(firstNonEmpty);
  const [writerQueue, setWriterQueue] = useState<WriterFollowUp | null>(null);
  const [review, setReview] = useState(attention.review);
  const [reviewing, setReviewing] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const activeCard = attention.cards.find((card) => card.key === activeKey) ?? attention.cards[0];

  async function markReviewed() {
    setReviewing(true);
    const response = await fetch("/api/supervisor-dashboard-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supervisorName: attention.supervisorName })
    });
    const payload = await response.json().catch(() => ({}));
    setReviewing(false);
    if (!response.ok) {
      alert(payload.error || "Could not mark this dashboard reviewed.");
      return;
    }
    setReview(payload.review);
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(attention.copyableSupervisorReport);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-black/10 bg-[#101812] p-5 text-white shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-200">Supervisor Dashboard</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-[0]">My Attention Command Center</h2>
            <p className="mt-2 text-sm text-white/70">What needs your attention today | {attention.supervisorName}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white/80">
              {review.reviewedAt ? `Last reviewed ${formatTime(review.reviewedAt)} by ${review.reviewedBy || attention.supervisorName}` : "Not reviewed today"}
            </div>
            {canMarkReviewed ? (
              <button
                type="button"
                onClick={markReviewed}
                disabled={reviewing}
                className="focus-ring rounded-md bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-emerald-100 disabled:opacity-60"
              >
                {reviewing ? "Marking" : "Mark My Dashboard Reviewed Today"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={copyReport}
              className="focus-ring rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy Failed" : "Copy My Pending Work Report"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {attention.cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => {
              setActiveKey(card.key);
              setWriterQueue(null);
            }}
            className={clsx(
              "focus-ring rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft",
              severityClass[card.severity],
              card.severity === "critical" && card.count > 0 && "animate-pulse",
              activeKey === card.key && !writerQueue && "ring-2 ring-ink/20"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-3xl font-semibold">{card.count}</div>
                <div className="mt-2 text-sm font-semibold">{card.label}</div>
              </div>
              <span className={clsx("mt-1 h-3 w-3 rounded-full", dotClass[card.severity])} />
            </div>
            <p className="mt-3 text-sm leading-5 opacity-75">{card.description}</p>
          </button>
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <TitleList
          title={writerQueue ? `${writerQueue.writer} Writer Follow-Up` : activeCard?.label ?? "Selected Titles"}
          subtitle={writerQueue ? `${writerQueue.activeTitles} active titles under ${attention.supervisorName}` : activeCard?.description ?? ""}
          items={writerQueue ? writerQueue.items : activeCard?.items ?? []}
        />

        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <h3 className="text-xl font-semibold text-ink">What You Must Do Today</h3>
          <div className="mt-4 space-y-2">
            {attention.todaysActionChecklist.map((action) => (
              <button
                key={`${action.cardKey}-${action.label}`}
                type="button"
                onClick={() => {
                  setActiveKey(action.cardKey);
                  setWriterQueue(null);
                }}
                className={clsx("focus-ring flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-semibold", severityClass[action.severity])}
              >
                <span>{action.label}</span>
                <span>{action.count}</span>
              </button>
            ))}
            {attention.todaysActionChecklist.length === 0 ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                Nothing urgent is flagged for you right now. Keep the board updated and watch due dates.
              </div>
            ) : null}
          </div>
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <h3 className="text-xl font-semibold text-ink">My Top 10 Most Dangerous Titles Right Now</h3>
          <div className="mt-4 space-y-3">
            {attention.topDangerousTitles.map((item, index) => (
              <div key={item.id} className={clsx("rounded-lg border p-3", severityClass[item.severity])}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase opacity-60">#{index + 1} | {item.problem}</div>
                    <Link href={item.href} className="mt-1 block font-semibold text-ink hover:text-moss hover:underline">
                      {item.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <PriorityBadge priority={item.priority} />
                      <StatusBadge status={item.status} />
                      <span className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-black/65">{item.lastUpdated}</span>
                    </div>
                  </div>
                  <Link href={item.href} className="focus-ring rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-moss">
                    Open
                  </Link>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-black/65 md:grid-cols-3">
                  <span>Writer: {item.writer}</span>
                  <span>Delay: {item.daysLate > 0 ? `${item.daysLate}d late` : "On watch"}</span>
                  <span>Next: {item.nextAction}</span>
                </div>
              </div>
            ))}
            {attention.topDangerousTitles.length === 0 ? <p className="text-sm text-black/55">No dangerous titles found.</p> : null}
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <h3 className="text-xl font-semibold text-ink">Writer Follow-Up Queue</h3>
          <div className="mt-4 space-y-2">
            {attention.writerFollowUpQueue.map((writer) => (
              <button
                key={writer.writer}
                type="button"
                onClick={() => setWriterQueue(writer)}
                className={clsx(
                  "focus-ring w-full rounded-lg border p-3 text-left transition hover:border-moss hover:bg-[#faf9f5]",
                  writer.followUpNeeded ? "border-orange-200 bg-orange-50" : "border-black/10 bg-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-ink">{writer.writer}</div>
                  <div className={clsx("text-xs font-semibold", writer.followUpNeeded ? "text-danger" : "text-black/45")}>
                    {writer.followUpNeeded ? "Follow-up needed" : "On track"}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-black/65">
                  <Metric label="Active" value={writer.activeTitles} />
                  <Metric label="Due Today" value={writer.dueToday} />
                  <Metric label="Overdue" value={writer.overdueTitles} />
                  <Metric label="Oldest" value={writer.oldestPendingTitle} />
                </div>
              </button>
            ))}
            {attention.writerFollowUpQueue.length === 0 ? <p className="text-sm text-black/55">No assigned writers in your active queue yet.</p> : null}
          </div>
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <h3 className="text-xl font-semibold text-ink">Titles Not Properly Set Up</h3>
          <div className="mt-4 space-y-2">
            {attention.missingSetupQueue.map(({ item, missing }) => (
              <div key={item.id} className="rounded-lg border border-black/10 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link href={item.href} className="font-semibold text-ink hover:text-moss hover:underline">{item.title}</Link>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {missing.map((field) => (
                        <span key={field} className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                          Missing {field}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link href={item.href} className="text-sm font-semibold text-moss hover:underline">Open Title</Link>
                </div>
              </div>
            ))}
            {attention.missingSetupQueue.length === 0 ? <p className="text-sm text-black/55">All visible titles have the basic setup fields.</p> : null}
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <h3 className="text-xl font-semibold text-ink">Waiting For Ahtesham</h3>
          <div className="mt-4 space-y-2">
            {attention.waitingForAhteshamQueue.map((item) => (
              <div key={`${item.source}-${item.id}`} className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link href={item.href} className="font-semibold text-ink hover:text-moss hover:underline">{item.title}</Link>
                    <div className="mt-1 text-sm text-black/65">{item.problem}</div>
                    <div className="mt-1 text-xs text-black/50">Flagged: {item.lastUpdated}</div>
                  </div>
                  <PriorityBadge priority={item.priority} />
                </div>
              </div>
            ))}
            {attention.waitingForAhteshamQueue.length === 0 ? <p className="text-sm text-black/55">Nothing is waiting for Ahtesham right now.</p> : null}
          </div>
        </section>
      </section>
    </section>
  );
}

function TitleList({ title, subtitle, items }: { title: string; subtitle: string; items: SupervisorAttentionItem[] }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/10 p-4">
        <h3 className="text-xl font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm text-black/60">{subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[980px] divide-y divide-black/10 text-left text-sm">
          <thead className="bg-[#eef1eb] text-xs uppercase text-black/55">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Writer</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Delay</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3">Next Action</th>
              <th className="px-4 py-3">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {items.slice(0, 30).map((item) => (
              <tr key={`${item.source}-${item.id}`} className="align-top hover:bg-[#faf9f5]">
                <td className="max-w-sm px-4 py-3 font-semibold text-ink">
                  <Link href={item.href} className="hover:text-moss hover:underline">{item.title}</Link>
                  <div className="mt-1 text-xs text-danger">{item.problem}</div>
                </td>
                <td className="px-4 py-3 text-black/65">{item.channel}</td>
                <td className="px-4 py-3 text-black/65">{item.writer}</td>
                <td className="px-4 py-3"><PriorityBadge priority={item.priority} /></td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3 text-black/65">{item.dueDate || "Not set"}</td>
                <td className="px-4 py-3 text-black/65">{item.daysLate > 0 ? `${item.daysLate}d late` : item.problem}</td>
                <td className="px-4 py-3 text-black/65">{item.lastUpdated}</td>
                <td className="max-w-xs px-4 py-3 text-black/65">{item.nextAction}</td>
                <td className="px-4 py-3"><Link href={item.href} className="font-semibold text-moss hover:underline">Open Title</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 ? <div className="px-4 py-8 text-center text-sm text-black/55">Nothing in this bucket right now.</div> : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="flex items-center justify-between rounded-md bg-white/70 px-2 py-1">
      <span>{label}</span>
      <span className="ml-2 max-w-[180px] truncate font-semibold text-ink">{value}</span>
    </span>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
}
