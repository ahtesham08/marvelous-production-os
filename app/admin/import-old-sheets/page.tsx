import { SyncButton } from "@/components/SyncButton";
import { getDashboardData } from "@/lib/dashboardData";
import { PRODUCTION_SPREADSHEET_ID, PRODUCTION_TABS, TITLE_BANK_SPREADSHEET_ID, TITLE_BANK_TAB } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export default async function ImportOldSheetsPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-amberline/30 bg-[#fff8ec] p-5 shadow-soft">
        <p className="text-sm font-semibold uppercase text-amberline">Archive Import Tool</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Import Old Google Sheets For Reference</h1>
        <p className="mt-2 text-sm font-semibold text-amberline">
          This imports old sheet data for reference only. It will not write anything back to Google Sheets.
        </p>
        <p className="mt-2 text-sm text-black/65">
          Fresh Start Mode means new approved titles should be created directly inside Marvelous Production OS.
        </p>
        <div className="mt-5">
          <SyncButton />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Title Bank Archive Source</h2>
          <dl className="mt-3 space-y-2 text-sm text-black/65">
            <div>
              <dt className="font-semibold text-ink">Spreadsheet ID</dt>
              <dd className="break-all">{TITLE_BANK_SPREADSHEET_ID}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Tab</dt>
              <dd>{TITLE_BANK_TAB}</dd>
            </div>
          </dl>
        </article>
        <article className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Production Archive Source</h2>
          <dl className="mt-3 space-y-2 text-sm text-black/65">
            <div>
              <dt className="font-semibold text-ink">Spreadsheet ID</dt>
              <dd className="break-all">{PRODUCTION_SPREADSHEET_ID}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Tabs</dt>
              <dd>{PRODUCTION_TABS.join(", ")}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Last Import</h2>
        <p className="mt-2 text-sm text-black/65">{data.lastSyncAt || "No archive import has completed yet."}</p>
        {data.setupWarning ? (
          <p className="mt-3 rounded-md border border-amberline/30 bg-[#fff8ec] px-3 py-2 text-sm font-medium text-amberline">
            {data.setupWarning}
          </p>
        ) : null}
      </section>
    </div>
  );
}
