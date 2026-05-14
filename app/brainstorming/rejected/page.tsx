import { BrainstormingTitleList } from "@/components/brainstorming/BrainstormingTitleList";
import { getBrainstormingTitles } from "@/lib/brainstorming";

export const dynamic = "force-dynamic";

export default async function BrainstormingRejectedPage() {
  const titles = (await getBrainstormingTitles()).filter((title) => title.status === "Rejected" || title.status === "Duplicate");
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-danger">After Meeting</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Rejected Titles</h1>
        <p className="mt-2 text-sm text-black/60">Rejected and duplicate ideas with decision reasons.</p>
      </div>
      <BrainstormingTitleList titles={titles} />
    </div>
  );
}
