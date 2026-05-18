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
    <Link href={`/tasks/${task.id}`}>
      <Card className="hover:bg-muted/50 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="text-base">{task.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex gap-2">
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground flex justify-between">
          {/* TODO: 显示 assignee 名字（如果有的话） */}
          {task.assignee && <span>{task.assignee.name}</span>}

          {/* TODO: 显示截止日期（格式化显示）
          {task.dueDate && (
            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
          )}
          */}
        </CardFooter>
      </Card>
    </Link>
  );
}
