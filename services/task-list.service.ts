/**
 * TaskListService — 任务列表查询（搜索/筛选/分页）
 */

import { prisma } from "@/lib/prisma";
import { toTaskDTO } from "@/services/task-mapper";
import type { ListTasksQuery } from "@/schemas/task.schema";
import type { TaskDTO } from "@/types/domain";
import type { PaginatedResponse } from "@/types/api";

export async function listTasks(
  query: ListTasksQuery,
  actorId: string
): Promise<PaginatedResponse<TaskDTO>> {
  const { projectId, workspaceId, status, priority, assigneeId, q, page, pageSize } = query;

  const where: Record<string, unknown> = {
    project: {
      workspace: {
        members: {
          some: { userId: actorId },
        },
      },
    },
  };

  if (projectId) {
    where.projectId = projectId;
  }
  if (workspaceId) {
    where.project = {
      ...(where.project as Record<string, unknown>),
      workspaceId,
    };
  }
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;
  if (q) {
    where.title = {
      contains: q,
      mode: "insensitive",
    };
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.task.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    items: tasks.map(toTaskDTO),
    meta: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}
