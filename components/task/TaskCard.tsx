/**
 * TaskCard — 任务卡片（Server Component）
 *
 * 展示单个任务的摘要信息。
 * 使用 shadcn/ui 的 Card 组件包裹。
 *
 * 你参考文档：shadcn/ui → Card（Card, CardHeader, CardTitle, CardContent, CardFooter）
 */

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import type { TaskDTO } from "@/types/domain";

type TaskCardProps = {
  task: TaskDTO;
};

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Link href={`/tasks/${task.id}`} className="block h-full">
      <Card className="shadow-sm ring-0 border-foreground/10 hover:bg-muted/50 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base line-clamp-1">{task.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-2">
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5em]">
            {task.description || " "}
          </p>
          <div className="flex gap-2">
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground flex justify-between pt-0 min-h-[1.5em]">
          <span>{task.assignee?.name ?? <span className="text-muted-foreground/50">&mdash;</span>}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
