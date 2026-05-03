/**
 * TaskPriorityBadge — 任务优先级标签（完整实现，可直接使用）
 */

import { Badge } from "@/components/ui/badge";
import type { TaskPriority } from "@/types/domain";

const PRIORITY_VARIANTS: Record<TaskPriority, "default" | "secondary" | "destructive" | "outline"> = {
  LOW: "outline",
  MEDIUM: "secondary",
  HIGH: "default",
  URGENT: "destructive",
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge variant={PRIORITY_VARIANTS[priority]}>{priority}</Badge>;
}
