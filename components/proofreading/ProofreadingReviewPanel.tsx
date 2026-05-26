"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  PROOFREADING_BLOCK_CATEGORIES,
  SCRIPT_QUALITY_RATINGS
} from "@/lib/proofreadingConstants";
import type { EnrichedTitle, ProofreadingMessage, ProofreadingReview, UserRecord } from "@/lib/types";

type Props = {
  title: EnrichedTitle;
  initialReview: ProofreadingReview | null;
  initialMessages: ProofreadingMessage[];
  user: UserRecord | null;
};

export function ProofreadingReviewPanel({ title, initialReview, initialMessages, user }: Props) {
  const router = useRouter();
  const [review, setReview] = useState(initialReview);
  const [messages, setMessages] = useState(initialMessages);
  const [messageText, setMessageText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockForm, setBlockForm] = useState({
    blockCategory: "Poor writing quality",
    blockReason: "",
    detailedFeedback: "",
    whatNeedsFixing: "",
    scriptQualityRating: "Needs Major Fixes"
  });
  const [fixForm, setFixForm] = useState({
    response: "",
    correctedBySupervisor: true,
    sentBackForRewrite: false,
    changesMade: "",
    readyForRecheck: true
  });
  const [recheckMessage, setRecheckMessage] = useState("");

  const permissions = useMemo(() => getPermissions(title, user), [title, user]);
  const status = review?.proofreading_status || title.proofreadingStatus || (title.proofreader ? "Not Started" : "Not Assigned");
  const isBlocked = Boolean(review?.is_blocked || title.proofreadingBlocked);

  async function refreshBundle() {
    const response = await fetch(`/api/proofreading/${title.id}`);
    const payload = await response.json();
    if (response.ok) {
      setReview(payload.review);
      setMessages(payload.messages ?? []);
      router.refresh();
    }
  }

  async function submitForm(form: FormData) {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/proofreading/${title.id}`, {
      method: "POST",
      body: form
    });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(payload.error || "Unable to save proofreading update.");
      return false;
    }
    await refreshBundle();
    return true;
  }

  async function sendMessage() {
    if (!messageText.trim() && !attachment) return;
    const form = new FormData();
    form.set("action", "message");
    form.set("messageText", messageText);
    if (attachment) form.set("attachment", attachment);
    const ok = await submitForm(form);
    if (ok) {
      setMessageText("");
      setAttachment(null);
    }
  }

  async function blockScript() {
    const form = new FormData();
    form.set("action", "block");
    for (const [key, value] of Object.entries(blockForm)) form.set(key, String(value));
    if (attachment) form.set("attachment", attachment);
    const ok = await submitForm(form);
    if (ok) {
      setBlockForm({
        blockCategory: "Poor writing quality",
        blockReason: "",
        detailedFeedback: "",
        whatNeedsFixing: "",
        scriptQualityRating: "Needs Major Fixes"
      });
      setAttachment(null);
    }
  }

  async function submitFix() {
    const form = new FormData();
    form.set("action", "fix");
    for (const [key, value] of Object.entries(fixForm)) form.set(key, String(value));
    const ok = await submitForm(form);
    if (ok) setFixForm({ response: "", correctedBySupervisor: true, sentBackForRewrite: false, changesMade: "", readyForRecheck: true });
  }

  async function recheck(action: "approve" | "request_changes") {
    const form = new FormData();
    form.set("action", action);
    form.set("messageText", recheckMessage);
    const ok = await submitForm(form);
    if (ok) setRecheckMessage("");
  }

  return (
    <section className={clsx("rounded-lg border bg-white p-4 shadow-sm", isBlocked ? "border-red-300 bg-red-50/40" : "border-black/10")}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">Proofreading Review</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">Script QA and Feedback</h2>
          {isBlocked ? (
            <p className="mt-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-danger">
              Do Not Move Ahead, Blocked By Proofreader
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge label={status} tone={isBlocked ? "danger" : "neutral"} />
          <Badge label={review?.script_quality_rating || "No rating"} tone="neutral" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Info label="Assigned Proofreader" value={title.proofreader || review?.proofreader_name || "Not assigned"} />
        <Info label="Proofreading Status" value={status} />
        <Info label="Quality Rating" value={review?.script_quality_rating || "Not rated"} />
        <Info label="Blocked State" value={isBlocked ? "Blocked" : "Not blocked"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <InfoBlock title="Latest Proofreader Feedback" value={review?.latest_feedback || title.proofreadingLatestFeedback || "No proofreader feedback yet."} />
        <InfoBlock title="Latest Supervisor Response" value={review?.latest_supervisor_response || title.proofreadingLatestSupervisorResponse || "No supervisor response yet."} />
      </div>
      {review?.block_reason ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="text-sm font-semibold text-danger">{review.block_category || "Blocked"}</div>
          <p className="mt-1 text-sm text-black/70">{review.block_reason}</p>
          {review.what_needs_fixing ? <p className="mt-2 text-sm text-black/70">Needs fixing: {review.what_needs_fixing}</p> : null}
        </div>
      ) : null}

      <section className="mt-5 rounded-lg border border-black/10 bg-white p-3">
        <h3 className="text-lg font-semibold text-ink">Feedback Conversation</h3>
        <div className="mt-3 max-h-[460px] space-y-3 overflow-y-auto pr-1">
          {messages.map((message) => (
            <article key={message.id} className="rounded-lg border border-black/10 bg-[#f6f4ee] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-ink">{message.sender_name || "Unknown"} <span className="text-xs text-black/45">({message.sender_role || "User"})</span></div>
                <div className="text-xs text-black/50">{formatIst(message.created_at)}</div>
              </div>
              {message.message_text ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/70">{message.message_text}</p> : null}
              {message.attachment_url ? (
                <a href={message.attachment_url} target="_blank" rel="noreferrer" className="mt-3 block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={message.attachment_url} alt="Proofreading attachment" className="max-h-56 rounded-md border border-black/10 object-contain" />
                </a>
              ) : null}
            </article>
          ))}
          {messages.length === 0 ? <p className="rounded-md bg-[#f6f4ee] p-3 text-sm text-black/55">No proofreading conversation yet.</p> : null}
        </div>

        {permissions.canMessage ? (
          <div className="mt-4 space-y-3">
            <textarea
              className="field-input min-h-24"
              placeholder="Write feedback or reply to the supervisor/proofreader..."
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} />
              <button type="button" disabled={busy} onClick={sendMessage} className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:opacity-60">
                {busy ? "Sending" : "Send Message"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {permissions.canProofreaderAct ? (
          <section className="rounded-lg border border-red-200 bg-red-50 p-3">
            <h3 className="text-lg font-semibold text-danger">Block Script</h3>
            <div className="mt-3 space-y-2">
              <select className="field-input" value={blockForm.blockCategory} onChange={(event) => setBlockForm((current) => ({ ...current, blockCategory: event.target.value }))}>
                {PROOFREADING_BLOCK_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select className="field-input" value={blockForm.scriptQualityRating} onChange={(event) => setBlockForm((current) => ({ ...current, scriptQualityRating: event.target.value }))}>
                {SCRIPT_QUALITY_RATINGS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <input className="field-input" placeholder="Short block reason" value={blockForm.blockReason} onChange={(event) => setBlockForm((current) => ({ ...current, blockReason: event.target.value }))} />
              <textarea className="field-input min-h-24" placeholder="Detailed feedback" value={blockForm.detailedFeedback} onChange={(event) => setBlockForm((current) => ({ ...current, detailedFeedback: event.target.value }))} />
              <textarea className="field-input min-h-20" placeholder="What needs to be fixed" value={blockForm.whatNeedsFixing} onChange={(event) => setBlockForm((current) => ({ ...current, whatNeedsFixing: event.target.value }))} />
              <button type="button" disabled={busy} onClick={blockScript} className="focus-ring w-full rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Block Script
              </button>
            </div>
          </section>
        ) : null}

        {permissions.canSupervisorAct && isBlocked ? (
          <section className="rounded-lg border border-amber-300 bg-amber-50 p-3">
            <h3 className="text-lg font-semibold text-amber-900">Submit Fix Response</h3>
            <div className="mt-3 space-y-2">
              <textarea className="field-input min-h-20" placeholder="What was fixed?" value={fixForm.response} onChange={(event) => setFixForm((current) => ({ ...current, response: event.target.value }))} />
              <textarea className="field-input min-h-20" placeholder="What changes were made?" value={fixForm.changesMade} onChange={(event) => setFixForm((current) => ({ ...current, changesMade: event.target.value }))} />
              <label className="flex gap-2 text-sm font-medium text-black/70"><input type="checkbox" checked={fixForm.correctedBySupervisor} onChange={(event) => setFixForm((current) => ({ ...current, correctedBySupervisor: event.target.checked }))} /> Corrected by supervisor</label>
              <label className="flex gap-2 text-sm font-medium text-black/70"><input type="checkbox" checked={fixForm.sentBackForRewrite} onChange={(event) => setFixForm((current) => ({ ...current, sentBackForRewrite: event.target.checked }))} /> Sent back for rewrite</label>
              <label className="flex gap-2 text-sm font-medium text-black/70"><input type="checkbox" checked={fixForm.readyForRecheck} onChange={(event) => setFixForm((current) => ({ ...current, readyForRecheck: event.target.checked }))} /> Ready for proofreader recheck</label>
              <button type="button" disabled={busy} onClick={submitFix} className="focus-ring w-full rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:opacity-60">
                Submit Fix Response
              </button>
            </div>
          </section>
        ) : null}

        {permissions.canProofreaderAct ? (
          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <h3 className="text-lg font-semibold text-emerald-900">Recheck Actions</h3>
            <textarea className="field-input mt-3 min-h-24" placeholder="Recheck note" value={recheckMessage} onChange={(event) => setRecheckMessage(event.target.value)} />
            <div className="mt-3 grid gap-2">
              <button type="button" disabled={busy} onClick={() => recheck("approve")} className="focus-ring rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Approve After Fix
              </button>
              <button type="button" disabled={busy} onClick={() => recheck("request_changes")} className="focus-ring rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 disabled:opacity-60">
                Request More Changes
              </button>
            </div>
          </section>
        ) : null}
      </div>

      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-danger">{error}</p> : null}
    </section>
  );
}

function getPermissions(title: EnrichedTitle, user: UserRecord | null) {
  const role = user?.role ?? "";
  const isAdmin = role === "Admin";
  const isOps = role === "Operations Supervisor";
  const isSupervisor = role === "Supervisor" && user?.name && title.supervisor.toLowerCase().includes(user.name.toLowerCase());
  const isProofreader = role === "Proofreader" && user?.name && String(title.proofreader ?? "").toLowerCase().includes(user.name.toLowerCase());
  return {
    canMessage: Boolean(isAdmin || isOps || isSupervisor || isProofreader),
    canProofreaderAct: Boolean(isAdmin || isProofreader),
    canSupervisorAct: Boolean(isAdmin || isSupervisor)
  };
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#f6f4ee] p-3">
      <div className="text-xs font-semibold uppercase text-black/45">{label}</div>
      <div className="mt-1 font-medium text-ink">{value}</div>
    </div>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-[#f6f4ee] p-3">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/70">{value}</p>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: "danger" | "neutral" }) {
  return (
    <span className={clsx("rounded-md border px-2 py-1 text-xs font-semibold", tone === "danger" ? "border-red-300 bg-red-50 text-danger" : "border-black/10 bg-[#f6f4ee] text-moss")}>
      {label}
    </span>
  );
}

function formatIst(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short"
  }).format(new Date(value));
}
