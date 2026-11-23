import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Script from "next/script";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { visibleNavGroups } from "@/lib/navigation";
import { getAppMode } from "@/lib/appMode";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { getCurrentUserContext } from "@/lib/serverAuth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marvelous Production OS",
  description: "Production dashboard for title aging, bottlenecks, and operations follow-up."
};

const publicPaths = ["/login", "/auth/callback", "/not-approved"];

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-mpos-pathname") ?? "";
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  const userContext = await getCurrentUserContext();
  const mode = getAppMode();

  if (mode === "production" && !isPublicPath) {
    if (!userContext.isAuthenticated) {
      redirect(`/login?next=${encodeURIComponent(pathname || "/")}`);
    }

    if (!userContext.isApproved) {
      redirect("/not-approved");
    }
  }

  if (userContext.isAuthenticated && pathname === "/login") {
    redirect("/");
  }

  const role = userContext.user?.role ?? (mode === "demo" ? "Admin" : "Viewer");
  const userName = userContext.user?.name ?? (userContext.authEmail || "Demo User");
  const unreadCount = isPublicPath ? 0 : await getUnreadNotificationCount(userContext.user).catch(() => 0);

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
        {isPublicPath ? (
          <main className="min-h-screen px-4 py-6 sm:px-6">{children}</main>
        ) : (
        <div className="lg:flex">
          <AppSidebar
            groups={visibleNavGroups(String(role))}
            userName={userName}
            role={String(role)}
            modeLabel={modeLabel(mode)}
            unreadCount={unreadCount}
            message={userContext.message}
          />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1600px]">{children}</div>
          </main>
        </div>
        )}
      </body>
    </html>
  );
}

function modeLabel(mode: string) {
  if (mode === "production") return "Live";
  if (mode === "local") return "Local";
  return "Demo";
}
