"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function SyncButton() {
  const [state, setState] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function syncNow() {
    setState("syncing");
    setMessage(null);

    const response = await fetch("/api/sync", { method: "POST" });
    const payload = await response.json();

    if (!response.ok) {
      setState("error");
      setMessage(payload.error || "Archive import failed.");
      return;
    }

    setState("done");
    setMessage(
      `Imported ${payload.titleBankRows} title-bank rows and ${payload.productionRows} production rows for reference only. ${payload.needsReviewRows} need review.`
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={syncNow}
        disabled={state === "syncing"}
        className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw size={16} className={state === "syncing" ? "animate-spin" : ""} />
        {state === "syncing" ? "Importing" : "Import Old Sheets For Reference"}
      </button>
      {message ? (
        <p className={state === "error" ? "text-sm font-medium text-danger" : "text-sm font-medium text-moss"}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
