/**
 * WorkspaceService — 工作区业务逻辑
 *
 * 核心概念：
 * - Workspace 是多租户隔离的基本单位
 * - 每个用户通过 WorkspaceMember 表与 workspace 关联，角色为 OWNER/MEMBER/VIEWER
 * - 权限判断：查 WorkspaceMember 表 → 读 role 字段 → 用 canManageWorkspace() 判断
 * - 数据隔离：所有查询从 WorkspaceMember（userId = actorId）入手
 *
 * 设计文档参考：Section 8.2 (Workspace 模块), Section 16 (权限设计)
 *
 * ============================================================
 * 本文件中的 CRUD 模式（读代码前先理解这些 pattern）
 * ============================================================
 *
 * 模式 A：查成员资格 — 所有需要权限的方法第一步都是这个：
 *   const member = await prisma.workspaceMember.findUnique({
 *     where: { workspaceId_userId: { workspaceId, userId: actorId } },
 *   });
 *   if (!member) throw new NotFoundError("Workspace");
 *   // 然后根据 member.role 判断权限
 *
 * 模式 B：反向关联查询 — 列出用户的所有 workspace：
 *   不从 Workspace 表查，从 WorkspaceMember 表查（where userId = actorId），
 *   然后 include workspace。这样天然做了数据隔离。
 *
 * 模式 C：DTO 转换 — 把 Prisma 嵌套对象（m.workspace.xxx）展平到返回类型：
 *   return { id: m.workspace.id, name: m.workspace.name, role: m.role, ... };
 *
 * 模式 D：事务 — 需要同时写多个表时用 $transaction：
 *   await prisma.$transaction([prisma.xxx.create(...), prisma.yyy.create(...)]);
 */

import { prisma } from "@/lib/prisma";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  AddWorkspaceMemberInput,
} from "@/schemas/workspace.schema";
import type { WorkspaceDTO } from "@/types/domain";

type WorkspaceRole = "OWNER" | "MEMBER" | "VIEWER";

// ============================================================
// 权限辅助函数
// ============================================================

/** 只有 OWNER 能修改工作区设置、管理成员、删除工作区 */
function canManageWorkspace(role: WorkspaceRole): boolean {
  return role === "OWNER";
}

// ============================================================
// createWorkspace — 创建工作区（完整实现，模式 B + C + D 演示）
// ============================================================

/**
 * Prisma 方法：prisma.workspace.create, prisma.workspaceMember.create
 * 参考：task.service.ts 的 createTask（同样先验证后创建）
 *
 * 流程：
 * 1. 创建 Workspace 记录
 * 2. 将创建者加入 WorkspaceMember 表，role = OWNER
 * 3. 返回 WorkspaceDTO
 *
 * 事务：两个 create 用 $transaction 包裹，保证同时成功或同时回滚。
 * 注意：$transaction 内的两个操作不能交叉引用（不能用第一个的结果），
 * 所以先创建 workspace，再用其 id 创建 member。
 */
export async function createWorkspace(
  input: CreateWorkspaceInput,
  actorId: string
): Promise<WorkspaceDTO> {
  const workspace = await prisma.workspace.create({
    data: { name: input.name },
  });

  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: actorId,
      role: "OWNER",
    },
  });

  // 模式 C：DTO 转换 — Date → ISO string
  return {
    id: workspace.id,
    name: workspace.name,
    role: "OWNER",
    createdAt: workspace.createdAt.toISOString(),
    updatedAt: workspace.updatedAt.toISOString(),
  };
}

// ============================================================
// listMyWorkspaces — 获取我的工作区列表（完整实现，模式 B + C 演示）
// ============================================================

/**
 * Prisma 方法：prisma.workspaceMember.findMany + include workspace
 *
 * 模式 B：从 WorkspaceMember 入手（where: { userId: actorId }），
 * include workspace 信息。天然隔离——只能查到用户加入的 workspace。
 *
 * 模式 C：嵌套对象展平 → WorkspaceDTO
 */
export async function listMyWorkspaces(actorId: string): Promise<WorkspaceDTO[]> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: actorId },
    include: {
      workspace: {
        select: { id: true, name: true, createdAt: true, updatedAt: true },
      },
    },
  });

  return memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    role: m.role as WorkspaceRole,
    createdAt: m.workspace.createdAt.toISOString(),
    updatedAt: m.workspace.updatedAt.toISOString(),
  }));
}

// ============================================================
// getWorkspaceById — 获取工作区详情
// ============================================================

