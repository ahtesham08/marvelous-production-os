import { BrainstormingTitleList } from "@/components/brainstorming/BrainstormingTitleList";
import { getBrainstormingTitles } from "@/lib/brainstorming";

export const dynamic = "force-dynamic";

export default async function BrainstormingApprovedPage() {
  const titles = (await getBrainstormingTitles()).filter((title) => title.status === "Approved" || title.status === "Converted To Production");
  return <BrainstormingSimplePage kicker="After Meeting" title="Approved Brainstorming Titles" description="Approved ideas and titles already converted to production." titles={titles} />;
}

function BrainstormingSimplePage({ kicker, title, description, titles }: { kicker: string; title: string; description: string; titles: Awaited<ReturnType<typeof getBrainstormingTitles>> }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">{kicker}</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-black/60">{description}</p>
      </div>
      <BrainstormingTitleList titles={titles} />
    </div>
  );
}
