/**
 * Sidebar navigation, grouped by job. Role visibility rules are the same ones the
 * old flat menu used (see visibleNavItems) so nobody gains or loses access.
 */
export type NavIcon =
  | "home"
  | "command"
  | "bell"
  | "lightbulb"
  | "calendar"
  | "send"
  | "clipboard"
  | "rotate"
  | "list"
  | "plus"
  | "upload"
  | "clock"
  | "alert"
  | "ban"
  | "flame"
  | "activity"
  | "users"
  | "contact"
  | "wrench"
  | "chart"
  | "book"
  | "userCog"
  | "download"
  | "rocket"
  | "archive"
  | "gauge";

export type NavItem = { href: string; label: string; icon: NavIcon };
export type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Home", icon: "home" },
      { href: "/command-center", label: "Command Center", icon: "command" },
      { href: "/notifications", label: "Notifications", icon: "bell" }
    ]
  },
  {
    label: "Titles",
    items: [
      { href: "/titles", label: "All Titles", icon: "list" },
      { href: "/titles/new", label: "New Title", icon: "plus" },
      { href: "/titles/import-approved", label: "Import Approved", icon: "upload" },
      { href: "/due-today", label: "Due Today", icon: "clock" },
      { href: "/overdue", label: "Overdue", icon: "alert" },
      { href: "/blocked", label: "Blocked", icon: "ban" },
      { href: "/titles/rotting", label: "Rotting", icon: "flame" }
    ]
  },
  {
    label: "Brainstorming",
    items: [
      { href: "/brainstorming", label: "Overview", icon: "lightbulb" },
      { href: "/brainstorming/sessions", label: "Sessions", icon: "calendar" },
      { href: "/brainstorming/submit", label: "Submit Idea", icon: "send" },
      { href: "/brainstorming/import", label: "WhatsApp Import", icon: "clipboard" },
      { href: "/brainstorming/rework", label: "Rework", icon: "rotate" }
    ]
  },
  {
    label: "Team",
    items: [
      { href: "/operations", label: "Operations", icon: "wrench" },
      { href: "/supervisors", label: "Supervisors", icon: "users" },
      { href: "/team", label: "Team", icon: "contact" },
      { href: "/activity", label: "Activity", icon: "activity" },
      { href: "/reports", label: "Reports", icon: "chart" },
      { href: "/onboarding", label: "Onboarding", icon: "book" }
    ]
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/users", label: "Users", icon: "userCog" },
      { href: "/admin/export", label: "Export", icon: "download" },
      { href: "/admin/launch-checklist", label: "Launch Checklist", icon: "rocket" },
      { href: "/admin/import-old-sheets", label: "Old Sheets Import", icon: "archive" }
    ]
  }
];

const ROLE_DASHBOARDS: Record<string, string> = {
  Supervisor: "/dashboard/supervisor",
  Proofreader: "/dashboard/proofreader",
  Editor: "/dashboard/editor",
  "VO Manager": "/dashboard/vo",
  Writer: "/dashboard/writer",
  Viewer: "/dashboard/viewer"
};

function isVisible(href: string, role: string) {
  if (role === "Admin") return true;
  if (role === "Operations Supervisor") {
    return !href.startsWith("/admin/users") && !href.includes("import-old-sheets") && href !== "/titles/import-approved";
  }
  if (role === "Supervisor") return !href.startsWith("/admin") && href !== "/operations";
  if (role === "Viewer") return ["/", "/titles", "/team", "/reports", "/notifications", "/onboarding"].includes(href);
  return ["/", "/titles", "/notifications", "/onboarding"].includes(href);
}

export function visibleNavGroups(role: string): NavGroup[] {
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isVisible(item.href, role))
  })).filter((group) => group.items.length > 0);

  const dashboard = ROLE_DASHBOARDS[role];
  if (dashboard && groups[0]) {
    groups[0].items.splice(1, 0, { href: dashboard, label: "My Dashboard", icon: "gauge" });
  }
  return groups;
}

/** Longest matching nav href wins, so /titles/new highlights "New Title", not "All Titles". */
export function activeNavHref(pathname: string, groups: NavGroup[]) {
  let best = "";
  for (const group of groups) {
    for (const item of group.items) {
      const matches = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
      if (matches && item.href.length > best.length) best = item.href;
    }
  }
  return best;
}
