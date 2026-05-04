/**
 * TaskService — 任务业务逻辑（最核心模块）
 *
 * 这是整个项目最复杂的模块，包含：
 * - CRUD 操作
 * - 状态机流转校验
 * - 权限矩阵（OWNER/MEMBER/VIEWER + assignee 特殊权限 + creator 特殊权限）
 * - 搜索/筛选/分页
 * - 数据隔离（Task → Project → WorkspaceMember 三表 join）
 * - 事务保证（状态更新 + ActivityLog 原子写入）
 *
 * 设计文档参考：
 *   - Section 8.4 (Task 模块)
 *   - Section 8.4 状态机规则
 *   - Section 16 (权限设计)
 *   - Section 22.2 (更新任务状态序列图 — 事务要求)
 *
 * ============================================================
 * 关键概念：DTO 转换
 * ============================================================
 *
 * Prisma 返回的数据对象不能直接返回给 API 调用方，原因：
 * 1. Date 类型 → JSON 不支持，需要转为 ISO string
 * 2. 可能包含不应该暴露的字段（如 passwordHash）
 * 3. 类型安全性——TaskDTO 定义了返回给前端的契约
 *
 * 所以每个方法末尾都有一个 "手动映射"：
 *   return {
 *     id: task.id,
 *     title: task.title,
 *     dueDate: task.dueDate?.toISOString() ?? null,  // Date → string
 *     createdAt: task.createdAt.toISOString(),
 *     ...
 *   };
 *
 * 为什么不用 Prisma 的 select？因为 include + 手动映射更灵活——
 * include 返回完整对象（含关联数据），映射时再决定哪些字段要返回。
 */

import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError, AppError } from "@/lib/errors";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
  ListTasksQuery,
} from "@/schemas/task.schema";
import type { TaskDTO } from "@/types/domain";
import type { PaginatedResponse } from "@/types/api";

type WorkspaceRole = "OWNER" | "MEMBER" | "VIEWER";
type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELED";

// ============================================================
// 状态机转换表（设计文档 Section 8.4）
// ============================================================

/**
 * 定义了哪些状态转换是合法的。
 * key = 当前状态，value = 允许转换到的目标状态列表
 *
 * 示例：TODO 只能转为 IN_PROGRESS 或 CANCELED
 *       DONE 只能转为 IN_REVIEW（被驳回重新审查）
 */
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["IN_REVIEW", "CANCELED", "TODO"],
  IN_REVIEW: ["DONE", "IN_PROGRESS", "CANCELED"],
  DONE: ["IN_REVIEW"],
  CANCELED: ["TODO"],
};

// ============================================================
// 权限辅助函数（设计文档 Section 16.3）
// ============================================================

function canCreateTask(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "MEMBER";
}

function canUpdateTask(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "MEMBER";
}

/**
 * 删除权限：OWNER 全面，MEMBER 只能删除自己创建的任务
 */
function canDeleteTask(role: WorkspaceRole, creatorId: string, actorId: string): boolean {
  if (role === "OWNER") return true;
  if (role === "MEMBER") return creatorId === actorId;
  return false;
}

/**
 * 状态变更权限：OWNER 全面，MEMBER 只有自己是 assignee 时才能改
 * 注意：assigneeId 可能为 null（任务未分配），此时 MEMBER 不能改
 */
function canUpdateTaskStatus(
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
 * 获取用户在 task 所属 workspace 中的成员资格。
 *
 * 数据隔离的核心：通过 task → project → workspaceMember 的三表 join 链，
 * 确保用户只能访问自己 workspace 下的 task。
 *
 * Prisma 查询嵌套：
 *   task → include project → where workspace.members 包含 actorId
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

  // task.project.workspace.members[0] 就是我们通过 actorId 过滤出的成员记录
  // 如果为空数组 → 用户不属于此 workspace → 拒绝访问
  const member = task.project.workspace.members[0];
  if (!member) throw new NotFoundError("Task");

  return { task, role: member.role as WorkspaceRole };
}

/**
 * 验证 assigneeId 是否属于 project 所在的 workspace。
 * 防止将任务指派给不在 workspace 中的外部用户导致权限污染。
 *
 * 设计文档 Schema 注释强调了这个校验规则。
 */
async function validateAssigneeInWorkspace(
  projectId: string,
  assigneeId: string
): Promise<void> {
  // 找到 project 所属的 workspaceId
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { workspaceId: true },
  });
  if (!project) throw new NotFoundError("Project");

  // 检查 assignee 是否是该 workspace 的成员
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
// 示例 1：createTask — 创建任务（完整实现）
// ============================================================

/**
 * 创建任务流程：
 * 1. 验证 actor 是 project 所属 workspace 的成员，且有创建权限
 * 2. 如果提供了 assigneeId，验证 assignee 是该 workspace 的成员
 * 3. creatorId 从 actorId 注入，不从客户端接收（安全）
 * 4. 创建 Task 记录
 */
