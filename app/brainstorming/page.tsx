"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus } from "lucide-react";

const channels = ["MV N", "LL", "Gamers", "Anime", "Long Reads"];
const priorities = ["Normal", "Urgent", "High", "Low"];

type PreviewTitle = {
  title: string;
  channel: string;
  supervisor: string;
  priority: string;
  writer: string;
};

export default function BrainstormingPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const preview = useMemo(() => parsePaste(text), [text]);

  async function createBatch() {
    setState("saving");
    setMessage(null);

    const response = await fetch("/api/brainstorming", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titles: preview })
    });
    const payload = await response.json();

    if (!response.ok) {
      setState("error");
      setMessage(payload.error || "Unable to create approved titles.");
      return;
    }

    router.push("/titles");
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Brainstorming Batch Entry</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Create Approved Titles From Paste</h1>
        <p className="mt-2 text-sm text-black/60">
          Paste one title per line, or use: Title | Channel | Supervisor | Priority | Writer
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ClipboardList size={16} />
              Approved Titles
            </span>
            <textarea
              className="field-input mt-3 min-h-[320px] font-mono"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={"WTF Happened to Gargoyles | MV N | Raktim | Urgent | Rishi\nThe Goonies 2 Everything We Know | LL | Kamran"}
            />
          </label>
        </div>

        <aside className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Preview</h2>
          <p className="mt-1 text-sm text-black/55">{preview.length} approved titles ready.</p>
          <button
            type="button"
            onClick={createBatch}
            disabled={state === "saving" || preview.length === 0}
            className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-60"
          >
            <Plus size={16} />
            {state === "saving" ? "Creating" : "Create Approved Titles"}
          </button>
          {message ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm font-medium text-danger">{message}</p> : null}
        </aside>
      </section>

      <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-black/10 text-left text-sm">
            <thead className="bg-[#eef1eb] text-xs uppercase text-black/55">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Supervisor</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Writer</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {preview.map((item, index) => (
                <tr key={`${item.title}-${index}`}>
                  <td className="px-4 py-3 font-medium text-ink">{item.title}</td>
                  <td className="px-4 py-3">{item.channel}</td>
                  <td className="px-4 py-3">{item.supervisor || "Missing"}</td>
                  <td className="px-4 py-3">{item.priority}</td>
                  <td className="px-4 py-3">{item.writer || "Optional"}</td>
                  <td className="px-4 py-3">Approved</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {preview.length === 0 ? <div className="px-4 py-10 text-center text-sm text-black/55">Paste titles to preview.</div> : null}
      </div>
    </div>
  );
}

function parsePaste(value: string): PreviewTitle[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.includes("|")
        ? line.split("|").map((part) => part.trim())
        : [line, "", "", "", ""];

      return {
        title: parts[0] ?? "",
        channel: normalizeChannel(parts[1]),
        supervisor: parts[2] ?? "",
        priority: normalizePriority(parts[3]),
        writer: parts[4] ?? ""
      };
    })
    .filter((item) => item.title.length > 0);
}

function normalizeChannel(value: string | undefined) {
  const match = channels.find((channel) => channel.toLowerCase() === String(value ?? "").trim().toLowerCase());
  return match ?? "MV N";
}

function normalizePriority(value: string | undefined) {
  const match = priorities.find((priority) => priority.toLowerCase() === String(value ?? "").trim().toLowerCase());
  return match ?? "Normal";
}
