"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { NotificationRecord } from "@/lib/types";

type NotificationsListProps = {
  notifications: NotificationRecord[];
  unreadCount: number;
};

const severityClass: Record<string, string> = {
  Critical: "border-red-400 bg-red-50 text-red-950",
  High: "border-orange-300 bg-orange-50 text-orange-950",
  Medium: "border-amber-300 bg-amber-50 text-amber-950",
  Low: "border-black/10 bg-[#f6f4ee] text-ink"
};

export function NotificationsList({ notifications, unreadCount }: NotificationsListProps) {
  const router = useRouter();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const visibleNotifications = useMemo(
    () => notifications.map((notification) => (readIds.has(notification.id) ? { ...notification, read_at: new Date().toISOString() } : notification)),
    [notifications, readIds]
  );
  const localUnreadCount = Math.max(0, unreadCount - readIds.size);

  async function openNotification(notification: NotificationRecord) {
    await markRead(notification);
    router.push(notification.action_url || notification.link_url || "/notifications");
    router.refresh();
  }

  async function markRead(notification: NotificationRecord) {
    if (!notification.id.startsWith("derived-") && !notification.read_at) {
      await fetch(`/api/notifications/${notification.id}`, { method: "PATCH" });
    }
    setReadIds((current) => new Set([...current, notification.id]));
  }

  async function markAllRead() {
    await fetch("/api/notifications/mark-all", { method: "POST" });
    setReadIds(new Set(notifications.map((notification) => notification.id)));
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-semibold text-black/65">
          {localUnreadCount} unread notification{localUnreadCount === 1 ? "" : "s"}
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={localUnreadCount === 0}
          className="focus-ring rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-moss hover:text-moss disabled:opacity-50"
        >
          Mark All As Read
        </button>
      </div>

      {visibleNotifications.map((notification) => {
        const severity = notification.severity || severityFromMessage(notification.message);
        const isUnread = !notification.read_at;
        return (
          <article
            key={notification.id}
            className={clsx(
              "rounded-lg border p-4 shadow-sm",
              severityClass[severity] ?? severityClass.Low,
              isUnread && "ring-2 ring-ink/10"
            )}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={clsx("rounded-md border px-2 py-1 text-xs font-semibold", severityBadgeClass(severity))}>
                    {severity}
                  </span>
                  <span className="text-sm font-semibold text-moss">{notification.type}</span>
                  <span className={isUnread ? "text-xs font-semibold text-danger" : "text-xs font-semibold text-black/45"}>
                    {isUnread ? "Unread" : "Read"}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-semibold text-ink">{notification.related_title_name || notification.message}</h2>
                <p className="mt-1 text-sm text-black/70">{stripSeverity(notification.message)}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-black/55">
                  {notification.supervisor_name || notification.recipient_name ? (
                    <span>Supervisor: {notification.supervisor_name || notification.recipient_name}</span>
                  ) : null}
                  {notification.due_date ? <span>Due: {notification.due_date}</span> : null}
                  <span>
                    {notification.created_at
                      ? new Date(notification.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                      : ""}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!notification.read_at ? (
                  <button
                    type="button"
                    onClick={() => markRead(notification)}
                    className="focus-ring rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-moss hover:text-moss"
                  >
                    Mark Read
                  </button>
                ) : null}
                {notification.link_url || notification.action_url ? (
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className="focus-ring rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-moss"
                  >
                    {notification.title_id ? "Open Title" : "Take Action"}
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function severityFromMessage(message: string) {
  const match = message.match(/^\[(Critical|High|Medium|Low)\]/);
  return match?.[1] ?? "Low";
}

function stripSeverity(message: string) {
  return message.replace(/^\[(Critical|High|Medium|Low)\]\s*/, "");
}

function severityBadgeClass(severity: string) {
  if (severity === "Critical") return "border-red-500 bg-red-100 text-red-900";
  if (severity === "High") return "border-orange-400 bg-orange-100 text-orange-900";
  if (severity === "Medium") return "border-amber-400 bg-amber-100 text-amber-900";
  return "border-black/10 bg-white text-black/65";
}
