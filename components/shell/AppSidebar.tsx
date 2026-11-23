"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  Activity,
  AlertTriangle,
  Archive,
  Ban,
  Bell,
  BookOpen,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  Clock,
  Contact,
  Download,
  Flame,
  Gauge,
  Home,
  Lightbulb,
  List,
  Menu,
  Plus,
  Rocket,
  RotateCcw,
  Send,
  Upload,
  UserCog,
  Users,
  Wrench,
  X,
  Zap,
  type LucideIcon
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { activeNavHref, type NavGroup, type NavIcon } from "@/lib/navigation";

const ICONS: Record<NavIcon, LucideIcon> = {
  home: Home,
  command: Zap,
  bell: Bell,
  lightbulb: Lightbulb,
  calendar: CalendarDays,
  send: Send,
  clipboard: ClipboardList,
  rotate: RotateCcw,
  list: List,
  plus: Plus,
  upload: Upload,
  clock: Clock,
  alert: AlertTriangle,
  ban: Ban,
  flame: Flame,
  activity: Activity,
  users: Users,
  contact: Contact,
  wrench: Wrench,
  chart: ChartColumn,
  book: BookOpen,
  userCog: UserCog,
  download: Download,
  rocket: Rocket,
  archive: Archive,
  gauge: Gauge
};

type AppSidebarProps = {
  groups: NavGroup[];
  userName: string;
  role: string;
  modeLabel: string;
  unreadCount: number;
  message?: string;
};

export function AppSidebar(props: AppSidebarProps) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <header data-focus-chrome className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-black/10 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/10 bg-white text-ink"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <Link href="/" className="truncate text-base font-semibold text-ink">
          Marvelous Production OS
        </Link>
        <Link
          href="/notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/10 bg-white text-ink"
          aria-label={`Notifications, ${props.unreadCount} unread`}
        >
          <Bell size={17} />
          {props.unreadCount > 0 ? <CountDot count={props.unreadCount} className="absolute -right-1.5 -top-1.5" /> : null}
        </Link>
      </header>

      {/* Mobile drawer backdrop */}
      {open ? <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden /> : null}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-black/10 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0",
          open ? "translate-x-0 shadow-soft" : "-translate-x-full"
        )}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4">
          <Link href="/" className="leading-tight">
            <span className="block text-[15px] font-semibold text-ink">Marvelous</span>
            <span className="block text-xs font-medium uppercase tracking-wide text-moss">Production OS</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/10 text-ink lg:hidden"
              aria-label="Close menu"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="mx-4 mb-2 rounded-md border border-black/10 bg-[#f6f4ee] px-3 py-2">
          <div className="truncate text-sm font-semibold text-ink">{props.userName}</div>
          <div className="flex items-center justify-between gap-2 text-xs text-black/55">
            <span>{props.role}</span>
            <span className="rounded bg-[#eef1eb] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-moss">{props.modeLabel}</span>
          </div>
          {props.message ? <div className="mt-1 text-xs text-danger">{props.message}</div> : null}
        </div>

        <NavList groups={props.groups} pathname={pathname} unreadCount={props.unreadCount} />
      </aside>
    </>
  );
}

function NavList({ groups, pathname, unreadCount }: { groups: NavGroup[]; pathname: string; unreadCount: number }) {
  const active = activeNavHref(pathname, groups);
  return (
    <nav className="flex-1 overflow-y-auto px-2 pb-6">
      {groups.map((group) => (
        <div key={group.label} className="mt-3">
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-black/40">{group.label}</div>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = ICONS[item.icon];
              const isActive = item.href === active;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={clsx(
                      "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
                      isActive ? "bg-ink text-white dark:!bg-[#2b3a33]" : "text-black/70 hover:bg-[#f6f4ee] hover:text-moss"
                    )}
                  >
                    <Icon size={16} className={isActive ? "text-white" : "text-black/45"} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.href === "/notifications" && unreadCount > 0 ? <CountDot count={unreadCount} /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function CountDot({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-semibold leading-5 text-white",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
