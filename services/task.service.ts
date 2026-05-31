/**
 * TaskService — core task business logic.
 * Covers CRUD, state-machine transitions, permission matrix, filtering/pagination,
 * and atomic ActivityLog writes via Prisma transactions.
 */

import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError, AppError } from "@/lib/errors";
import {
  VALID_TRANSITIONS,
  canCreateTask,
  canUpdateTask,
  canUpdateTaskPriority,
  canDeleteTask,
  canUpdateTaskStatus,
} from "@/lib/constants";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "@/schemas/task.schema";
import type { WorkspaceRole, TaskStatus } from "@/lib/constants";
import type { TaskDTO, TaskStats, TaskDetailResult } from "@/types/domain";
import { toTaskDTO } from "./task-mapper";

export { listTasks } from "./task-list.service";

// ============================================================
// getTaskStats — dashboard stat cards
// ============================================================

/** Returns task counts for the dashboard stat cards. Uses Prisma counts to avoid fetching full records. */
export async function getTaskStats(actorId: string): Promise<TaskStats> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: actorId },
    select: { workspaceId: true },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);

  const projects = await prisma.project.findMany({
    where: { workspaceId: { in: workspaceIds } },
    select: { id: true },
  });
  const projectIds = projects.map((p) => p.id);

  const [total, openTasks, inReview] = await Promise.all([
    prisma.task.count({ where: { projectId: { in: projectIds } } }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: { notIn: ["DONE", "CANCELED"] },
      },
    }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: "IN_REVIEW",
      },
    }),
  ]);

  return { total, openTasks, inReview };
}

// ============================================================
// Shared helpers
// ============================================================

/**
 * Fetches a task with a nested permission check (task -> project -> workspace -> membership).
 * Data isolation is enforced by joining through the three-table chain.
 */
async function getTaskWithPermission(taskId: string, actorId: string) {
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

  // members[0] is the filtered record; an empty array means the user is not in this workspace.
  const member = task.project.workspace.members[0];
  if (!member) throw new NotFoundError("Task");

  return { task, role: member.role as WorkspaceRole };
}

/**
 * Ensures the assignee is a member of the project's workspace,
 * preventing cross-workspace assignment that could leak permissions.
 */
async function validateAssigneeInWorkspace(
  projectId: string,
  assigneeId: string
): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { workspaceId: true },
  });
  if (!project) throw new NotFoundError("Project");

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: project.workspaceId,
        userId: assigneeId,
      },
    },
  });
  if (!member) {
    throw new AppError(
      "INVALID_ASSIGNEE",
      "Assignee must be a member of the workspace.",
      400
    );
  }
}

function parseDueDateInput(dueDate: string | null | undefined): Date | null | undefined {
  if (dueDate === undefined) return undefined;
  if (dueDate === null) return null;

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dueDate)
    ? `${dueDate}T00:00:00.000Z`
    : dueDate;
  return new Date(normalized);
}

// ============================================================
// Internal mutation pipeline
// ============================================================

type TaskContext = {
  task: any;
  role: WorkspaceRole;
};

type MutationDescriptor<TInput, TResult> = {
  input: TInput;
  actorId: string;
  taskId?: string;
  projectId?: string;
  authorize: (ctx: TaskContext) => void;
  execute: (ctx: TaskContext) => Promise<TResult>;
};

/**
 * Shared pipeline for all task mutations.
 * 1. Resolves the TaskContext (task + role) from taskId or projectId.
 * 2. Runs the authorization check.
 * 3. Runs the actual mutation.
 */
async function executeTaskMutation<TInput, TResult>(
  desc: MutationDescriptor<TInput, TResult>
): Promise<TResult> {
  let ctx: TaskContext;

  if (desc.taskId) {
    ctx = await getTaskWithPermission(desc.taskId, desc.actorId);
  } else if (desc.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: desc.projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId: desc.actorId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!project) throw new NotFoundError("Project");
    const member = project.workspace.members[0];
    if (!member) throw new NotFoundError("Project");

    ctx = { task: null as any, role: member.role as WorkspaceRole };
  } else {
    throw new AppError(
      "INVALID_PIPELINE",
      "Either taskId or projectId is required for a mutation.",
      500
    );
  }

  desc.authorize(ctx);
  return desc.execute(ctx);
}

// ============================================================
// createTask
// ============================================================

