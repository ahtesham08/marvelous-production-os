import { NotificationsList } from "@/components/notifications/NotificationsList";
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
        <NotificationsList notifications={notifications} />
      </section>
    </div>
  );
}
