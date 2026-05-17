"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { FRESH_START_CHANNELS } from "@/lib/sharedConstants";

const supervisors = ["Ahtesham", "Kamran", "Farhan", "Raktim", "Deepak"];

export function BrainstormingSessionForm() {
  const router = useRouter();
  const today = getIndiaDateKey();
  const [name, setName] = useState(`Brainstorming ${today}`);
  const [sessionDate, setSessionDate] = useState(today);
  const [channels, setChannels] = useState<string[]>(["MV N"]);
  const [participants, setParticipants] = useState<string[]>(["Ahtesham", "Kamran", "Farhan", "Raktim"]);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/brainstorming/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, sessionDate, channels, participants, notes, status: "Draft" })
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(payload.error || "Could not create session.");
      return;
    }
    router.push(`/brainstorming/live/${payload.session.id}`);
  }

  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" value={name} onChange={setName} />
        <label>
          <span className="text-xs font-semibold uppercase text-black/55">Date</span>
          <input className="field-input mt-1" type="date" value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <CheckboxGroup label="Channels" values={FRESH_START_CHANNELS as unknown as string[]} selected={channels} onChange={setChannels} />
        <CheckboxGroup label="Participants" values={supervisors} selected={participants} onChange={setParticipants} />
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase text-black/55">Notes</span>
        <textarea className="field-input mt-1 min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:opacity-60"
      >
        <Plus size={16} />
        {saving ? "Creating" : "Create Session"}
      </button>
      {message ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm font-medium text-danger">{message}</p> : null}
    </section>
  );
}

function getIndiaDateKey() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-xs font-semibold uppercase text-black/55">{label}</span>
      <input className="field-input mt-1" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function CheckboxGroup({
  label,
  values,
  selected,
  onChange
}: {
  label: string;
  values: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-black/55">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => {
          const active = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(active ? selected.filter((item) => item !== value) : [...selected, value])}
              className={active ? "rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white" : "rounded-md border border-black/10 px-3 py-2 text-sm font-semibold text-moss"}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
