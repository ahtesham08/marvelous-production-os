export function MissingFieldsBadge({ fields }: { fields: string[] }) {
  if (fields.length === 0) {
    return <span className="text-sm font-medium text-emerald-700">None</span>;
  }

  return (
    <div className="flex max-w-md flex-wrap gap-1.5">
      {fields.map((field) => (
        <span key={field} className="rounded-md border border-danger/20 bg-[#fff0ef] px-2 py-1 text-xs font-semibold text-danger">
          {field}
        </span>
      ))}
    </div>
  );
}
