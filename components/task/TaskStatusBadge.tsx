import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import type { TaskStatus } from "@/types/domain";

const STATUS_CLASSES: Record<TaskStatus, string> = {
  TODO: "badge-todo",
  IN_PROGRESS: "badge-in_progress",
  IN_REVIEW: "badge-in_review",
  DONE: "badge-done",
  CANCELED: "badge-canceled",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="ghost" className={STATUS_CLASSES[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
