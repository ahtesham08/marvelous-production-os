import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { normalizeTitle } from "@/lib/titleNormalizer";
import type { ActivityLogEntry, ProductionDetail, TitleRecord, UserRecord } from "@/lib/types";

type LocalStore = {
  titles: TitleRecord[];
  users: UserRecord[];
};

type LocalFreshInput = {
  title: string;
  channel: string;
  priority: string;
  supervisor: string | null;
  writer: string | null;
  helpDocUrl: string | null;
  dueDate: string | null;
  notes: string | null;
};

type LocalTitlePatch = Partial<TitleRecord>;
type LocalProductionPatch = Partial<ProductionDetail>;

const storePath = path.join(process.cwd(), ".data", "fresh-start-store.json");
const seedUsers: Array<Pick<UserRecord, "name" | "email" | "role" | "active" | "default_channel" | "default_supervisor">> = [
  { name: "Ahtesham", email: null, role: "Admin", active: true, default_channel: null, default_supervisor: null },
  { name: "Kamran", email: null, role: "Supervisor", active: true, default_channel: "MV N", default_supervisor: null },
  { name: "Farhan", email: null, role: "Supervisor", active: true, default_channel: "LL", default_supervisor: null },
  { name: "Raktim", email: null, role: "Supervisor", active: true, default_channel: "MV N", default_supervisor: null },
  { name: "Deepak", email: null, role: "Operations Supervisor", active: true, default_channel: null, default_supervisor: null }
];

export async function getLocalTitleRecords() {
  const store = await readStore();
  return store.titles;
}

export async function createLocalFreshTitles(inputs: LocalFreshInput[]) {
  const store = await readStore();
  const now = new Date().toISOString();
  const approvedDate = now.slice(0, 10);
  const created: Array<{ id: string; title: string }> = [];

  for (const input of inputs) {
    const id = randomUUID();
    const detail: ProductionDetail = {
      title_id: id,
      word_count: null,
      clip_finder: null,
      proofreader_text: null,
      vo_artist: null,
      editor_text: null,
      production_status: "Approved",
      proofreading_status: null,
      vo_status: null,
      editing_status: null,
      final_status: null
    };
    const activity: ActivityLogEntry = {
      id: randomUUID(),
      title_id: id,
      action: "Created approved title",
      old_value: null,
      new_value: "Fresh Start",
      performed_by: null,
      created_at: now
    };

    store.titles.unshift({
      id,
      title: input.title,
      normalized_title: normalizeTitle(input.title),
      priority: input.priority,
      source: "Fresh Start Local",
      approved_date: approvedDate,
      imported_supervisor_name: input.supervisor,
      imported_writer_name: input.writer,
      expected_word_count: null,
      ahtesham_directives: null,
      help_doc_url: input.helpDocUrl,
      script_doc_url: null,
      writer_due_date: input.dueDate,
      writer_assigned_at: input.writer ? now : null,
      help_doc_ready_at: null,
      script_submitted_at: null,
      blocked: false,
      blocked_reason: null,
      blocked_by: null,
      blocked_at: null,
      blocked_category: null,
      completed_at: null,
      notes: input.notes,
      current_status: "Approved",
      match_status: "Fresh Start",
      sheet_write_back_status: null,
      sheet_write_back_at: null,
      source_sheet_id: null,
      source_sheet_tab: null,
      source_row_number: null,
      production_sheet_id: null,
      production_sheet_tab: null,
      production_row_number: null,
      last_synced_at: null,
      created_at: now,
      updated_at: now,
      channels: { name: input.channel },
      production_details: [detail],
      activity_log: [activity]
    });

    created.push({ id, title: input.title });
  }

  await writeStore(store);
  return created;
}

export async function getLocalTitleRecord(titleId: string) {
  const store = await readStore();
  const title = store.titles.find((item) => item.id === titleId);
  if (!title) throw new Error("Title not found in local Fresh Start store.");
  return title;
}

export async function getLocalUsers() {
  const store = await readStore();
  return store.users;
}

export async function upsertLocalUser(input: Partial<UserRecord> & { name: string; role: string }) {
  const store = await readStore();
  const now = new Date().toISOString();
  const existingIndex = input.id ? store.users.findIndex((user) => user.id === input.id) : -1;
  const user: UserRecord = {
    id: input.id || randomUUID(),
    name: input.name,
    email: input.email ?? null,
    role: input.role,
    active: input.active ?? true,
    default_channel: input.default_channel ?? null,
    default_supervisor: input.default_supervisor ?? null,
    created_at: input.created_at ?? now,
    updated_at: now
  };

  if (existingIndex >= 0) {
    store.users[existingIndex] = { ...store.users[existingIndex], ...user };
  } else {
    store.users.push(user);
  }

  await writeStore(store);
  return user;
}

export async function updateLocalTitleRecord(
  titleId: string,
  titlePatch: LocalTitlePatch,
  productionPatch: LocalProductionPatch,
  changes: Array<{ field: string; oldValue: string | null; newValue: string | null }>
) {
  const store = await readStore();
  const index = store.titles.findIndex((item) => item.id === titleId);
  if (index === -1) throw new Error("Title not found in local Fresh Start store.");

  const now = new Date().toISOString();
  const existing = store.titles[index];
  const existingDetails = Array.isArray(existing.production_details)
    ? existing.production_details
    : existing.production_details
      ? [existing.production_details]
      : [];
  const existingActivity = existing.activity_log ?? [];
  const detail = {
    ...(existingDetails[0] ?? {
      title_id: titleId,
      word_count: null,
      clip_finder: null,
      proofreader_text: null,
      vo_artist: null,
      editor_text: null,
      production_status: null,
      proofreading_status: null,
      vo_status: null,
      editing_status: null,
      final_status: null
    }),
    ...productionPatch,
    updated_at: now
  };

  store.titles[index] = {
    ...existing,
    ...titlePatch,
    updated_at: now,
    production_details: [detail],
    activity_log: [
      ...changes.map((change) => ({
        id: randomUUID(),
        title_id: titleId,
        action: `Updated ${change.field}`,
        old_value: change.oldValue,
        new_value: change.newValue,
        performed_by: null,
        created_at: now
      })),
      ...existingActivity
    ]
  };

  await writeStore(store);
}

async function readStore(): Promise<LocalStore> {
  try {
    const raw = await readFile(storePath, "utf8");
    return withSeeds(JSON.parse(raw) as Partial<LocalStore>);
  } catch {
    return withSeeds({ titles: [] });
  }
}

async function writeStore(store: LocalStore) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

function withSeeds(store: Partial<LocalStore>): LocalStore {
  const now = new Date().toISOString();
  const users = [...(store.users ?? [])];
  for (const seed of seedUsers) {
    if (!users.some((user) => user.name.toLowerCase() === seed.name.toLowerCase())) {
      users.push({
        id: randomUUID(),
        ...seed,
        created_at: now,
        updated_at: now
      });
    }
  }
  return {
    titles: store.titles ?? [],
    users
  };
}
