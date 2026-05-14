import { BrainstormingTitleList } from "@/components/brainstorming/BrainstormingTitleList";
import { getBrainstormingTitles } from "@/lib/brainstorming";

export const dynamic = "force-dynamic";

export default async function BrainstormingTitleBankPage() {
  const titles = await getBrainstormingTitles();
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Title Bank</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">All Brainstorming Ideas</h1>
        <p className="mt-2 text-sm text-black/60">Every proposed, approved, rejected, duplicate, and rework idea across sessions.</p>
      </div>
      <BrainstormingTitleList titles={titles} />
    </div>
  );
}