/** Creates a task with permission check, assignee validation, and creator injection. */
export async function createTask(
  input: CreateTaskInput,
  actorId: string
): Promise<TaskDTO> {
  return executeTaskMutation({
    input,
    actorId,
    projectId: input.projectId,
    authorize: ({ role }) => {
      if (!canCreateTask(role)) throw new ForbiddenError();
    },
    execute: async () => {
      // Validate assignee is a member of the same workspace.
      if (input.assigneeId) {
        await validateAssigneeInWorkspace(input.projectId, input.assigneeId);
      }

      return prisma.$transaction(async (tx) => {
        // creatorId is injected from the authenticated actor, never from the client.
        const task = await tx.task.create({
          data: {
            projectId: input.projectId,
            title: input.title,
            description: input.description,
            priority: input.priority ?? "MEDIUM",
            assigneeId: input.assigneeId ?? null,
            dueDate: parseDueDateInput(input.dueDate) ?? null,
            creatorId: actorId,
            status: "TODO",
          },
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        await tx.activityLog.create({
          data: {
            taskId: task.id,
            projectId: input.projectId,
            actorId,
            action: "CREATED",
            toStatus: "TODO",
            details: JSON.stringify({ title: task.title }),
          },
        });

        return toTaskDTO(task);
      });
    },
  });
}

// ============================================================
// updateTaskStatus — state machine + atomic ActivityLog
// ============================================================

/**
 * Updates a task's status with state-machine validation, permission check,
 * and an atomic transaction that writes both the status change and ActivityLog.
 */
export async function updateTaskStatus(
  taskId: string,
  input: UpdateTaskStatusInput,
  actorId: string
): Promise<TaskDTO> {
  return executeTaskMutation({
    input,
    actorId,
    taskId,
    authorize: (ctx) => {
      // Validate state transition
      const validTargets = VALID_TRANSITIONS[ctx.task.status as TaskStatus];
      if (!validTargets.includes(input.status)) {
        throw new AppError(
          "INVALID_TRANSITION",
          `Cannot transition from ${ctx.task.status} to ${input.status}. Valid transitions: ${validTargets.join(", ")}`,
          400
        );
      }

      // Permission: OWNER is all-powerful, MEMBER must be the assignee.
      if (!canUpdateTaskStatus(ctx.role, ctx.task.assigneeId, actorId)) {
        throw new ForbiddenError();
      }
    },
    execute: async (ctx) => {
      // Atomic transaction: update status + write ActivityLog as a single unit.
      const [updatedTask] = await prisma.$transaction([
        prisma.task.update({
          where: { id: taskId, status: ctx.task.status },
          data: { status: input.status },
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
        prisma.activityLog.create({
          data: {
            taskId,
            projectId: ctx.task.projectId,
            actorId,
            action: "STATUS_CHANGED",
            fromStatus: ctx.task.status,
            toStatus: input.status,
          },
        }),
      ]);

      return toTaskDTO(updatedTask);
    },
  });
}

// ============================================================
// getTaskById — detail with ActivityLog timeline
// ============================================================

/** Gets a task by ID with assignee, activity logs, and permission check. */
export async function getTaskById(
  taskId: string,
  actorId: string
): Promise<TaskDetailResult> {
  const t = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: {
        select: { id: true, name: true, email: true },
      },
      activityLogs: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      },
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

  if (!t) throw new NotFoundError("Task");

  const member = t.project.workspace.members[0];
  if (!member) throw new NotFoundError("Task");

  return {
    task: toTaskDTO(t),
    userRole: member.role as WorkspaceRole,
  };
}

// ============================================================
// updateTask
// ============================================================

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput,
  actorId: string
): Promise<TaskDTO> {
  return executeTaskMutation({
    input,
    actorId,
    taskId,
    authorize: ({ role }) => {
      if (!canUpdateTask(role)) throw new ForbiddenError();
    },
    execute: async (ctx) => {
      // If changing assignee, verify the new assignee is in the workspace.
      if (input.assigneeId) {
        await validateAssigneeInWorkspace(ctx.task.projectId, input.assigneeId);
      }

      return prisma.$transaction(async (tx) => {
        const updated = await tx.task.update({
          where: { id: taskId },
          data: {
            title: input.title,
            description: input.description,
            priority: input.priority,
            assigneeId: input.assigneeId,
            dueDate: parseDueDateInput(input.dueDate),
          },
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        const changes: Record<string, unknown> = {};
        if (input.title !== undefined && input.title !== ctx.task.title) {
          changes.title = input.title;
        }
        if (
          input.description !== undefined &&
          input.description !== ctx.task.description
        ) {
          changes.description = input.description;
        }
        if (input.priority !== undefined && input.priority !== ctx.task.priority) {
          if (!canUpdateTaskPriority(ctx.role)) {
            throw new ForbiddenError();
          }
          changes.priority = input.priority;
        }
        if (
          input.assigneeId !== undefined &&
          input.assigneeId !== ctx.task.assigneeId
        ) {
          changes.assigneeId = input.assigneeId;
        }

        await tx.activityLog.create({
          data: {
            taskId,
            projectId: ctx.task.projectId,
            actorId,
            action: "UPDATED",
            details:
              Object.keys(changes).length > 0
                ? JSON.stringify(changes)
                : null,
          },
        });

        return toTaskDTO(updated);
      });
    },
  });
}

// ============================================================
// deleteTask
// ============================================================

export async function deleteTask(
  taskId: string,
  actorId: string
): Promise<void> {
  return executeTaskMutation({
    input: undefined,
    actorId,
    taskId,
    authorize: (ctx) => {
      if (!canDeleteTask(ctx.role, ctx.task.creatorId, actorId))
        throw new ForbiddenError();
    },
    execute: async (ctx) => {
      await prisma.$transaction(async (tx) => {
        await tx.activityLog.create({
          data: {
            taskId: null,
            projectId: ctx.task.projectId,
            actorId,
            action: "DELETED",
            details: JSON.stringify({ title: ctx.task.title }),
          },
        });
        await tx.task.delete({ where: { id: taskId } });
      });
    },
  });
}
