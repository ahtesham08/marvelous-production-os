export type Severity = "Low" | "Medium" | "High" | "Critical";

export type AgeBucket = "Fresh" | "Needs Attention" | "Delayed" | "Serious Delay" | "Critical";

export type AlertType =
  | "Missing Supervisor"
  | "Missing Writer"
  | "Missing Help Doc"
  | "Script Overdue"
  | "Word Count Missing"
  | "VO Missing"
  | "Editor Missing"
  | "Proofreader Missing"
  | "Stale Title"
  | "Duplicate Title"
  | "Not Found In Production Sheet"
  | "Not Found In Title Bank";

export type StatusValue =
  | "Approved"
  | "Assigned To Supervisor"
  | "Help Doc Pending"
  | "Help Doc Ready"
  | "Writer Pending"
  | "Writer Assigned"
  | "Script In Progress"
  | "Script Submitted"
  | "Word Count Pending"
  | "Proofreading Pending"
  | "Proofreading Done"
  | "VO Pending"
  | "VO Assigned"
  | "VO Done"
  | "Editing Pending"
  | "Editing In Progress"
  | "Editing Done"
  | "Completed"
  | "On Hold"
  | "Cancelled";

export type TitleBankRow = {
  title: string;
  normalizedTitle: string;
  supervisorName: string | null;
  writerName: string | null;
  sourceRowNumber: number;
};

export type ProductionRow = {
  title: string;
  normalizedTitle: string;
  channelName: string;
  sourceRowNumber: number;
  wordCount: number | null;
  writerName: string | null;
  voArtist: string | null;
  clipFinder: string | null;
  editorName: string | null;
  proofreaderName: string | null;
};

export type TitleRecord = {
  id: string;
  title: string;
  normalized_title: string | null;
  priority: string | null;
  source: string | null;
  approved_date: string | null;
  imported_supervisor_name: string | null;
  imported_writer_name: string | null;
  help_doc_url: string | null;
  script_doc_url: string | null;
  writer_due_date: string | null;
  writer_assigned_at: string | null;
  help_doc_ready_at: string | null;
  script_submitted_at: string | null;
  blocked: boolean | null;
  blocked_reason: string | null;
  blocked_by: string | null;
  blocked_at: string | null;
  blocked_category: string | null;
  completed_at: string | null;
  notes: string | null;
  current_status: StatusValue | string | null;
  match_status: string | null;
  sheet_write_back_status: string | null;
  sheet_write_back_at: string | null;
  source_sheet_id: string | null;
  source_sheet_tab: string | null;
  source_row_number: number | null;
  production_sheet_id: string | null;
  production_sheet_tab: string | null;
  production_row_number: number | null;
  last_synced_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  channels?: {
    name: string | null;
  } | null;
  production_details?: ProductionDetail | ProductionDetail[] | null;
  activity_log?: ActivityLogEntry[] | null;
};

export type ProductionDetail = {
  id?: string;
  title_id?: string;
  word_count: number | null;
  clip_finder: string | null;
  proofreader_text: string | null;
  vo_artist: string | null;
  editor_text: string | null;
  production_status: string | null;
  proofreading_status: string | null;
  vo_status: string | null;
  editing_status: string | null;
  final_status: string | null;
};

export type UserRole =
  | "Admin"
  | "Supervisor"
  | "Operations Supervisor"
  | "Writer"
  | "Editor"
  | "Proofreader"
  | "VO Manager"
  | "Viewer";