export async function createTask(
  input: CreateTaskInput,
  actorId: string
): Promise<TaskDTO> {
  // Step 1: 获取 project 的 workspace，验证成员资格
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

  // Step 2: 验证 assignee
  if (input.assigneeId) {
    await validateAssigneeInWorkspace(input.projectId, input.assigneeId);
  }

  // Step 3+4: 创建 task，creatorId 来自 actorId（不是客户端传的！）
  const task = await prisma.task.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      priority: input.priority ?? "MEDIUM",
      assigneeId: input.assigneeId ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      creatorId: actorId, // 安全：始终使用当前登录用户
      status: "TODO", // 新任务始终从 TODO 开始
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // DTO 转换：Prisma 对象 → 前端可用类型
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
// 示例 2：listTasks — 搜索/筛选/分页查询（完整实现）
// ============================================================

/**
 * 搜索/筛选/分页的综合查询。
 *
 * 数据隔离方案：
 * 在 Prisma 查询的 where 条件中，通过 task.project.workspace.members.some
 * 确保只返回 actorId 是成员的 workspace 下的 task。
 * 这是 Prisma 的"关联过滤"语法 —— 生成的 SQL 是一个带子查询的 WHERE EXISTS。
 *
 * 搜索：title 包含 q，大小写不敏感（mode: 'insensitive'）
 * 排序：按 updatedAt 降序（最新修改的在前）
 * 分页：skip = (page - 1) * pageSize, take = pageSize
 */
export async function listTasks(
  query: ListTasksQuery,
  actorId: string
): Promise<PaginatedResponse<TaskDTO>> {
  const { projectId, workspaceId, status, priority, assigneeId, q, page, pageSize } = query;

  // 构建 Prisma where 条件 —— 动态组合筛选条件
  const where: Record<string, unknown> = {
    // 数据隔离：只查当前用户所属 workspace 的 task
    project: {
      workspace: {
        members: {
          some: { userId: actorId },
        },
      },
    },
  };

  // 可选筛选条件
  if (projectId) {
    where.projectId = projectId;
  }
  if (workspaceId) {
    // 按 workspace 筛选（通过 project.workspaceId 关联）
    where.project = {
      ...(where.project as Record<string, unknown>),
      workspaceId,
    };
  }
  if (status) {
    where.status = status;
  }
  if (priority) {
    where.priority = priority;
  }
  if (assigneeId) {
    where.assigneeId = assigneeId;
  }
  if (q) {
    // 标题模糊搜索，大小写不敏感
    where.title = {
      contains: q,
      mode: "insensitive",
    };
  }

  // 并行查询：同时获取列表数据和总数
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
    items: tasks.map((t) => ({
      id: t.id,
      projectId: t.projectId,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      creatorId: t.creatorId,
      assignee: t.assignee ?? null,
      dueDate: t.dueDate?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
    meta: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}

// ============================================================
// 示例 3：updateTaskStatus — 状态变更 + ActivityLog（完整实现）
// ============================================================

/**
 * 更新任务状态 —— 含状态机校验 + 权限检查 + 事务写入 ActivityLog。
 *
 * 这是设计文档 Section 22.2 序列图中描述的完整流程。
 *
 * 事务要求（设计文档决策 #2091）：
 * "更新任务状态和写入 Activity Log 必须包裹在同一个 Prisma 事务中"
 * 使用 prisma.$transaction([...]) 保证原子性 ——
 * 要么两个操作都成功，要么都回滚。不会出现"任务已更新但日志没写"的数据不一致。
 */
export async function updateTaskStatus(
  taskId: string,
  input: UpdateTaskStatusInput,
  actorId: string
): Promise<TaskDTO> {
  // Step 1: 获取 task 和用户权限
  const { task, role } = await getTaskWithPermission(taskId, actorId);

  // Step 2: 状态流转校验
  const validTargets = VALID_TRANSITIONS[task.status];
  if (!validTargets.includes(input.status)) {
    throw new AppError(
      "INVALID_TRANSITION",
      `Cannot transition from ${task.status} to ${input.status}. Valid transitions: ${validTargets.join(", ")}`,
      400
    );
  }

  // Step 3: 权限检查（OWNER 全面，MEMBER 需是 assignee）
  if (!canUpdateTaskStatus(role, task.assigneeId, actorId)) {
    throw new ForbiddenError();
  }

  // Step 4: 事务 — 同时更新 task status 和写入 activity log
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
        fromStatus: task.status, // 变更前状态
        toStatus: input.status, // 变更后状态
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

/**
 * 与 getTaskWithPermission 结构一致，额外 include 了 assignee 和 activityLogs。
 *
 * include 层级：
 *   task
 *   ├── assignee (select id, name, email)
 *   ├── activityLogs (take 10, 按时间倒序, include actor)
 *   └── project → workspace → members (where userId = actorId, 做权限检查)
 */
export async function getTaskById(
  taskId: string,
  actorId: string
): Promise<TaskDTO> {
  const task = await prisma.task.findUnique({
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

  if (!task) throw new NotFoundError("Task");

  const member = task.project.workspace.members[0];
  if (!member) throw new NotFoundError("Task");

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
// updateTask — 更新任务字段（标题/描述/优先级/负责人/截止日期）
// ============================================================

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput,
  actorId: string
): Promise<TaskDTO> {
  // Step 1: 权限检查 + 数据隔离 — 复用 getTaskWithPermission
  const { task, role } = await getTaskWithPermission(taskId, actorId);

  // Step 2: 权限 — 修改任务字段需要 OWNER 或 MEMBER
  if (!canUpdateTask(role)) throw new ForbiddenError();

  // Step 3: 如果修改了 assigneeId，验证新 assignee 在 workspace 中
  if (input.assigneeId) {
    await validateAssigneeInWorkspace(task.projectId, input.assigneeId);
  }

  // Step 4: 更新 — Prisma 只更新 data 里传了的字段，undefined 的字段保持不变
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

  // Step 5: DTO 转换
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
  // Step 1: 权限检查
  const { task, role } = await getTaskWithPermission(taskId, actorId);

  // Step 2: 权限 — OWNER 全面，MEMBER 只能删自己创建的
  if (!canDeleteTask(role, task.creatorId, actorId)) throw new ForbiddenError();

  // Step 3: 删除 — 级联删除 activityLogs 由 Prisma onDelete: Cascade 自动处理
  await prisma.task.delete({ where: { id: taskId } });
}
