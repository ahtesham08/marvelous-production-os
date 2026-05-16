import Link from "next/link";
import { getNotificationsForUser } from "@/lib/notifications";
import { getCurrentUserContext } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const context = await getCurrentUserContext();
  const notifications = await getNotificationsForUser(context.user, 50);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-soft">
        <p className="text-sm font-semibold uppercase text-moss">Team Alerts</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Notifications</h1>
        <p className="mt-2 text-sm text-black/60">
          Approval updates and team workflow alerts appear here. WhatsApp and email notifications are still disabled.
        </p>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="rounded-lg border border-black/10 bg-[#f6f4ee] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-moss">{notification.type}</div>
                  <h2 className="mt-1 text-lg font-semibold text-ink">{notification.message}</h2>
                  <p className="mt-1 text-xs text-black/50">
                    {notification.created_at ? new Date(notification.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""}
                  </p>
                </div>
                {notification.link_url ? (
                  <Link href={notification.link_url} className="focus-ring rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-moss">
                    Open Title
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {notifications.length === 0 ? (
          <p className="rounded-lg border border-black/10 bg-[#f6f4ee] p-8 text-center text-sm text-black/55">
            No notifications yet.
          </p>
        ) : null}
      </section>
    </div>
  );
}
