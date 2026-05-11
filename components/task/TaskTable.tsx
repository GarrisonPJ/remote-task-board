import Link from "next/link";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import type { TaskDTO } from "@/types/domain";

type Props = {
  tasks: TaskDTO[];
  showProject?: boolean;
};

export function TaskTable({ tasks, showProject }: Props) {
  if (tasks.length === 0) {
    return <p className="text-muted-foreground text-sm py-8 text-center">No tasks found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Title</th>
            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Status</th>
            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Priority</th>
            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Assignee</th>
            {showProject && (
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">Project</th>
            )}
            <th className="text-right py-3 px-3 font-medium text-muted-foreground">Updated</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b hover:bg-muted/50 transition-colors">
              <td className="py-2.5 px-3">
                <Link
                  href={`/tasks/${task.id}`}
                  className="font-medium hover:underline"
                >
                  {task.title}
                </Link>
                {task.description && (
                  <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                    {task.description}
                  </p>
                )}
              </td>
              <td className="py-2.5 px-3">
                <TaskStatusBadge status={task.status} />
              </td>
              <td className="py-2.5 px-3">
                <TaskPriorityBadge priority={task.priority} />
              </td>
              <td className="py-2.5 px-3 text-muted-foreground text-xs">
                {task.assignee?.name ?? <span className="text-muted-foreground/50">&mdash;</span>}
              </td>
              {showProject && (
                <td className="py-2.5 px-3 text-muted-foreground text-xs">
                  &mdash;
                </td>
              )}
              <td className="py-2.5 px-3 text-right text-xs text-muted-foreground">
                {timeAgo(task.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
