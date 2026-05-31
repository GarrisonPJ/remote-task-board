import type { TaskDTO } from "@/types/domain";

export type PrismaTaskRow = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  assignee?: { id: string; name: string; email: string } | null;
  dueDate?: Date | null;
  activityLogs?: Array<{
    id: string;
    taskId: string | null;
    projectId?: string | null;
    actor: { id: string; name: string; email: string };
    action: string;
    fromStatus: string | null;
    toStatus: string | null;
    details: string | null;
    createdAt: Date;
  }>;
};

export function toTaskDTO(t: PrismaTaskRow): TaskDTO {
  return {
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    description: t.description,
    status: t.status as TaskDTO["status"],
    priority: t.priority as TaskDTO["priority"],
    creatorId: t.creatorId,
    assignee: t.assignee ?? null,
    dueDate: t.dueDate?.toISOString() ?? null,
    activityLogs: t.activityLogs?.map((log) => ({
      id: log.id,
      taskId: log.taskId,
      projectId: log.projectId,
      actor: log.actor,
      action: log.action,
      fromStatus: log.fromStatus as TaskDTO["status"] | null,
      toStatus: log.toStatus as TaskDTO["status"] | null,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
    })),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}
