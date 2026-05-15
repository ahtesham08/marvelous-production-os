"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";
import { STATUS_VALUES } from "@/lib/statusRules";
import type { EnrichedTitle } from "@/lib/types";

type TitleUpdateFormProps = {
  title: EnrichedTitle;
};

export function TitleUpdateForm({ title }: TitleUpdateFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    titleText: title.title,
    supervisor: title.supervisor === "Missing" ? "" : title.supervisor,
    writer: title.writer === "Missing" ? "" : title.writer,
    expectedWordCount: title.expectedWordCount?.toString() ?? "",
    ahteshamDirectives: title.ahteshamDirectives ?? "",
    helpDocUrl: title.helpDocUrl ?? "",
    scriptDocUrl: title.scriptDocUrl ?? "",
    writerDueDate: title.writerDueDate ?? "",
    status: title.status,
    notes: title.notes ?? "",
    blocked: title.blocked,
    blockedReason: title.blockedReason ?? "",
    blockedBy: title.blockedBy ?? "",
    blockedCategory: title.blockedCategory ?? "Other",
    wordCount: title.wordCount?.toString() ?? "",
    voArtist: title.voArtist ?? "",
    clipFinder: title.clipFinder ?? "",
    editor: title.editor ?? "",
    proofreader: title.proofreader ?? "",
    productionStatus: title.productionStatus ?? "",
    manualScriptSubmitted: false
  });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  function updateField(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save() {
    setState("saving");
    setMessage(null);

    const response = await fetch(`/api/titles/${title.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.titleText,
        imported_supervisor_name: form.supervisor,
        imported_writer_name: form.writer,
        expected_word_count: form.expectedWordCount ? Number(form.expectedWordCount) : null,
        ahtesham_directives: form.ahteshamDirectives,
        help_doc_url: form.helpDocUrl,
        script_doc_url: form.scriptDocUrl,
        writer_due_date: form.writerDueDate,
        current_status: form.status,
        notes: form.notes,
        blocked: form.blocked,
        blocked_reason: form.blockedReason,
        blocked_by: form.blockedBy,
        blocked_category: form.blockedCategory,
        manual_script_submitted: form.manualScriptSubmitted,
        production: {
          word_count: form.wordCount ? Number(form.wordCount) : null,
          vo_artist: form.voArtist,
          clip_finder: form.clipFinder,
          editor_text: form.editor,
          proofreader_text: form.proofreader,
          production_status: form.productionStatus
        }
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setState("error");
      setMessage(payload.error || "Unable to save title.");
      return;
    }

    setState("saved");
    setMessage("Saved title update.");
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Update Title</h2>
          <p className="text-sm text-black/55">Supervisor, script, and operations fields for Fresh Start Mode.</p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={state === "saving"}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "saved" ? <Check size={16} /> : <Save size={16} />}
          {state === "saving" ? "Saving" : "Save"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input
            suppressHydrationWarning
            className="field-input"
            value={form.titleText}
            onChange={(event) => updateField("titleText", event.target.value)}
          />
        </Field>
        <Field label="Supervisor">
          <input
            suppressHydrationWarning
            className="field-input"
            value={form.supervisor}
            onChange={(event) => updateField("supervisor", event.target.value)}
          />
        </Field>
        <Field label="Writer">
          <input
            suppressHydrationWarning
            className="field-input"
            value={form.writer}
            onChange={(event) => updateField("writer", event.target.value)}
          />
        </Field>
        <Field label="Writer Due Date">
          <input
            suppressHydrationWarning
            type="date"
            className="field-input"
            value={form.writerDueDate}
            onChange={(event) => updateField("writerDueDate", event.target.value)}
          />
        </Field>
        <Field label="Expected Word Count">
          <input
            suppressHydrationWarning
            type="number"
            min="0"
            className="field-input"
            value={form.expectedWordCount}
            onChange={(event) => updateField("expectedWordCount", event.target.value)}
          />
        </Field>
        <Field label="Status">
          <select
            suppressHydrationWarning
            className="field-input"
            value={form.status}
            onChange={(event) => updateField("status", event.target.value)}
          >
            {STATUS_VALUES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Help Doc URL">
          <input
            suppressHydrationWarning
            className="field-input"
            value={form.helpDocUrl}
            onChange={(event) => updateField("helpDocUrl", event.target.value)}
          />
        </Field>
        <Field label="Script Doc URL">
          <input
            suppressHydrationWarning
            className="field-input"
            value={form.scriptDocUrl}
            onChange={(event) => updateField("scriptDocUrl", event.target.value)}
          />
        </Field>
        <Field label="Word Count">
          <input
            suppressHydrationWarning
            type="number"
            min="0"
            className="field-input"
            value={form.wordCount}
            onChange={(event) => updateField("wordCount", event.target.value)}
          />
        </Field>
        <Field label="VO Artist">
          <input
            suppressHydrationWarning
            className="field-input"
            value={form.voArtist}
            onChange={(event) => updateField("voArtist", event.target.value)}
          />
        </Field>
        <Field label="Clip Finder">
          <input
            suppressHydrationWarning
            className="field-input"
            value={form.clipFinder}
            onChange={(event) => updateField("clipFinder", event.target.value)}
          />
        </Field>
        <Field label="Editor">
          <input
            suppressHydrationWarning
            className="field-input"
            value={form.editor}
            onChange={(event) => updateField("editor", event.target.value)}
          />
        </Field>
        <Field label="Proofreader">
          <input
            suppressHydrationWarning
            className="field-input"
            value={form.proofreader}
            onChange={(event) => updateField("proofreader", event.target.value)}
          />
        </Field>
        <Field label="Production Status">
          <input
            suppressHydrationWarning
            className="field-input"
            value={form.productionStatus}
            onChange={(event) => updateField("productionStatus", event.target.value)}
          />
        </Field>
      </div>

      <div className="mt-5 rounded-lg border border-black/10 bg-[#f6f4ee] p-3">
        <div className="text-xs font-semibold uppercase text-black/55">Supervisor Quick Actions</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Kamran", "Farhan", "Raktim"].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                updateField("supervisor", name);
                updateField("status", "Assigned To Supervisor");
              }}
              className="focus-ring rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"
            >
              Claim as {name}
            </button>
          ))}
          {[
            "Help Doc Ready",
            "Script In Progress",
            "Script Submitted",
            "Word Count Pending"
          ].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => updateField("status", status)}
              className="focus-ring rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Field label="Ahtesham's Directives">
            <textarea
              suppressHydrationWarning
              className="field-input min-h-28"
              value={form.ahteshamDirectives}
              onChange={(event) => updateField("ahteshamDirectives", event.target.value)}
            />
          </Field>
          <Field label="General Notes">
            <textarea
              suppressHydrationWarning
              className="field-input min-h-28"
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </Field>
        </div>
        <div className="space-y-3 rounded-lg border border-black/10 bg-[#f6f4ee] p-3">
          <label className="flex items-start gap-3 text-sm font-medium text-ink">
            <input
              suppressHydrationWarning
              type="checkbox"
              className="mt-1"
              checked={form.manualScriptSubmitted}
              onChange={(event) => updateField("manualScriptSubmitted", event.target.checked)}
            />
            Script submitted manually without a doc link
          </label>
          <label className="flex items-start gap-3 text-sm font-medium text-ink">
            <input
              suppressHydrationWarning
              type="checkbox"
              className="mt-1"
              checked={form.blocked}
              onChange={(event) => updateField("blocked", event.target.checked)}
            />
            Title is blocked
          </label>
          <select
            suppressHydrationWarning
            className="field-input"
            value={form.blockedCategory}
            onChange={(event) => updateField("blockedCategory", event.target.value)}
          >
            {[
              "Research issue",
              "Writer unavailable",
              "Help doc problem",
              "Waiting for approval",
              "Script quality issue",
              "Production issue",
              "Other"
            ].map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <input
            suppressHydrationWarning
            className="field-input"
            placeholder="Blocked by"
            value={form.blockedBy}
            onChange={(event) => updateField("blockedBy", event.target.value)}
          />
          <input
            suppressHydrationWarning
            className="field-input"
            placeholder="Blocked reason"
            value={form.blockedReason}
            onChange={(event) => updateField("blockedReason", event.target.value)}
          />
          <p className="rounded-md border border-amberline/25 bg-white px-3 py-2 text-xs font-semibold text-amberline">
            Fresh Start Mode: old Google Sheets are archive-only. Edits stay in Marvelous Production OS.
          </p>
        </div>
      </div>

      {message ? (
        <p className={state === "error" ? "mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-danger" : "mt-4 rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-800"}>
          {message}
        </p>
      ) : null}
    </section>
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
