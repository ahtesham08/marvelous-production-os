/**
 * Shown instantly while a page's data loads, so clicking a menu item gives
 * immediate feedback instead of the old "nothing happens for a few seconds".
 */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <div className="h-3 w-28 rounded bg-black/10" />
        <div className="h-8 w-72 max-w-full rounded bg-black/10" />
        <div className="h-3 w-96 max-w-full rounded bg-black/5" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 rounded-lg border border-black/10 bg-white" />
        ))}
      </div>
      <div className="rounded-lg border border-black/10 bg-white">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex gap-4 border-b border-black/5 px-4 py-4 last:border-0">
            <div className="h-3 w-1/3 rounded bg-black/10" />
            <div className="h-3 w-1/6 rounded bg-black/5" />
            <div className="h-3 w-1/6 rounded bg-black/5" />
            <div className="h-3 w-1/12 rounded bg-black/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
