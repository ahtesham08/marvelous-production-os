import { BrainstormingTitleList } from "@/components/brainstorming/BrainstormingTitleList";
import { getBrainstormingTitles } from "@/lib/brainstorming";

export const dynamic = "force-dynamic";

export default async function BrainstormingReworkPage() {
  const titles = (await getBrainstormingTitles()).filter((title) => ["Needs Better Angle", "Needs Research", "Hold"].includes(title.status));
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-amberline">Rework Queue</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Needs Better Angle / Research / Hold</h1>
        <p className="mt-2 text-sm text-black/60">Ideas that should come back after the supervisor improves the angle or research.</p>
      </div>
      <BrainstormingTitleList titles={titles} />
    </div>
  );
}
