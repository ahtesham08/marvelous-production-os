"use client";

import { useRouter } from "next/navigation";
import type { NotificationRecord } from "@/lib/types";

type NotificationsListProps = {
  notifications: NotificationRecord[];
};

export function NotificationsList({ notifications }: NotificationsListProps) {
  const router = useRouter();

  async function openNotification(notification: NotificationRecord) {
    if (!notification.id.startsWith("derived-")) {
      await fetch(`/api/notifications/${notification.id}`, { method: "PATCH" });
    }
    router.push(notification.link_url || "/notifications");
    router.refresh();
  }

  if (notifications.length === 0) {
    return (
      <p className="rounded-lg border border-black/10 bg-[#f6f4ee] p-8 text-center text-sm text-black/55">
        No notifications yet.
      </p>
    );
  }

  return (
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
              {notification.read_at ? <p className="mt-1 text-xs font-semibold text-black/45">Read</p> : null}
            </div>
            {notification.link_url ? (
              <button
                type="button"
                onClick={() => openNotification(notification)}
                className="focus-ring rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-moss"
              >
                Open Title
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
