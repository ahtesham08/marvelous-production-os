import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAppMode } from "@/lib/appMode";
import { generateUserActionNotifications, getUnreadNotificationCount } from "@/lib/notifications";
import { getCurrentUserContext } from "@/lib/serverAuth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marvelous Production OS",
  description: "Production dashboard for title aging, bottlenecks, and operations follow-up."
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/command-center", label: "Command Center" },
  { href: "/brainstorming", label: "Brainstorming" },
  { href: "/brainstorming/sessions", label: "B. Sessions" },
  { href: "/brainstorming/submit", label: "B. Submit" },
  { href: "/brainstorming/import", label: "B. Import" },
  { href: "/brainstorming/rework", label: "B. Rework" },
  { href: "/titles/new", label: "New Title" },
  { href: "/titles", label: "Titles" },
  { href: "/titles/import-approved", label: "Import Approved" },
  { href: "/due-today", label: "Due Today" },
  { href: "/overdue", label: "Overdue" },
  { href: "/blocked", label: "Blocked" },
  { href: "/activity", label: "Activity" },
  { href: "/supervisors", label: "Supervisors" },
  { href: "/team", label: "Team" },
  { href: "/operations", label: "Operations" },
  { href: "/reports", label: "Reports" },
  { href: "/notifications", label: "Notifications" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/export", label: "Export" },
  { href: "/admin/launch-checklist", label: "Launch" },
  { href: "/admin/import-old-sheets", label: "Old Import" }
];

const adminPrefixes = ["/admin"];

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const userContext = await getCurrentUserContext();
  const mode = getAppMode();
  const role = userContext.user?.role ?? (mode === "demo" ? "Admin" : "Viewer");
  const userName = userContext.user?.name ?? (userContext.authEmail || "Demo User");
  await generateUserActionNotifications(userContext.user);
  const unreadCount = await getUnreadNotificationCount(userContext.user);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Script id="marvelous-theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                localStorage.removeItem('marvelous-theme');
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
              } catch (error) {}
            })();
          `}
        </Script>
        <header className="border-b border-black/10 bg-paper/85 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="text-xl font-semibold tracking-[0] text-ink">
                Marvelous Production OS
              </Link>
              <ThemeToggle />
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-md bg-ink px-2 py-1 text-white">{modeLabel(mode)}</span>
              <span className="rounded-md bg-white px-2 py-1 text-moss">{userName} | {role}</span>
              <Link href="/notifications" className={unreadCount > 0 ? "rounded-md bg-red-50 px-2 py-1 text-danger" : "rounded-md bg-white px-2 py-1 text-moss"}>
                Notifications: {unreadCount} unread
              </Link>
            </div>
            <nav className="flex flex-wrap gap-2">
              {visibleNav(navItems, String(role)).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm transition hover:border-moss hover:text-moss"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <div className="lg:flex">
          <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-black/10 bg-white p-4 lg:block">
            <div className="flex items-start justify-between gap-3">
              <Link href="/" className="block text-xl font-semibold text-ink">
                Marvelous Production OS
              </Link>
              <ThemeToggle />
            </div>
            <div className="mt-2 rounded-md bg-[#eef1eb] px-2 py-1 text-xs font-semibold uppercase text-moss">
              {modeLabel(mode)}
            </div>
            <div className="mt-2 rounded-md border border-black/10 bg-[#f6f4ee] px-2 py-2 text-xs text-black/65">
              <div className="font-semibold text-ink">{userName}</div>
              <div>{role}</div>
              {userContext.message ? <div className="mt-1 text-danger">{userContext.message}</div> : null}
            </div>
            <Link
              href="/notifications"
              className={
                unreadCount > 0
                  ? "mt-2 block rounded-md border border-red-200 bg-red-50 px-2 py-2 text-xs font-semibold text-danger transition hover:border-danger"
                  : "mt-2 block rounded-md border border-black/10 bg-white px-2 py-2 text-xs font-semibold text-moss transition hover:border-moss"
              }
            >
              Notifications: {unreadCount} unread
            </Link>
            <nav className="mt-5 space-y-1">
              {visibleNav(navItems, String(role)).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-black/70 transition hover:bg-[#f6f4ee] hover:text-moss"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}

function modeLabel(mode: string) {
  if (mode === "production") return "Production Mode";
  if (mode === "local") return "Local Mode";
  return "Demo Mode";
}

function visibleNav(items: typeof navItems, role: string) {
  if (role === "Admin") return items;
  if (role === "Operations Supervisor") {
    return items.filter(
      (item) =>
        !item.href.startsWith("/admin/users") &&
        !item.href.includes("import-old-sheets") &&
        item.href !== "/titles/import-approved"
    );
  }
  if (role === "Supervisor") {
    return items.filter((item) => !adminPrefixes.some((prefix) => item.href.startsWith(prefix)) && !["/operations"].includes(item.href));
  }
  if (role === "Viewer") {
    return items.filter((item) => ["/", "/titles", "/team", "/reports", "/notifications", "/onboarding"].includes(item.href));
  }
  return items.filter((item) => ["/", "/titles", "/dashboard/viewer", "/notifications", "/onboarding"].includes(item.href));
}
