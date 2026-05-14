import clsx from "clsx";

export function StatusBadge({ status }: { status: string }) {
  const isDone = status === "Completed" || status.includes("Done");
  const isPending = status.includes("Pending") || status === "Approved";

  return (
    <span
      className={clsx(
        "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
        isDone && "border-emerald-300 bg-emerald-50 text-emerald-800",
        isPending && "border-yellow-300 bg-yellow-50 text-yellow-800",
        !isDone && !isPending && "border-moss/25 bg-white text-moss"
      )}
    >
      {status}
    </span>
  );
}