export type UserRecord = {
  id: string;
  name: string;
  email: string | null;
  role: UserRole | string;
  active: boolean;
  default_channel: string | null;
  default_supervisor: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type BrainstormingSessionStatus = "Draft" | "Live" | "Completed" | "Archived";

export type BrainstormingTitleStatus =
  | "Proposed"
  | "Approved"
  | "Rejected"
  | "Hold"
  | "Needs Better Angle"
  | "Needs Research"
  | "Duplicate"
  | "Converted To Production";

export type BrainstormingSession = {
  id: string;
  name: string;
  session_date: string;
  channels: string[] | null;
  participants: string[] | null;
  notes: string | null;
  status: BrainstormingSessionStatus | string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type BrainstormingTitle = {
  id: string;
  session_id: string | null;
  title: string;
  normalized_title: string | null;
  channel: string | null;
  priority: string | null;
  submitted_by: string | null;
  submitted_by_name: string | null;
  supervisor: string | null;
  short_pitch: string | null;
  why_good: string | null;
  reference_links: string | null;
  suggested_writer: string | null;
  notes: string | null;
  ahtesham_notes: string | null;
  discussion_summary: string | null;
  status: BrainstormingTitleStatus | string;
  decision_status: string | null;
  decision_reason: string | null;
  decided_by: string | null;
  decided_by_name: string | null;
  decided_at: string | null;
  converted_title_id: string | null;
  converted_at: string | null;
  duplicate_warning: string | null;
  created_at: string | null;
  updated_at: string | null;
  brainstorming_discussion_notes?: BrainstormingDiscussionNote[];
};

export type BrainstormingDiscussionNote = {
  id: string;
  brainstorming_title_id: string | null;
  note_text: string;
  author_id: string | null;
  author_name: string | null;
  created_at: string | null;
};

export type BrainstormingSummary = {
  todaySessions: number;
  pendingProposed: number;
  approvedNotConverted: number;
  needsBetterAngle: number;
  needsResearch: number;
};

export type TitleAlert = {
  type: AlertType;
  severity: Severity;
  message: string;
};

export type ActivityLogEntry = {
  id: string;
  title_id: string | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  performed_by: string | null;
  created_at: string | null;
};

export type EnrichedTitle = {
  id: string;
  title: string;
  channel: string;
  supervisor: string;
  writer: string;
  status: string;
  priority: string;
  approvedDate: string | null;
  ageDays: number;
  ageBucket: AgeBucket;
  missingFields: string[];
  alerts: TitleAlert[];
  severity: Severity;
  nextAction: string;
  lastUpdatedAt: string | null;
  sourceRow: string;
  productionRow: string;
  matchStatus: string;
  wordCount: number | null;
  voArtist: string | null;
  editor: string | null;
  proofreader: string | null;
  clipFinder: string | null;
  productionStatus: string | null;
  helpDocUrl: string | null;
  scriptDocUrl: string | null;
  writerDueDate: string | null;
  writerAssignedAt: string | null;
  helpDocReadyAt: string | null;
  scriptSubmittedAt: string | null;
  blocked: boolean;
  blockedReason: string | null;
  blockedBy: string | null;
  blockedAt: string | null;
  blockedCategory: string | null;
  completedAt: string | null;
  notes: string | null;
  sheetWriteBackStatus: string | null;
  sheetWriteBackAt: string | null;
  activityLog?: ActivityLogEntry[];
};

export type SupervisorSummary = {
  name: string;
  total: number;
  notStarted: number;
  missingHelpDocs: number;
  missingWriters: number;
  overdueTitles: number;
  completedThisWeek: number;
  criticalDelays: number;
};

export type OperationsQueue = {
  wordCountMissing: EnrichedTitle[];
  voMissing: EnrichedTitle[];
  editorMissing: EnrichedTitle[];
  proofreaderMissing: EnrichedTitle[];
  notMigrated: EnrichedTitle[];
  productionOnly: EnrichedTitle[];
};

export type DashboardData = {
  setupWarning?: string;
  titles: EnrichedTitle[];
  cards: {
    label: string;
    value: number;
    tone: "neutral" | "warning" | "danger" | "success";
  }[];
  supervisorSummary: SupervisorSummary[];
  operationsQueue: OperationsQueue;
  dailyReport: string;
  completedThisWeek: EnrichedTitle[];
  lastSyncAt: string | null;
  brainstormingSummary?: BrainstormingSummary;
};
