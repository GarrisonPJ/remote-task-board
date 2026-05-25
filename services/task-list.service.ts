/**
 * Task list queries (search, filter, pagination)
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
  const { projectId, workspaceId, status, priority, assigneeId, q, page, pageSize, cursor } =
    query;

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

  const take = pageSize + 1; // Fetch one extra to detect next page.

  // Stable ordering required for cursor-based pagination.
  const orderBy = [{ createdAt: "desc" as const }, { id: "asc" as const }];

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy,
      take,
      ...(cursor
        ? { skip: 1, cursor: { id: cursor } }
        : { skip: (page - 1) * pageSize }),
    }),
    prisma.task.count({ where }),
  ]);

  const hasMore = tasks.length > pageSize;
  const items = hasMore ? tasks.slice(0, pageSize) : tasks;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const totalPages = Math.ceil(total / pageSize);

  return {
    items: items.map(toTaskDTO),
    nextCursor,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}
