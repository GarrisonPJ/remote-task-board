/**
 * TaskStatusBadge — 任务状态标签（完整实现，可直接使用）
 *
 * 将 TaskStatus 枚举值映射到 shadcn/ui 的 Badge 组件变体。
 * 这是一个纯展示组件，无需状态管理。
 */

import { Badge } from "@/components/ui/badge";
import type { TaskStatus } from "@/types/domain";

const STATUS_VARIANTS: Record<TaskStatus, "default" | "secondary" | "destructive" | "outline"> = {
  TODO: "secondary",
  IN_PROGRESS: "default",
  IN_REVIEW: "outline",
  DONE: "default",
  CANCELED: "destructive",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  CANCELED: "Canceled",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
