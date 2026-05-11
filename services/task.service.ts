/**
 * TaskService — core task business logic.
 * Covers CRUD, state-machine transitions, permission matrix, filtering/pagination,
 * and atomic ActivityLog writes via Prisma transactions.
 */

import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError, AppError } from "@/lib/errors";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "@/schemas/task.schema";
import type { TaskDTO } from "@/types/domain";

export { listTasks } from "./task-list.service";

type WorkspaceRole = "OWNER" | "MEMBER" | "VIEWER";
type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELED";

// ============================================================
// 状态机转换表
// ============================================================

/** Defines allowed state transitions. Key = current status, value = valid targets. */
export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["IN_REVIEW", "CANCELED", "TODO"],
  IN_REVIEW: ["DONE", "IN_PROGRESS", "CANCELED"],
  DONE: ["IN_REVIEW"],
  CANCELED: ["TODO"],
};

// ============================================================
// 权限辅助函数
// ============================================================

export function canCreateTask(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "MEMBER";
}

export function canUpdateTask(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "MEMBER";
}

/**
 * OWNER can delete any task; MEMBER can only delete tasks they created.
 */
export function canDeleteTask(role: WorkspaceRole, creatorId: string, actorId: string): boolean {
  if (role === "OWNER") return true;
  if (role === "MEMBER") return creatorId === actorId;
  return false;
}

/**
 * OWNER can always update status; MEMBER can only update if they are the assignee.
 * When assigneeId is null (unassigned), MEMBER cannot update status.
 */
export function canUpdateTaskStatus(
  role: WorkspaceRole,
  assigneeId: string | null,
  actorId: string
): boolean {
  if (role === "OWNER") return true;
  if (role === "MEMBER" && assigneeId === actorId) return true;
  return false;
}

// ============================================================
// 公共辅助函数
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

// ============================================================
// createTask — 创建任务
// ============================================================

/** Creates a task with permission check, assignee validation, and creator injection. */
export async function createTask(
  input: CreateTaskInput,
  actorId: string
): Promise<TaskDTO> {
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
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
  });

  if (!project) throw new NotFoundError("Project");

  const member = project.workspace.members[0];
  if (!member) throw new NotFoundError("Project");
  if (!canCreateTask(member.role)) throw new ForbiddenError();

  // Validate assignee is a member of the same workspace.
  if (input.assigneeId) {
    await validateAssigneeInWorkspace(input.projectId, input.assigneeId);
  }

  // creatorId is injected from the authenticated actor, never from the client.
  const task = await prisma.task.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      priority: input.priority ?? "MEDIUM",
      assigneeId: input.assigneeId ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      creatorId: actorId,
      status: "TODO",
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    creatorId: task.creatorId,
    assignee: task.assignee ?? null,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

// ============================================================
// updateTaskStatus — 状态变更 + ActivityLog
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
  const { task, role } = await getTaskWithPermission(taskId, actorId);

  // Validate state transition
  const validTargets = VALID_TRANSITIONS[task.status];
  if (!validTargets.includes(input.status)) {
    throw new AppError(
      "INVALID_TRANSITION",
      `Cannot transition from ${task.status} to ${input.status}. Valid transitions: ${validTargets.join(", ")}`,
      400
    );
  }

  // Permission: OWNER is all-powerful, MEMBER must be the assignee.
  if (!canUpdateTaskStatus(role, task.assigneeId, actorId)) {
    throw new ForbiddenError();
  }

  // Atomic transaction: update status + write ActivityLog as a single unit.
  const [updatedTask] = await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
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
        actorId,
        fromStatus: task.status,
        toStatus: input.status,
      },
    }),
  ]);

  return {
    id: updatedTask.id,
    projectId: updatedTask.projectId,
    title: updatedTask.title,
    description: updatedTask.description,
    status: updatedTask.status,
    priority: updatedTask.priority,
    creatorId: updatedTask.creatorId,
    assignee: updatedTask.assignee ?? null,
    dueDate: updatedTask.dueDate?.toISOString() ?? null,
    createdAt: updatedTask.createdAt.toISOString(),
    updatedAt: updatedTask.updatedAt.toISOString(),
  };
}

// ============================================================
// getTaskById — 获取任务详情（含 ActivityLog 时间线）
// ============================================================

/** Gets a task by ID with assignee, activity logs, and permission check. */
export async function getTaskById(
  taskId: string,
  actorId: string
): Promise<{ task: TaskDTO; userRole: WorkspaceRole }> {
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
    task: {
      id: t.id,
      projectId: t.projectId,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      creatorId: t.creatorId,
      assignee: t.assignee ?? null,
      dueDate: t.dueDate?.toISOString() ?? null,
      activityLogs: t.activityLogs.map((log) => ({
        id: log.id,
        taskId: log.taskId,
        actor: log.actor,
        fromStatus: log.fromStatus,
        toStatus: log.toStatus,
        createdAt: log.createdAt.toISOString(),
      })),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    },
    userRole: member.role as WorkspaceRole,
  };
}

// ============================================================
// updateTask — 更新任务字段
// ============================================================

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput,
  actorId: string
): Promise<TaskDTO> {
  const { task, role } = await getTaskWithPermission(taskId, actorId);

  if (!canUpdateTask(role)) throw new ForbiddenError();

  // If changing assignee, verify the new assignee is in the workspace.
  if (input.assigneeId) {
    await validateAssigneeInWorkspace(task.projectId, input.assigneeId);
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate ? new Date(input.dueDate) : input.dueDate === null ? null : undefined,
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return {
    id: updated.id,
    projectId: updated.projectId,
    title: updated.title,
    description: updated.description,
    status: updated.status,
    priority: updated.priority,
    creatorId: updated.creatorId,
    assignee: updated.assignee ?? null,
    dueDate: updated.dueDate?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

// ============================================================
// deleteTask — 删除任务
// ============================================================

export async function deleteTask(
  taskId: string,
  actorId: string
): Promise<void> {
  const { task, role } = await getTaskWithPermission(taskId, actorId);

  if (!canDeleteTask(role, task.creatorId, actorId)) throw new ForbiddenError();

  // ActivityLogs are cascade-deleted by Prisma onDelete: Cascade.
  await prisma.task.delete({ where: { id: taskId } });
}
