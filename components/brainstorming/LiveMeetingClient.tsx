"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, FilePlus, MessageSquare, X } from "lucide-react";
import { BrainstormingStatusBadge } from "@/components/brainstorming/BrainstormingStatusBadge";
import { BRAINSTORMING_DECISIONS, PRIORITIES, buildBrainstormingReport } from "@/lib/sharedConstants";
import type { BrainstormingSession, BrainstormingTitle } from "@/lib/types";

export function LiveMeetingClient({ session, titles, canDecide }: { session: BrainstormingSession; titles: BrainstormingTitle[]; canDecide: boolean }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [localTitles, setLocalTitles] = useState(titles);
  const [approvalSettings, setApprovalSettings] = useState(() => buildApprovalSettings(titles));

  useEffect(() => {
    setLocalTitles(titles);
    setApprovalSettings((current) => ({ ...buildApprovalSettings(titles), ...current }));
  }, [titles]);

  const grouped = useMemo(() => {
    const map = new Map<string, BrainstormingTitle[]>();
    for (const title of localTitles) {
      const key = title.supervisor || title.submitted_by_name || "Unassigned";
      map.set(key, [...(map.get(key) ?? []), title]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [localTitles]);
  const report = buildBrainstormingReport(session, localTitles);

  async function patchTitle(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    const response = await fetch(`/api/brainstorming/titles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setBusyId(null);
    if (!response.ok) {
      const payload = await response.json();
      alert(payload.error || "Update failed.");
      return;
    }
    const payload = await response.json();
    const updatedTitle = payload.brainstormingTitle ?? payload.title;
    if (updatedTitle?.session_id !== undefined) {
      setLocalTitles((current) => current.map((title) => (title.id === id ? updatedTitle : title)));
      setApprovalSettings((current) => ({
        ...current,
        [id]: {
          urgency: updatedTitle.urgency || updatedTitle.priority || "Normal",
          dueDate: updatedTitle.approved_due_date || ""
        }
      }));
    } else {
      router.refresh();
    }
  }

  async function copyReport() {
    await navigator.clipboard.writeText(report);
  }

  function updateApprovalSetting(id: string, patch: Partial<ApprovalSetting>) {
    setApprovalSettings((current) => ({
      ...current,
      [id]: { ...(current[id] ?? { urgency: "Normal", dueDate: "" }), ...patch }
    }));
  }

  function decide(title: BrainstormingTitle, decision: string) {
    const reason = window.prompt(decision === "Approve" ? "Approval note (optional)" : `Reason for: ${decision}`, title.decision_reason ?? "");
    if (reason === null) return;
    const setting = approvalSettings[title.id] ?? { urgency: title.urgency || title.priority || "Normal", dueDate: title.approved_due_date || "" };
    patchTitle(title.id, { action: "decision", decision, reason, urgency: setting.urgency, dueDate: setting.dueDate });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-ink">{session.name}</h2>
              <BrainstormingStatusBadge status={session.status} />
            </div>
            <p className="mt-1 text-sm text-black/60">{session.session_date} | {(session.participants ?? []).join(", ") || "No participants listed"}</p>
          </div>
          <button type="button" onClick={copyReport} className="focus-ring inline-flex items-center gap-2 rounded-md border border-black/10 px-3 py-2 text-sm font-semibold text-moss hover:border-moss">
            <Copy size={16} />
            Copy Session Report
          </button>
        </div>
      </section>

      {grouped.map(([supervisor, items]) => (
        <section key={supervisor} className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-ink">{supervisor}</h2>
            <span className="rounded-md bg-[#eef1eb] px-2 py-1 text-xs font-semibold text-moss">{items.length} titles</span>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {items.map((title) => (
              <article key={title.id} className="rounded-lg border border-black/10 bg-[#f6f4ee] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-ink">{title.title}</h3>
                    <p className="mt-1 text-sm text-black/60">
                      {title.channel || "MV N"} | {title.urgency || title.priority || "Normal"} | Due: {title.approved_due_date || "Not set"} | Writer: {title.suggested_writer || "Optional"}
                    </p>
                  </div>
                  <BrainstormingStatusBadge status={title.status} />
                </div>

                {title.duplicate_warning ? <p className="mt-3 rounded-md bg-[#fff8ec] px-3 py-2 text-sm font-semibold text-amberline">{title.duplicate_warning}</p> : null}
                <Info label="Pitch" value={title.short_pitch} />
                <Info label="Why it is good" value={title.why_good} />
                <Info label="References" value={title.reference_links} />
                <Info label="Ahtesham notes" value={title.ahtesham_notes} />

                {canDecide ? (
                  <>
                    <div className="mt-4 grid gap-3 rounded-md border border-black/10 bg-white p-3 md:grid-cols-2">
                      <label>
                        <span className="text-xs font-semibold uppercase text-black/50">Due date for approved title</span>
                        <input
                          type="date"
                          className="field-input mt-1"
                          value={approvalSettings[title.id]?.dueDate ?? title.approved_due_date ?? ""}
                          onChange={(event) => updateApprovalSetting(title.id, { dueDate: event.target.value })}
                        />
                      </label>
                      <label>
                        <span className="text-xs font-semibold uppercase text-black/50">Urgency</span>
                        <select
                          className="field-input mt-1"
                          value={approvalSettings[title.id]?.urgency ?? title.urgency ?? title.priority ?? "Normal"}
                          onChange={(event) => updateApprovalSetting(title.id, { urgency: event.target.value })}
                        >
                          {PRIORITIES.map((priority) => (
                            <option key={priority} value={priority}>{priority}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      {BRAINSTORMING_DECISIONS.map((decision) => (
                        <button
                          key={decision}
                          type="button"
                          disabled={busyId === title.id}
                          onClick={() => decide(title, decision)}
                          className="focus-ring rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-moss hover:text-moss disabled:opacity-60"
                        >
                          {decision}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const noteText = window.prompt("Add discussion note");
                      if (noteText) patchTitle(title.id, { action: "note", noteText });
                    }}
                    className="focus-ring inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-moss hover:border-moss"
                  >
                    <MessageSquare size={15} />
                    Add Note
                  </button>
                  {canDecide ? (
                    <button
                      type="button"
                      onClick={() => {
                        const ahteshamNotes = window.prompt("Ahtesham notes", title.ahtesham_notes ?? "");
                        const discussionSummary = window.prompt("Discussion summary", title.discussion_summary ?? "");
                        patchTitle(title.id, { action: "meeting-notes", ahteshamNotes, discussionSummary });
                      }}
                      className="focus-ring inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-moss hover:border-moss"
                    >
                      <Check size={15} />
                      Save Meeting Notes
                    </button>
                  ) : null}
                  {title.status === "Proposed" ? (
                    <button
                      type="button"
                      onClick={() => {
                        const nextTitle = window.prompt("Edit title", title.title);
                        if (!nextTitle) return;
                        const shortPitch = window.prompt("Short pitch", title.short_pitch ?? "");
                        const whyGood = window.prompt("Why this title is good", title.why_good ?? "");
                        patchTitle(title.id, { action: "proposal", title: nextTitle, shortPitch, whyGood });
                      }}
                      className="focus-ring inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-moss hover:border-moss"
                    >
                      <Check size={15} />
                      Edit Proposal
                    </button>
                  ) : null}
                  {canDecide && title.status === "Approved" && !title.converted_title_id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const setting = approvalSettings[title.id] ?? { urgency: title.urgency || title.priority || "Normal", dueDate: title.approved_due_date || "" };
                          patchTitle(title.id, { action: "decision", decision: "Approve", reason: title.decision_reason, urgency: setting.urgency, dueDate: setting.dueDate });
                        }}
                        className="focus-ring inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-moss hover:border-moss"
                      >
                        <Check size={15} />
                        Save Approval Details
                      </button>
                      <button
                        type="button"
                        onClick={() => patchTitle(title.id, { action: "convert" })}
                        className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-moss"
                      >
                        <FilePlus size={15} />
                        Create Production Title
                      </button>
                    </>
                  ) : null}
                  {title.converted_title_id ? (
                    <a className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800" href={`/titles/${title.converted_title_id}`}>
                      <Check size={15} />
                      Converted
                    </a>
                  ) : null}
                </div>

                <div className="mt-4 space-y-2">
                  {(title.brainstorming_discussion_notes ?? []).map((note) => (
                    <div key={note.id} className="rounded-md bg-white p-3 text-sm">
                      <div className="font-medium text-ink">{note.note_text}</div>
                      <div className="mt-1 text-xs text-black/50">{note.author_name || "Team"} | {note.created_at ? new Date(note.created_at).toLocaleString() : ""}</div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
      {localTitles.length === 0 ? (
        <section className="rounded-lg border border-black/10 bg-white p-8 text-center">
          <X className="mx-auto text-black/40" />
          <p className="mt-2 text-sm text-black/55">No titles in this session yet. Use supervisor submit or WhatsApp import.</p>
        </section>
      ) : null}
    </div>
  );
}

type ApprovalSetting = {
  urgency: string;
  dueDate: string;
};

function buildApprovalSettings(titles: BrainstormingTitle[]) {
  return Object.fromEntries(
    titles.map((title) => [
      title.id,
      {
        urgency: title.urgency || title.priority || "Normal",
        dueDate: title.approved_due_date || ""
      }
    ])
  ) as Record<string, ApprovalSetting>;
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="mt-3">
      <div className="text-xs font-semibold uppercase text-black/45">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-black/70">{value}</div>
    </div>
  );
}
