import { TitleTableClient, type TitleTableProps } from "@/components/TitleTableClient";
import { toTableTitle } from "@/lib/tableTitle";
import type { EnrichedTitle } from "@/lib/types";

/**
 * Server wrapper: trims each title down to the columns the table needs before the
 * data is serialized into the page, then hands off to the interactive client table.
 */
export function TitleTable({ titles, ...props }: Omit<TitleTableProps, "titles"> & { titles: EnrichedTitle[] }) {
  return <TitleTableClient titles={titles.map(toTableTitle)} {...props} />;
}
