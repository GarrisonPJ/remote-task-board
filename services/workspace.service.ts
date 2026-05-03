/**
 * WorkspaceService — 工作区业务逻辑
 *
 * 核心概念：
 * - Workspace 是多租户隔离的基本单位
 * - 每个用户通过 WorkspaceMember 表与 workspace 关联，关联带角色（OWNER/MEMBER/VIEWER）
 * - 权限控制在此层完成：检查 actorId 的 WorkspaceMember.role
 * - 数据隔离：只能返回当前用户加入的 workspace
 *
 * 设计文档参考：Section 8.2 (Workspace 模块), Section 16 (权限设计)
 */

import { prisma } from "@/lib/prisma";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  AddWorkspaceMemberInput,
} from "@/schemas/workspace.schema";
import type { WorkspaceDTO } from "@/types/domain";

// ============================================================
// 权限辅助函数（设计文档 Section 16.3）
// ============================================================

type WorkspaceRole = "OWNER" | "MEMBER" | "VIEWER";

/** 只有 OWNER 能管理工作区设置和成员 */
function canManageWorkspace(role: WorkspaceRole): boolean {
  return role === "OWNER";
}

// ============================================================
// 示例 1：createWorkspace — 创建工作区（完整实现）
// ============================================================

/**
 * 创建流程：
 * 1. 创建 Workspace 记录
 * 2. 在 WorkspaceMember 表中将创建者设为 OWNER
 * 3. 返回 WorkspaceDTO（包含 role 字段，方便前端判断用户在此 workspace 中的角色）
 *
 * 关键技术点：
 *   prisma.$transaction([...])：将两个操作包裹在一个事务中。
 *   如果第二步失败，第一步自动回滚，保证数据一致性。
 */
export async function createWorkspace(
  input: CreateWorkspaceInput,
  actorId: string
): Promise<WorkspaceDTO> {
  const [workspace] = await prisma.$transaction([
    // 创建 workspace
    prisma.workspace.create({
      data: { name: input.name },
    }),
    // 将创建者设为 OWNER
    // 注意：这里单独创建 member，因为需要在 workspace 创建后才能关联
  ]);

  // 创建成员关系
  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: actorId,
      role: "OWNER",
    },
  });

  return {
    id: workspace.id,
    name: workspace.name,
    role: "OWNER", // 创建者始终是 OWNER
    createdAt: workspace.createdAt.toISOString(),
    updatedAt: workspace.updatedAt.toISOString(),
  };
}

// ============================================================
// 示例 2：listMyWorkspaces — 获取我的工作区列表（完整实现）
// ============================================================

/**
 * 查询当前用户所有加入的 workspace。
 *
 * Prisma 查询模式：从 WorkspaceMember 表入手（因为直接包含 userId 过滤条件），
 * include 关联的 workspace 信息。这就是 ORM 中的"反向关联查询"。
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

  // 将 Prisma 返回的嵌套结构转换为 WorkspaceDTO 平面结构
  return memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    role: m.role as WorkspaceRole,
    createdAt: m.workspace.createdAt.toISOString(),
    updatedAt: m.workspace.updatedAt.toISOString(),
  }));
}

// ============================================================
// TODO：getWorkspaceById — 获取工作区详情
// ============================================================

/**
 * 1. 查找 workspace，同时检查 actorId 是否是成员（数据隔离！）
 * 2. 如果 workspace 不存在或用户不是成员 → 抛 NotFoundError
 *
 * 查询模式：
 *   const member = await prisma.workspaceMember.findUnique({
 *     where: { workspaceId_userId: { workspaceId, userId: actorId } },
 *     include: { workspace: true }
 *   });
 *
 *   @@unique([workspaceId, userId]) 在 Prisma 中生成复合唯一约束，
 *   findUnique 可用 workspaceId_userId 组合键查询（Prisma 自动生成）
 */
export async function getWorkspaceById(
  workspaceId: string,
  actorId: string
): Promise<WorkspaceDTO> {
  // TODO: 实现 — 参考 listMyWorkspaces 的查询模式
  throw new Error("Not implemented");
}

// ============================================================
// TODO：updateWorkspace — 更新工作区名称（仅 OWNER）
// ============================================================

/**
 * 1. 先从 WorkspaceMember 表获取 actorId 的角色
 * 2. 检查 canManageWorkspace(role)
 * 3. prisma.workspace.update({ where: { id }, data: { name } })
 */
export async function updateWorkspace(
  workspaceId: string,
  input: UpdateWorkspaceInput,
  actorId: string
): Promise<WorkspaceDTO> {
  // TODO: 实现权限检查 + 更新
  throw new Error("Not implemented");
}

// ============================================================
// TODO：deleteWorkspace — 删除工作区（仅 OWNER）
// ============================================================

/**
 * 1. 检查权限（OWNER only）
 * 2. prisma.workspace.delete({ where: { id } })
 * 3. 级联删除：Project/Task 等会因 Prisma schema 中的 onDelete: Cascade 自动删除
 */
export async function deleteWorkspace(
  workspaceId: string,
  actorId: string
): Promise<void> {
  // TODO: 实现
  throw new Error("Not implemented");
}

// ============================================================
// TODO：addMember — 添加成员到工作区（仅 OWNER）
// ============================================================

/**
 * 流程：
 * 1. 检查 actorId 是 OWNER
 * 2. 根据 input.email 查找目标用户
 * 3. 检查目标用户是否已经是成员（防止重复添加）
 * 4. 创建 WorkspaceMember 记录
 *
 * 关键：@@unique([workspaceId, userId]) 会禁止重复成员
 */
export async function addMember(
  workspaceId: string,
  input: AddWorkspaceMemberInput,
  actorId: string
): Promise<void> {
  // TODO: 实现
  throw new Error("Not implemented");
}

// ============================================================
// TODO：removeMember — 移除成员（仅 OWNER）
// ============================================================

/**
 * 流程：
 * 1. 检查 actorId 是 OWNER
 * 2. 不允许移除最后一个 OWNER（防止 workspace 无人管理）
 * 3. prisma.workspaceMember.delete
 */
export async function removeMember(
  workspaceId: string,
  memberId: string,
  actorId: string
): Promise<void> {
  // TODO: 实现
  throw new Error("Not implemented");
}
