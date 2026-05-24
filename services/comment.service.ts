import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { canCreateComment } from "@/lib/constants";
import type { CommentDTO } from "@/types/domain";

/**
 * Lists comments for a task, ordered newest-first.
 * Permission is implicit -- if actorId can find the task via the
 * 3-table join (task -> project -> workspace -> member), they have access.
 */
export async function listComments(
  taskId: string,
  actorId: string
): Promise<CommentDTO[]> {
  // Verify access by checking workspace membership (same pattern as getTaskWithPermission)
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          workspace: {
            include: {
              members: {
                where: { userId: actorId },
                select: { role: true },
              },
            },
          },
        },
      },
    },
  });

  if (!task) throw new NotFoundError("Task");
  if (!task.project.workspace.members[0]) throw new NotFoundError("Task");

  const comments = await prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return comments.map((c) => ({
    id: c.id,
    taskId: c.taskId,
    user: c.user,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
  }));
}

/**
 * Creates a comment on a task.
 * Permission: MEMBER/OWNER of the task's workspace.
 */
export async function createComment(
  taskId: string,
  content: string,
  userId: string
): Promise<CommentDTO> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          workspace: {
            include: {
              members: {
                where: { userId },
                select: { role: true },
              },
            },
          },
        },
      },
    },
  });

  if (!task) throw new NotFoundError("Task");

  const member = task.project.workspace.members[0];
  if (!member) throw new NotFoundError("Task");

  // VIEWER cannot create comments
  if (!canCreateComment(member.role)) {
    throw new ForbiddenError();
  }

  const comment = await prisma.comment.create({
    data: { taskId, content, userId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return {
    id: comment.id,
    taskId: comment.taskId,
    user: comment.user,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  };
}
