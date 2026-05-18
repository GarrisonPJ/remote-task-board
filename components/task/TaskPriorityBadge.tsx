import { Badge } from "@/components/ui/badge";
import type { TaskPriority } from "@/types/domain";

const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  LOW: "badge-low",
  MEDIUM: "badge-medium",
  HIGH: "badge-high",
  URGENT: "badge-urgent",
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge variant="ghost" className={PRIORITY_CLASSES[priority]}>
      {priority}
    </Badge>
  );
}
