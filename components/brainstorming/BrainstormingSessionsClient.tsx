"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { BrainstormingStatusBadge } from "@/components/brainstorming/BrainstormingStatusBadge";
import type { BrainstormingSession, BrainstormingTitle } from "@/lib/types";

type BrainstormingSessionsClientProps = {
  sessions: BrainstormingSession[];
  titles: BrainstormingTitle[];
  canDelete: boolean;
};

export function BrainstormingSessionsClient({ sessions, titles, canDelete }: BrainstormingSessionsClientProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const counts = new Map<string, number>();
  for (const title of titles) {
    if (!title.session_id) continue;
    counts.set(title.session_id, (counts.get(title.session_id) ?? 0) + 1);
  }

  async function deleteSession(session: BrainstormingSession) {
    const count = counts.get(session.id) ?? 0;
    const confirmed = window.confirm(
      `Delete "${session.name}"?\n\nThis will permanently purge this brainstorming session, ${count} linked brainstorming title(s), and their discussion notes.\n\nProduction titles already created from this session will NOT be deleted.`
    );
    if (!confirmed) return;

    setDeletingId(session.id);
    const response = await fetch("/api/brainstorming/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: session.id })
    });
    const payload = await response.json();
    setDeletingId(null);

    if (!response.ok) {
      alert(payload.error || "Could not delete brainstorming session.");
      return;
    }
    router.refresh();
  }

  return (
    <section className="grid gap-3 md:grid-cols-2">
      {sessions.map((session) => {
        const count = counts.get(session.id) ?? 0;
        return (
          <article key={session.id} className="rounded-lg border border-black/10 bg-white p-4 shadow-sm transition hover:border-moss">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/brainstorming/live/${session.id}`} className="text-lg font-semibold text-ink hover:text-moss hover:underline">
                  {session.name}
                </Link>
                <p className="mt-1 text-sm text-black/60">{session.session_date} | {count} titles</p>
                <p className="mt-1 text-xs text-black/50">{(session.channels ?? []).join(", ")}</p>
              </div>
              <BrainstormingStatusBadge status={session.status} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link href={`/brainstorming/live/${session.id}`} className="focus-ring rounded-md border border-black/10 px-3 py-2 text-sm font-semibold text-moss hover:border-moss">
                Open Live Review
              </Link>
              {canDelete ? (
                <button
                  type="button"
                  disabled={deletingId === session.id}
                  onClick={() => deleteSession(session)}
                  className="focus-ring inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-danger hover:border-danger disabled:opacity-60"
                >
                  <Trash2 size={15} />
                  {deletingId === session.id ? "Deleting" : "Delete"}
                </button>
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}
