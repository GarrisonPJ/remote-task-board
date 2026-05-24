import type { ActivityLogDTO } from "@/types/domain";
import { STATUS_LABELS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/date-utils";

type Props = {
  logs: ActivityLogDTO[];
};

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
                <span className="font-medium">{log.actor.name}</span>
                {log.fromStatus ? (
                  <span>
                    {" "}
                    changed status from{" "}
                    <span className="inline-block px-1.5 py-0.5 text-xs rounded border bg-secondary text-secondary-foreground">
                      {STATUS_LABELS[log.fromStatus] || log.fromStatus}
                    </span>{" "}
                    to{" "}
                    <span className="inline-block px-1.5 py-0.5 text-xs rounded border bg-primary/10 text-primary">
                      {STATUS_LABELS[log.toStatus] || log.toStatus}
                    </span>
                  </span>
                ) : (
                  <span>
                    {" "}
                    set status to{" "}
                    <span className="inline-block px-1.5 py-0.5 text-xs rounded border bg-primary/10 text-primary">
                      {STATUS_LABELS[log.toStatus] || log.toStatus}
                    </span>
                  </span>
                )}
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
