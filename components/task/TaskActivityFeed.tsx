/**
 * TaskActivityFeed — admin-visible activity feed component.
 *
 * Fetches recent activity logs from GET /api/activity and renders
 * a scrollable list of actions (create, update, status change, delete).
 *
 * This is a client component because it fetches data on mount.
 */

"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/date-utils";
import { STATUS_LABELS } from "@/lib/constants";

type ActivityFeedItem = {
  id: string;
  taskId: string;
  taskTitle: string;
  actor: { id: string; name: string; email: string };
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  details: string | null;
  createdAt: string;
};

export function TaskActivityFeed() {
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/activity")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setItems(json.data);
        } else {
          setError(json.error?.message ?? "Failed to load activity.");
        }
      })
      .catch(() => setError("Failed to load activity."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/20 mt-1.5" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-muted-foreground/10 rounded w-3/4" />
                <div className="h-3 bg-muted-foreground/10 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        <p className="text-sm text-muted-foreground">No recent activity.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
      <div className="space-y-0">
        {items.map((item, i) => (
          <div key={item.id} className="flex gap-3 text-sm">
            <div className="flex flex-col items-center pt-1.5">
              <div
                className={`w-2 h-2 rounded-full border-2 ${
                  i === 0
                    ? "bg-primary border-primary"
                    : "bg-muted-foreground/20 border-border"
                }`}
              />
              {i < items.length - 1 && <div className="w-px flex-1 bg-border" />}
            </div>
            <div className="pb-4">
              <p className="leading-snug">
                <span className="font-medium">{item.actor.name}</span>{" "}
                {renderAction(item)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatRelativeTime(item.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function renderAction(item: ActivityFeedItem) {
  const { action, taskId, taskTitle, fromStatus, toStatus } = item;

  switch (action) {
    case "CREATED":
      return (
        <>
          created task{" "}
          <TaskLink taskId={taskId} title={taskTitle} />
        </>
      );
    case "UPDATED":
      return (
        <>
          updated task{" "}
          <TaskLink taskId={taskId} title={taskTitle} />
        </>
      );
    case "DELETED":
      return (
        <>
          deleted task{" "}
          <span className="font-medium">{taskTitle}</span>
        </>
      );
    case "STATUS_CHANGED":
      return (
        <>
          moved task{" "}
          <TaskLink taskId={taskId} title={taskTitle} />{" "}
          {fromStatus ? (
            <>
              from{" "}
              <StatusBadge label={STATUS_LABELS[fromStatus] || fromStatus} variant="secondary" />{" "}
              to{" "}
              <StatusBadge
                label={STATUS_LABELS[toStatus ?? ""] || toStatus || ""}
                variant="primary"
              />
            </>
          ) : (
            <>
              to{" "}
              <StatusBadge
                label={STATUS_LABELS[toStatus ?? ""] || toStatus || ""}
                variant="primary"
              />
            </>
          )}
        </>
      );
    default:
      return (
        <>
          performed {action.toLowerCase()} on task{" "}
          <TaskLink taskId={taskId} title={taskTitle} />
        </>
      );
  }
}

function TaskLink({ taskId, title }: { taskId: string; title: string }) {
  return (
    <a
      href={`/tasks/${taskId}`}
      className="font-medium hover:underline"
    >
      {title}
    </a>
  );
}

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: "primary" | "secondary";
}) {
  const baseClass =
    "inline-block px-1.5 py-0.5 text-xs rounded border";
  const variantClass =
    variant === "primary"
      ? "bg-primary/10 text-primary border-primary/20"
      : "bg-secondary text-secondary-foreground border-border";
  return (
    <span className={`${baseClass} ${variantClass}`}>{label}</span>
  );
}
