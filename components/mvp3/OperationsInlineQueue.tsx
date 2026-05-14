"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EnrichedTitle } from "@/lib/types";

export function OperationsInlineQueue({ titles }: { titles: EnrichedTitle[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [message, setMessage] = useState<string | null>(null);

  function setValue(id: string, field: string, value: string) {
    setValues((current) => ({ ...current, [id]: { ...(current[id] ?? {}), [field]: value } }));
  }

  async function save(id: string, status?: string) {
    const local = values[id] ?? {};
    const response = await fetch(`/api/titles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_status: status,
        production: {
          word_count: local.word_count ? Number(local.word_count) : undefined,
          vo_artist: local.vo_artist,
          editor_text: local.editor_text,
          proofreader_text: local.proofreader_text,
          production_status: local.production_status
        }
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || "Unable to update operations item.");
      return;
    }
    setMessage("Updated.");
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">Quick Inline Updates</h2>
      <div className="mt-4 space-y-3">
        {titles.slice(0, 20).map((title) => (
          <article key={title.id} className="rounded-lg border border-black/10 p-3">
            <div className="font-semibold text-ink">{title.title}</div>
            <div className="mt-3 grid gap-2 md:grid-cols-6">
              <input className="field-input" placeholder="Word count" onChange={(event) => setValue(title.id, "word_count", event.target.value)} />
              <input className="field-input" placeholder="VO" onChange={(event) => setValue(title.id, "vo_artist", event.target.value)} />
              <input className="field-input" placeholder="Editor" onChange={(event) => setValue(title.id, "editor_text", event.target.value)} />
              <input className="field-input" placeholder="Proofreader" onChange={(event) => setValue(title.id, "proofreader_text", event.target.value)} />
              <input className="field-input" placeholder="Production status" onChange={(event) => setValue(title.id, "production_status", event.target.value)} />
              <button type="button" onClick={() => save(title.id)} className="focus-ring rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-moss">Save</button>
            </div>
            <button type="button" onClick={() => save(title.id, "Completed")} className="mt-2 rounded-md border border-black/10 px-3 py-2 text-xs font-semibold text-moss hover:border-moss">
              Mark completed
            </button>
          </article>
        ))}
      </div>
      {message ? <p className="mt-3 text-sm font-medium text-moss">{message}</p> : null}
    </section>
  );
}