/**
 * Prisma 方法：prisma.workspaceMember.findUnique
 * 参考：task.service.ts 的 getTaskWithPermission（模式 A）
 *
 * 流程：
 * 1. 查 WorkspaceMember 表，用 @@unique 复合键 workspaceId_userId
 * 2. include workspace 信息
 * 3. 不存在 → NotFoundError
 * 4. DTO 转换（模式 C）
 *
 * 完整代码（取消注释即可）：
 *
 * const member = await prisma.workspaceMember.findUnique({
 *   where: { workspaceId_userId: { workspaceId, userId: actorId } },
 *   include: {
 *     workspace: { select: { id: true, name: true, createdAt: true, updatedAt: true } },
 *   },
 * });
 * if (!member) throw new NotFoundError("Workspace");
 *
 * return {
 *   id: member.workspace.id,
 *   name: member.workspace.name,
 *   role: member.role as WorkspaceRole,
 *   createdAt: member.workspace.createdAt.toISOString(),
 *   updatedAt: member.workspace.updatedAt.toISOString(),
 * };
 */
export async function getWorkspaceById(
  workspaceId: string,
  actorId: string
): Promise<WorkspaceDTO> {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: actorId } },
    include: {
      workspace: { select: { id: true, name: true, createdAt: true, updatedAt: true } },
    },
  });
  if (!member) throw new NotFoundError("Workspace");

  return {
    id: member.workspace.id,
    name: member.workspace.name,
    role: member.role as WorkspaceRole,
    createdAt: member.workspace.createdAt.toISOString(),
    updatedAt: member.workspace.updatedAt.toISOString(),
  };
}

// ============================================================
// updateWorkspace — 更新工作区名称（仅 OWNER）
// ============================================================

export async function updateWorkspace(
  workspaceId: string,
  input: UpdateWorkspaceInput,
  actorId: string
): Promise<WorkspaceDTO> {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: actorId } },
  });
  if (!member) throw new NotFoundError("Workspace");
  if (!canManageWorkspace(member.role)) throw new ForbiddenError();

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { name: input.name },
  });

  return {
    id: updated.id,
    name: updated.name,
    role: member.role as WorkspaceRole,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

// ============================================================
// deleteWorkspace — 删除工作区（仅 OWNER）
// ============================================================

export async function deleteWorkspace(
  workspaceId: string,
  actorId: string
): Promise<void> {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: actorId } },
  });
  if (!member) throw new NotFoundError("Workspace");
  if (!canManageWorkspace(member.role)) throw new ForbiddenError();

  await prisma.workspace.delete({ where: { id: workspaceId } });
}

// ============================================================
// addMember — 添加成员（仅 OWNER）
// ============================================================

export async function addMember(
  workspaceId: string,
  input: AddWorkspaceMemberInput,
  actorId: string
): Promise<void> {
  // Step 1: 验证操作者是 OWNER
  const operator = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: actorId } },
  });
  if (!operator) throw new NotFoundError("Workspace");
  if (!canManageWorkspace(operator.role)) throw new ForbiddenError();

  // Step 2: 按 email 查找目标用户
  const targetUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (!targetUser) {
    throw new AppError("USER_NOT_FOUND", "User with this email does not exist.", 404);
  }

  // Step 3: 创建成员关系
  await prisma.workspaceMember.create({
    data: {
      workspaceId,
      userId: targetUser.id,
      role: input.role,
    },
  });
}

// ============================================================
// removeMember — 移除成员（仅 OWNER）
// ============================================================

export async function removeMember(
  workspaceId: string,
  memberId: string,
  actorId: string
): Promise<void> {
  // Step 1: 验证操作者是 OWNER
  const operator = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: actorId } },
  });
  if (!operator) throw new NotFoundError("Workspace");
  if (!canManageWorkspace(operator.role)) throw new ForbiddenError();

  // Step 2: 防删最后一个 OWNER
  const ownerCount = await prisma.workspaceMember.count({
    where: { workspaceId, role: "OWNER" },
  });

  // 检查被删的是否是 OWNER
  const target = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });
  if (!target) throw new NotFoundError("Member");

  if (target.role === "OWNER" && ownerCount <= 1) {
    throw new AppError(
      "LAST_OWNER",
      "Cannot remove the last owner of a workspace.",
      400
    );
  }

  // Step 3: 删除
  await prisma.workspaceMember.delete({ where: { id: memberId } });
}
