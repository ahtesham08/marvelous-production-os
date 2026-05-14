"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { FRESH_START_CHANNELS, PRIORITIES } from "@/lib/sharedConstants";
import type { BrainstormingSession } from "@/lib/types";

export function BrainstormingSubmitForm({ sessions }: { sessions: BrainstormingSession[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    channel: "MV N",
    priority: "Normal",
    supervisor: "",
    shortPitch: "",
    whyGood: "",
    referenceLinks: "",
    suggestedWriter: "",
    notes: "",
    sessionId: sessions[0]?.id ?? ""
  });
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/brainstorming/titles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(payload.error || "Could not submit title.");
      return;
    }
    router.push(form.sessionId ? `/brainstorming/live/${form.sessionId}` : "/brainstorming/title-bank");
  }

  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
        <Select label="Session" value={form.sessionId} options={sessions.map((session) => ({ label: session.name, value: session.id }))} onChange={(sessionId) => setForm({ ...form, sessionId })} />
        <Select label="Channel" value={form.channel} options={FRESH_START_CHANNELS.map((value) => ({ label: value, value }))} onChange={(channel) => setForm({ ...form, channel })} />
        <Select label="Priority" value={form.priority} options={PRIORITIES.map((value) => ({ label: value, value }))} onChange={(priority) => setForm({ ...form, priority })} />
        <Field label="Supervisor" value={form.supervisor} onChange={(supervisor) => setForm({ ...form, supervisor })} />
        <Field label="Suggested Writer" value={form.suggestedWriter} onChange={(suggestedWriter) => setForm({ ...form, suggestedWriter })} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Area label="Short Pitch" value={form.shortPitch} onChange={(shortPitch) => setForm({ ...form, shortPitch })} />
        <Area label="Why This Title Is Good" value={form.whyGood} onChange={(whyGood) => setForm({ ...form, whyGood })} />
        <Area label="Reference Links" value={form.referenceLinks} onChange={(referenceLinks) => setForm({ ...form, referenceLinks })} />
        <Area label="Notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} />
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={saving || !form.title.trim()}
        className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:opacity-60"
      >
        <Lightbulb size={16} />
        {saving ? "Submitting" : "Submit Title Idea"}
      </button>
      {message ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm font-medium text-danger">{message}</p> : null}
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-xs font-semibold uppercase text-black/55">{label}</span>
      <input className="field-input mt-1" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-xs font-semibold uppercase text-black/55">{label}</span>
      <textarea className="field-input mt-1 min-h-24" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-xs font-semibold uppercase text-black/55">{label}</span>
      <select className="field-input mt-1" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">No session</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
