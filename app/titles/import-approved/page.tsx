import Link from "next/link";
import { ApprovedTitlesImportClient } from "@/components/titles/ApprovedTitlesImportClient";
import { getCurrentUserContext } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export default async function ImportApprovedTitlesPage() {
  const userContext = await getCurrentUserContext();
  const role = String(userContext.user?.role ?? "");
  const allowed = ["Admin", "Supervisor"].includes(role);

  if (!allowed) {
    return (
      <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-moss">Access Denied</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Import Approved Created Titles</h1>
        <p className="mt-3 text-sm text-black/60">
          Only Admin and Supervisors can import approved production titles directly.
        </p>
        <Link href="/titles" className="mt-4 inline-block text-sm font-semibold text-moss hover:underline">
          Back to Main Title Table
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">Production Import</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Import Approved Created Titles</h1>
          <p className="mt-2 max-w-3xl text-sm text-black/60">
            Paste approved supervisor-wise title lists, preview them, adjust fields, and create production titles directly.
          </p>
        </div>
        <Link href="/brainstorming/import" className="text-sm font-semibold text-moss hover:underline">
          Brainstorming import stays separate
        </Link>
      </div>
      <ApprovedTitlesImportClient />
    </div>
  );
}
