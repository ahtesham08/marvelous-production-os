"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

const channels = ["MV N", "LL", "Gamers", "Anime", "Long Reads"];
const priorities = ["Normal", "Urgent", "High", "Low"];

export default function NewTitlePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    channel: "MV N",
    priority: "Normal",
    supervisor: "",
    writer: "",
    helpDocUrl: "",
    dueDate: "",
    notes: ""
  });
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function createTitle() {
    setState("saving");
    setMessage(null);

    const response = await fetch("/api/titles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();

    if (!response.ok) {
      setState("error");
      setMessage(payload.error || "Unable to create title.");
      return;
    }

    router.push(`/titles/${payload.title.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Fresh Start Mode</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Create Approved Title</h1>
        <p className="mt-2 text-sm text-black/60">
          Add tomorrow's approved brainstorming titles directly into Marvelous Production OS.
        </p>
      </div>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input className="field-input" value={form.title} onChange={(event) => update("title", event.target.value)} />
          </Field>
          <Field label="Channel">
            <select className="field-input" value={form.channel} onChange={(event) => update("channel", event.target.value)}>
              {channels.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select className="field-input" value={form.priority} onChange={(event) => update("priority", event.target.value)}>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Supervisor">
            <input className="field-input" value={form.supervisor} onChange={(event) => update("supervisor", event.target.value)} />
          </Field>
          <Field label="Writer Optional">
            <input className="field-input" value={form.writer} onChange={(event) => update("writer", event.target.value)} />
          </Field>
          <Field label="Due Date Optional">
            <input type="date" className="field-input" value={form.dueDate} onChange={(event) => update("dueDate", event.target.value)} />
          </Field>
          <Field label="Help Doc Link Optional">
            <input className="field-input" value={form.helpDocUrl} onChange={(event) => update("helpDocUrl", event.target.value)} />
          </Field>
          <Field label="Notes">
            <textarea className="field-input min-h-24" value={form.notes} onChange={(event) => update("notes", event.target.value)} />
          </Field>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-black/55">Default status: Approved</p>
          <button
            type="button"
            onClick={createTitle}
            disabled={state === "saving"}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-60"
          >
            <Plus size={16} />
            {state === "saving" ? "Creating" : "Create Approved Title"}
          </button>
        </div>
        {message ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-danger">{message}</p> : null}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-black/55">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
