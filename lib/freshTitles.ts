import { normalizeTitle } from "@/lib/titleNormalizer";
import { createLocalFreshTitles } from "@/lib/localStore";
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabaseServer";
import { isProductionMode } from "@/lib/appMode";
import { FRESH_START_CHANNELS, PRIORITIES } from "@/lib/sharedConstants";

export { FRESH_START_CHANNELS, PRIORITIES };

export type FreshTitleInput = {
  title: string;
  channel: string;
  priority?: string | null;
  supervisor?: string | null;
  writer?: string | null;
  helpDocUrl?: string | null;
  dueDate?: string | null;
  notes?: string | null;
};

export async function createFreshTitle(input: FreshTitleInput) {
  const created = await createFreshTitles([input]);
  return created[0];
}

export async function createFreshTitles(inputs: FreshTitleInput[]) {
  const now = new Date().toISOString();
  const approvedDate = now.slice(0, 10);
  const cleanInputs = inputs.map(normalizeFreshInput).filter((input) => input.title.length > 0);

  if (cleanInputs.length === 0) {
    throw new Error("Add at least one title.");
  }

  if (!hasSupabaseAdminConfig()) {
    if (isProductionMode()) {
      throw new Error("Production mode requires Supabase. Add Supabase environment variables before creating titles.");
    }
    return createLocalFreshTitles(cleanInputs);
  }

  const supabase = createSupabaseAdminClient();
  const channels = await ensureChannels();

  const created: Array<{ id: string; title: string }> = [];

  for (const input of cleanInputs) {
    const channelId = channels.get(input.channel);
    if (!channelId) {
      throw new Error(`Unknown channel: ${input.channel}`);
    }

    const { data, error } = await supabase
      .from("titles")
      .insert({
        title: input.title,
        normalized_title: normalizeTitle(input.title),
        channel_id: channelId,
        priority: input.priority || "Normal",
        source: "Fresh Start",
        approved_date: approvedDate,
        imported_supervisor_name: input.supervisor,
        imported_writer_name: input.writer,
        help_doc_url: input.helpDocUrl,
        writer_due_date: input.dueDate,
        notes: input.notes,
        current_status: "Approved",
        match_status: "Fresh Start",
        last_synced_at: null,
        created_at: now,
        updated_at: now
      })
      .select("id,title")
      .single();

    if (error) throw error;

    const { error: detailError } = await supabase.from("production_details").insert({
      title_id: data.id,
      production_status: "Approved",
      created_at: now,
      updated_at: now
    });
    if (detailError) throw detailError;

    const { error: activityError } = await supabase.from("activity_log").insert({
      title_id: data.id,
      action: "Created approved title",
      old_value: null,
      new_value: "Fresh Start"
    });
    if (activityError) throw activityError;

    created.push(data);
  }

  return created;
}

export function parseBrainstormingText(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.includes("|")
        ? line.split("|").map((part) => part.trim())
        : [line.trim(), "", "", "", ""];

      return normalizeFreshInput({
        title: parts[0] ?? "",
        channel: parts[1] ?? "",
        supervisor: parts[2] ?? "",
        priority: parts[3] ?? "",
        writer: parts[4] ?? ""
      });
    })
    .filter((input) => input.title.length > 0);
}

async function ensureChannels() {
  const supabase = createSupabaseAdminClient();
  await supabase.from("channels").upsert(
    FRESH_START_CHANNELS.map((name) => ({
      name,
      sheet_tab_name: name,
      active: true,
      updated_at: new Date().toISOString()
    })),
    { onConflict: "name" }
  );

  const { data, error } = await supabase.from("channels").select("id,name");
  if (error) throw error;
  return new Map((data ?? []).map((channel) => [channel.name, channel.id]));
}

type NormalizedFreshInput = {
  title: string;
  channel: string;
  priority: string;
  supervisor: string | null;
  writer: string | null;
  helpDocUrl: string | null;
  dueDate: string | null;
  notes: string | null;
};

function normalizeFreshInput(input: FreshTitleInput): NormalizedFreshInput {
  return {
    title: clean(input.title) ?? "",
    channel: normalizeChannel(input.channel),
    priority: normalizePriority(input.priority),
    supervisor: clean(input.supervisor),
    writer: clean(input.writer),
    helpDocUrl: clean(input.helpDocUrl),
    dueDate: clean(input.dueDate),
    notes: clean(input.notes)
  };
}

function normalizeChannel(value: string | null | undefined) {
  const cleaned = clean(value);
  if (!cleaned) return "MV N";
  const match = FRESH_START_CHANNELS.find((channel) => channel.toLowerCase() === cleaned.toLowerCase());
  return match ?? "MV N";
}

function normalizePriority(value: string | null | undefined) {
  const cleaned = clean(value);
  if (!cleaned) return "Normal";
  const match = PRIORITIES.find((priority) => priority.toLowerCase() === cleaned.toLowerCase());
  return match ?? "Normal";
}

function clean(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}
