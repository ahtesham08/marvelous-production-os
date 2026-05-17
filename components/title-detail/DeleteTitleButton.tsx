"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type DeleteTitleButtonProps = {
  titleId: string;
  titleName: string;
  returnPath: string;
};

export function DeleteTitleButton({ titleId, titleName, returnPath }: DeleteTitleButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function deleteTitle() {
    const confirmed = window.confirm(
      `Delete "${titleName}"?\n\nThis permanently removes the production title from Marvelous Production OS. Old Google Sheets will not be touched.`
    );
    if (!confirmed) return;

    setDeleting(true);
    const response = await fetch(`/api/titles/${titleId}`, { method: "DELETE" });
    const payload = await response.json();
    setDeleting(false);

    if (!response.ok) {
      alert(payload.error || "Could not delete title.");
      return;
    }

    router.push(returnPath || "/titles");
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={deleting}
      onClick={deleteTitle}
      className="focus-ring inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-danger hover:border-danger disabled:opacity-60"
    >
      <Trash2 size={16} />
      {deleting ? "Deleting" : "Delete Title"}
    </button>
  );
}
