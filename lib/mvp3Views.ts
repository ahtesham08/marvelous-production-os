import type { EnrichedTitle } from "@/lib/types";

export function isDueToday(title: EnrichedTitle) {
  return title.writerDueDate === today();
}

export function isOverdue(title: EnrichedTitle) {
  if (!title.writerDueDate || ["Completed", "Cancelled"].includes(title.status)) return false;
  return new Date(`${title.writerDueDate}T23:59:59`).getTime() < Date.now();
}

export function daysOverdue(title: EnrichedTitle) {
  if (!title.writerDueDate) return 0;
  const due = new Date(`${title.writerDueDate}T00:00:00`);
  return Math.max(0, Math.floor((Date.now() - due.getTime()) / 86_400_000));
}

export function isCompletedToday(title: EnrichedTitle) {
  const value = title.completedAt || (title.status === "Completed" ? title.lastUpdatedAt : null);
  return Boolean(value && value.slice(0, 10) === today());
}

export function isCompletedThisWeek(title: EnrichedTitle) {
  const value = title.completedAt || (title.status === "Completed" ? title.lastUpdatedAt : null);
  if (!value) return false;
  const date = new Date(value);
  const start = new Date();
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return date >= start;
}

export function supervisorQueue(titles: EnrichedTitle[], supervisor = "") {
  const scoped = supervisor
    ? titles.filter((title) => title.supervisor.toLowerCase().includes(supervisor.toLowerCase()))
    : titles.filter((title) => title.supervisor !== "Missing");
  return {
    assigned: scoped,
    missingWriter: scoped.filter((title) => title.missingFields.includes("Writer")),
    missingHelpDoc: scoped.filter((title) => title.missingFields.includes("Help Doc")),
    dueToday: scoped.filter(isDueToday),
    overdue: scoped.filter(isOverdue),
    blocked: scoped.filter((title) => title.blocked),
    scriptSubmitted: scoped.filter((title) => title.status === "Script Submitted"),
    nextAction: scoped.filter((title) => title.nextAction !== "Monitor")
  };
}

export function operationsSections(titles: EnrichedTitle[]) {
  return {
    wordCountMissing: titles.filter((title) => title.status === "Script Submitted" && !title.wordCount),
    voMissing: titles.filter((title) => Boolean(title.wordCount && !title.voArtist)),
    editorMissing: titles.filter((title) => Boolean(title.wordCount && title.voArtist && !title.editor)),
    proofreaderMissing: titles.filter((title) => Boolean(title.wordCount && title.voArtist && title.editor && !title.proofreader)),
    proofreadingPending: titles.filter((title) => title.status === "Proofreading Pending"),
    editingPending: titles.filter((title) => title.status === "Editing Pending"),
    readyToComplete: titles.filter((title) => Boolean(title.wordCount && title.voArtist && title.editor && title.proofreader && title.status !== "Completed")),
    blockedProduction: titles.filter((title) => title.blocked && title.blockedCategory === "Production issue")
  };
}

export function flattenActivity(titles: EnrichedTitle[]) {
  return titles
    .flatMap((title) =>
      (title.activityLog ?? []).map((entry) => ({
        ...entry,
        title: title.title,
        channel: title.channel,
        supervisor: title.supervisor
      }))
    )
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
