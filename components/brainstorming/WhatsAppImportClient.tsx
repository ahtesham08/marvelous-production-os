"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus } from "lucide-react";
import { FRESH_START_CHANNELS, PRIORITIES } from "@/lib/sharedConstants";
import type { BrainstormingSession } from "@/lib/types";

type Row = {
  title: string;
  supervisor: string;
  channel: string;
  priority: string;
  notes?: string;
  sessionId?: string;
  duplicateWarning?: string | null;
};

export function WhatsAppImportClient({
  sessions,
  initialSessionId
}: {
  sessions: BrainstormingSession[];
  initialSessionId?: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sessionId, setSessionId] = useState(initialSessionId ?? sessions[0]?.id ?? "");
  const [preview, setPreview] = useState<Row[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function previewImport() {
    setMessage(null);
    if (!sessionId) {
      setMessage("Choose a brainstorming session before previewing imported titles.");
      return;
    }
    const response = await fetch("/api/brainstorming/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sessionId, previewOnly: true })
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || "Could not parse WhatsApp paste.");
      return;
    }
    setPreview(payload.preview);
  }

  async function saveImport() {
    if (!sessionId) {
      setMessage("Choose a brainstorming session before adding imported titles.");
      return;
    }
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/brainstorming/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titles: preview.map((row) => ({ ...row, sessionId })) })
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(payload.error || "Could not save imported titles.");
      return;
    }
    router.push(sessionId ? `/brainstorming/live/${sessionId}` : "/brainstorming/title-bank");
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setPreview(preview.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <label>
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ClipboardList size={16} />
              WhatsApp Paste
            </span>
            <textarea
              className="field-input mt-3 min-h-[320px] font-mono"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={"Kamran:\n1. Every Origin Of Art The Clown - Explored\n2. 10 Forgotten Sci-Fi Shows That Deserve Reboots\n\nFarhan:\n1. 14 Brutal Slasher Films That Defined The 80s"}
            />
          </label>
        </div>
        <aside className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <label>
            <span className="text-xs font-semibold uppercase text-black/55">Session</span>
            <select className="field-input mt-1" value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
              <option value="">Choose a session</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>{session.name}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={previewImport} className="focus-ring mt-4 w-full rounded-md border border-black/10 px-4 py-2 text-sm font-semibold text-moss hover:border-moss">
            Preview Paste
          </button>
          <button
            type="button"
            onClick={saveImport}
            disabled={saving || preview.length === 0}
            className="focus-ring mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:opacity-60"
          >
            <Plus size={16} />
            {saving ? "Adding" : "Add To Brainstorming Session"}
          </button>
          {message ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm font-medium text-danger">{message}</p> : null}
        </aside>
      </section>

      <section className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-black/10 text-sm">
            <thead className="bg-[#eef1eb] text-left text-xs uppercase text-black/55">
              <tr>
                <th className="px-3 py-3">Title</th>
                <th className="px-3 py-3">Supervisor</th>
                <th className="px-3 py-3">Channel</th>
                <th className="px-3 py-3">Priority</th>
                <th className="px-3 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {preview.map((row, index) => (
                <tr key={`${row.title}-${index}`} className={row.duplicateWarning ? "bg-[#fff8ec]" : undefined}>
                  <td className="min-w-[320px] px-3 py-3">
                    <input className="field-input" value={row.title} onChange={(event) => updateRow(index, { title: event.target.value })} />
                    {row.duplicateWarning ? <div className="mt-1 text-xs font-semibold text-amberline">{row.duplicateWarning}</div> : null}
                  </td>
                  <td className="px-3 py-3"><input className="field-input" value={row.supervisor} onChange={(event) => updateRow(index, { supervisor: event.target.value })} /></td>
                  <td className="px-3 py-3">
                    <select className="field-input" value={row.channel} onChange={(event) => updateRow(index, { channel: event.target.value })}>
                      {FRESH_START_CHANNELS.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <select className="field-input" value={row.priority} onChange={(event) => updateRow(index, { priority: event.target.value })}>
                      {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                    </select>
                  </td>
                  <td className="min-w-[220px] px-3 py-3"><input className="field-input" value={row.notes ?? ""} onChange={(event) => updateRow(index, { notes: event.target.value })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {preview.length === 0 ? <div className="px-4 py-10 text-center text-sm text-black/55">Paste a numbered WhatsApp list and preview it here.</div> : null}
      </section>
    </div>
  );
}
