import type { ActivityLogDTO } from "@/types/domain";
import { STATUS_LABELS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/date-utils";

type Props = {
  logs: ActivityLogDTO[];
};

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
  return <span className={`${baseClass} ${variantClass}`}>{label}</span>;
}

export function TaskActivityTimeline({ logs }: Props) {
  if (!logs || logs.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Activity</h2>
      <div className="space-y-0">
        {logs.map((log, i) => (
          <div key={log.id} className="flex gap-3 text-sm">
            <div className="flex flex-col items-center pt-1.5">
              <div
                className={`w-2 h-2 rounded-full border-2 ${
                  i === 0
                    ? "bg-primary border-primary"
                    : "bg-muted-foreground/20 border-border"
                }`}
              />
              {i < logs.length - 1 && <div className="w-px flex-1 bg-border" />}
            </div>
            <div className="pb-4">
              <p className="leading-snug">
                <span className="font-medium">{log.actor.name}</span>{" "}
                {renderLogAction(log)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatRelativeTime(log.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function renderLogAction(log: ActivityLogDTO) {
  switch (log.action) {
    case "CREATED":
      return <span>created this task</span>;
    case "UPDATED":
      return <span>updated this task</span>;
    case "DELETED":
      return <span>deleted this task</span>;
    case "STATUS_CHANGED":
    default:
      return log.fromStatus ? (
        <span>
          changed status from{" "}
          <StatusBadge
            label={STATUS_LABELS[log.fromStatus] || log.fromStatus}
            variant="secondary"
          />{" "}
          to{" "}
          <StatusBadge
            label={STATUS_LABELS[log.toStatus ?? ""] || log.toStatus || ""}
            variant="primary"
          />
        </span>
      ) : (
        <span>
          set status to{" "}
          <StatusBadge
            label={STATUS_LABELS[log.toStatus ?? ""] || log.toStatus || ""}
            variant="primary"
          />
        </span>
      );
  }
}
