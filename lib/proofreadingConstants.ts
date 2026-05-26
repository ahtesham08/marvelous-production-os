export const PROOFREADING_STATUSES = [
  "Not Assigned",
  "Not Started",
  "In Review",
  "Feedback Given",
  "Changes Requested",
  "Blocked By Proofreader",
  "Fixed By Supervisor",
  "Ready For Recheck",
  "Approved By Proofreader"
] as const;

export const SCRIPT_QUALITY_RATINGS = [
  "Excellent",
  "Good",
  "Needs Minor Fixes",
  "Needs Major Fixes",
  "Poor",
  "Unusable"
] as const;

export const PROOFREADING_BLOCK_CATEGORIES = [
  "Poor writing quality",
  "Wrong information",
  "Weak research",
  "Missing structure",
  "Repetitive script",
  "AI-like or robotic writing",
  "Does not follow brief",
  "Too short or too thin",
  "Needs major rewrite",
  "Other"
] as const;
