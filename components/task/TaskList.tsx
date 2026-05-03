/**
 * TaskList — 任务列表（Server Component）
 *
 * 以卡片网格布局显示任务列表。包含空状态处理。
 */

import { TaskCard } from "./TaskCard";
import type { TaskDTO } from "@/types/domain";

type TaskListProps = {
  tasks: TaskDTO[];
};

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium">No tasks yet</p>
        <p className="text-muted-foreground mt-1">
          Create your first task to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
