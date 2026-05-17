"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, MessageSquare, X } from "lucide-react";
import { BrainstormingStatusBadge } from "@/components/brainstorming/BrainstormingStatusBadge";
import { BRAINSTORMING_DECISIONS, FRESH_START_CHANNELS, PRIORITIES, buildBrainstormingReport } from "@/lib/sharedConstants";
import type { BrainstormingSession, BrainstormingTitle } from "@/lib/types";

export function LiveMeetingClient({
  session,
  titles,
  canDecide,
  canEdit
}: {
  session: BrainstormingSession;
  titles: BrainstormingTitle[];
  canDecide: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [localSession, setLocalSession] = useState(session);
  const [sessionName, setSessionName] = useState(session.name);
  const [renaming, setRenaming] = useState(false);
  const [localTitles, setLocalTitles] = useState(titles);
  const [approvalSettings, setApprovalSettings] = useState(() => buildApprovalSettings(titles));
  const [supervisorFilter, setSupervisorFilter] = useState("All");

  useEffect(() => {
    setLocalSession(session);
    setSessionName(session.name);
    setLocalTitles(titles);
    setApprovalSettings((current) => ({ ...buildApprovalSettings(titles), ...current }));
  }, [session, titles]);

  const grouped = useMemo(() => {
    const map = new Map<string, BrainstormingTitle[]>();
    for (const title of getVisibleTitles(localTitles, supervisorFilter)) {
      const key = title.supervisor || title.submitted_by_name || "Unassigned";
      map.set(key, [...(map.get(key) ?? []), title]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [localTitles, supervisorFilter]);
  const supervisors = useMemo(
    () => Array.from(new Set(localTitles.map((title) => title.supervisor || title.submitted_by_name || "Unassigned"))).sort(),
    [localTitles]
  );
  const dormantHoldCount = localTitles.filter(isDormantHold).length;
  const report = buildBrainstormingReport(localSession, localTitles);

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
          channel: updatedTitle.channel || "MV N",
          dueDate: updatedTitle.approved_due_date || "",
          expectedWordCount: updatedTitle.expected_word_count ? String(updatedTitle.expected_word_count) : "",
          holdUntilDate: updatedTitle.hold_until_date || "",
          titleText: updatedTitle.title,
          directives: updatedTitle.ahtesham_notes || ""
        }
      }));
    } else {
      router.refresh();
    }
  }

  async function copyReport() {
    await navigator.clipboard.writeText(report);
  }

  async function saveSessionName() {
    const nextName = sessionName.trim();
    if (!nextName) return;
    setRenaming(true);
    const response = await fetch("/api/brainstorming/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: localSession.id, name: nextName })
    });
    const payload = await response.json();
    setRenaming(false);
    if (!response.ok) {
      alert(payload.error || "Could not rename session.");
      return;
    }
    setLocalSession(payload.session);
    setSessionName(payload.session.name);
  }

  function updateApprovalSetting(id: string, patch: Partial<ApprovalSetting>) {
    setApprovalSettings((current) => ({
      ...current,
      [id]: { ...(current[id] ?? buildApprovalSetting(localTitles.find((title) => title.id === id))), ...patch }
    }));
  }

  function decide(title: BrainstormingTitle, decision: string) {
    const reason = window.prompt(decision === "Approve" ? "Approval note (optional)" : `Reason for: ${decision}`, title.decision_reason ?? "");
    if (reason === null) return;
    const setting = approvalSettings[title.id] ?? buildApprovalSetting(title);
    patchTitle(title.id, {
      action: "decision",
      decision,
      reason,
      channel: setting.channel,
      urgency: setting.urgency,
      dueDate: setting.dueDate,
      expectedWordCount: setting.expectedWordCount,
      holdUntilDate: setting.holdUntilDate,
      titleText: setting.titleText,
      directives: setting.directives,
      supervisor: title.supervisor || title.submitted_by_name,
      suggestedWriter: title.suggested_writer,
      referenceLinks: title.reference_links,
      notes: title.notes,
      discussionSummary: title.discussion_summary
    });
  }

  function saveReviewFields(title: BrainstormingTitle) {
    const setting = approvalSettings[title.id] ?? buildApprovalSetting(title);
    patchTitle(title.id, {
      action: "approval-fields",
      channel: setting.channel,
      urgency: setting.urgency,
      dueDate: setting.dueDate,
      expectedWordCount: setting.expectedWordCount,
      holdUntilDate: setting.holdUntilDate
    });
  }

  function saveTitleText(title: BrainstormingTitle) {
    const setting = approvalSettings[title.id] ?? buildApprovalSetting(title);
    if (!setting.titleText.trim()) return;
    patchTitle(title.id, { action: "proposal", title: setting.titleText, channel: setting.channel });
  }

  function saveDirectives(title: BrainstormingTitle) {
    const setting = approvalSettings[title.id] ?? buildApprovalSetting(title);
    patchTitle(title.id, { action: "meeting-notes", ahteshamNotes: setting.directives, discussionSummary: title.discussion_summary ?? "" });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-ink">{localSession.name}</h2>
              <BrainstormingStatusBadge status={localSession.status} />
            </div>
            <p className="mt-1 text-sm text-black/60">{localSession.session_date} | {(localSession.participants ?? []).join(", ") || "No participants listed"}</p>
          </div>
          <div className="flex flex-col gap-2 sm:min-w-[360px]">
            {canDecide ? (
              <div className="flex gap-2">
                <input
                  className="field-input"
                  value={sessionName}
                  onChange={(event) => setSessionName(event.target.value)}
                  aria-label="Session name"
                />
                <button
                  type="button"
                  onClick={saveSessionName}
                  disabled={renaming || sessionName.trim() === localSession.name}
                  className="focus-ring whitespace-nowrap rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-moss disabled:opacity-60"
                >
                  {renaming ? "Saving" : "Save Name"}
                </button>
              </div>
            ) : null}
            <button type="button" onClick={copyReport} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-black/10 px-3 py-2 text-sm font-semibold text-moss hover:border-moss">
              <Copy size={16} />
              Copy Session Report
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="md:w-72">
            <span className="text-xs font-semibold uppercase text-black/50">Supervisor Filter</span>
            <select className="field-input mt-1" value={supervisorFilter} onChange={(event) => setSupervisorFilter(event.target.value)}>
              <option value="All">All Supervisors</option>
              {supervisors.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <div className="rounded-md bg-[#eef1eb] px-3 py-2 text-sm font-semibold text-moss">
            Showing {supervisorFilter === "All" ? "all supervisors" : supervisorFilter}
            {dormantHoldCount > 0 ? ` | ${dormantHoldCount} held until later` : ""}
          </div>
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
              <article key={title.id} className={isResurfacedHold(title) ? "rounded-lg border border-amberline bg-[#fff8ec] p-4 shadow-[0_0_0_3px_rgba(245,158,11,0.16)]" : "rounded-lg border border-black/10 bg-[#f6f4ee] p-4"}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-ink">{title.title}</h3>
                    <p className="mt-1 text-sm text-black/60">
                      {title.channel || "MV N"} | {title.urgency || title.priority || "Normal"} | Due: {title.approved_due_date || "Not set"} | Expected: {title.expected_word_count || "Not set"} | Writer: {title.suggested_writer || "Optional"}
                    </p>
                  </div>
                  <BrainstormingStatusBadge status={title.status} />
                </div>

                {title.duplicate_warning ? <p className="mt-3 rounded-md bg-[#fff8ec] px-3 py-2 text-sm font-semibold text-amberline">{title.duplicate_warning}</p> : null}
                {isResurfacedHold(title) ? <p className="mt-3 rounded-md bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">Resurfaced From Hold | Held until {title.hold_until_date} | {title.decision_reason || "No hold reason added"}</p> : null}
                <Info label="Pitch" value={title.short_pitch} />
                <Info label="Why it is good" value={title.why_good} />
                <Info label="References" value={title.reference_links} />
                <Info label="Ahtesham's Directives" value={title.ahtesham_notes} />

                {canEdit ? (
                  <div className="mt-4 rounded-md border border-black/10 bg-white p-3">
                    <label>
                      <span className="text-xs font-semibold uppercase text-black/50">Editable Title</span>
                      <input
                        className="field-input mt-1"
                        value={approvalSettings[title.id]?.titleText ?? title.title}
                        onChange={(event) => updateApprovalSetting(title.id, { titleText: event.target.value })}
                      />
                    </label>
                    <label className="mt-3 block">
                      <span className="text-xs font-semibold uppercase text-black/50">Channel</span>
                      <select
                        className="field-input mt-1"
                        value={approvalSettings[title.id]?.channel ?? title.channel ?? "MV N"}
                        onChange={(event) => updateApprovalSetting(title.id, { channel: event.target.value })}
                      >
                        {FRESH_START_CHANNELS.map((channel) => (
                          <option key={channel} value={channel}>{channel}</option>
                        ))}
                      </select>
                    </label>
                    <button type="button" onClick={() => saveTitleText(title)} className="focus-ring mt-2 rounded-md border border-black/10 px-3 py-2 text-sm font-semibold text-moss hover:border-moss">
                      Save Title And Channel
                    </button>
                  </div>
                ) : null}

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
                      <label>
                        <span className="text-xs font-semibold uppercase text-black/50">Expected Word Count</span>
                        <input
                          type="number"
                          min="0"
                          className="field-input mt-1"
                          value={approvalSettings[title.id]?.expectedWordCount ?? title.expected_word_count ?? ""}
                          onChange={(event) => updateApprovalSetting(title.id, { expectedWordCount: event.target.value })}
                        />
                      </label>
                      {title.status === "Hold" || approvalSettings[title.id]?.holdUntilDate ? (
                        <label>
                          <span className="text-xs font-semibold uppercase text-black/50">Hold Until Date</span>
                          <input
                            type="date"
                            className="field-input mt-1"
                            value={approvalSettings[title.id]?.holdUntilDate ?? title.hold_until_date ?? ""}
                            onChange={(event) => updateApprovalSetting(title.id, { holdUntilDate: event.target.value })}
                          />
                        </label>
                      ) : null}
                      <label className="md:col-span-2">
                        <span className="text-xs font-semibold uppercase text-black/50">Ahtesham's Directives</span>
                        <textarea
                          className="field-input mt-1 min-h-24"
                          value={approvalSettings[title.id]?.directives ?? title.ahtesham_notes ?? ""}
                          onChange={(event) => updateApprovalSetting(title.id, { directives: event.target.value })}
                        />
                      </label>
                      <button type="button" onClick={() => saveReviewFields(title)} className="focus-ring rounded-md border border-black/10 px-3 py-2 text-sm font-semibold text-moss hover:border-moss">
                        Save Review Fields
                      </button>
                      <button type="button" onClick={() => saveDirectives(title)} className="focus-ring rounded-md border border-black/10 px-3 py-2 text-sm font-semibold text-moss hover:border-moss">
                        Save Directives
                      </button>
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
  channel: string;
  urgency: string;
  dueDate: string;
  expectedWordCount: string;
  holdUntilDate: string;
  titleText: string;
  directives: string;
};

function buildApprovalSettings(titles: BrainstormingTitle[]) {
  return Object.fromEntries(
    titles.map((title) => [title.id, buildApprovalSetting(title)])
  ) as Record<string, ApprovalSetting>;
}

function buildApprovalSetting(title: BrainstormingTitle | undefined): ApprovalSetting {
  return {
    channel: title?.channel || "MV N",
    urgency: title?.urgency || title?.priority || "Normal",
    dueDate: title?.approved_due_date || "",
    expectedWordCount: title?.expected_word_count ? String(title.expected_word_count) : "",
    holdUntilDate: title?.hold_until_date || "",
    titleText: title?.title || "",
    directives: title?.ahtesham_notes || ""
  };
}

function getVisibleTitles(titles: BrainstormingTitle[], supervisorFilter: string) {
  return titles
    .filter((title) => supervisorFilter === "All" || (title.supervisor || title.submitted_by_name || "Unassigned") === supervisorFilter)
    .filter((title) => !isDormantHold(title));
}

function isDormantHold(title: BrainstormingTitle) {
  return title.status === "Hold" && Boolean(title.hold_until_date && title.hold_until_date > todayKey());
}

function isResurfacedHold(title: BrainstormingTitle) {
  return title.status === "Hold" && Boolean(title.hold_until_date && title.hold_until_date <= todayKey());
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
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
