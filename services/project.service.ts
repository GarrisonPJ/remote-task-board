/**
 * ProjectService — 项目业务逻辑
 *
 * 核心概念：
 * - Project 归属于 Workspace（通过 workspaceId 外键）
 * - 操作前必须验证用户是该 workspace 的成员（数据隔离）
 * - 权限：OWNER/MEMBER 可创建和编辑，仅 OWNER 可删除
 *
 * 设计文档参考：Section 8.3 (Project 模块), Section 16 (权限设计)
 */

import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/schemas/project.schema";
import type { ProjectDTO } from "@/types/domain";

type WorkspaceRole = "OWNER" | "MEMBER" | "VIEWER";

// ============================================================
// 权限辅助函数
// ============================================================

function canCreateProject(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "MEMBER";
}

function canDeleteProject(role: WorkspaceRole): boolean {
  return role === "OWNER";
}

// ============================================================
// 公共辅助：获取用户在 workspace 中的成员资格
// ============================================================

/**
 * 这是 PROJECT 和 TASK SERVICE 都需要的核心查询模式：
 * 通过 userId + workspaceId 在 WorkspaceMember 表中查找成员资格。
 * 如果不存在 → 404（你无权访问这个 workspace）
 *
 * 返回 member.role 供后续权限判断使用。
 */
async function getMembership(workspaceId: string, actorId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      // Prisma 对 @@unique 字段组合自动生成这个复合键名
      workspaceId_userId: { workspaceId, userId: actorId },
    },
  });
  if (!member) {
    throw new NotFoundError("Workspace");
  }
  return member;
}

// ============================================================
// 示例：createProject — 创建项目（完整实现）
// ============================================================

/**
 * 创建项目流程：
 * 1. 验证 actorId 是目标 workspace 的成员
 * 2. 检查权限（OWNER 或 MEMBER 可创建）
 * 3. 创建 Project 记录
 * 4. 返回 ProjectDTO
 */
export async function createProject(
  input: CreateProjectInput,
  actorId: string
): Promise<ProjectDTO> {
  // Step 1 + 2: 获取成员资格并检查权限
  const member = await getMembership(input.workspaceId, actorId);

  if (!canCreateProject(member.role)) {
    throw new ForbiddenError();
  }

  // Step 3: 创建项目
  const project = await prisma.project.create({
    data: {
      workspaceId: input.workspaceId,
      name: input.name,
      description: input.description,
    },
  });

  // Step 4: 转换为 DTO（Date → ISO string）
  return {
    id: project.id,
    workspaceId: project.workspaceId,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

// ============================================================
// TODO：listProjects — 获取项目列表
// ============================================================

/**
 * 1. 验证 actorId 是 workspace 的成员
 * 2. 查询该 workspace 下所有 project
 *
 * Prisma 查询：
 *   await prisma.project.findMany({
 *     where: { workspaceId },
 *     orderBy: { createdAt: "desc" }
 *   });
 */
export async function listProjects(
  workspaceId: string,
  actorId: string
): Promise<ProjectDTO[]> {
  // TODO: 实现
  throw new Error("Not implemented");
}

// ============================================================
// TODO：getProjectById — 获取项目详情
// ============================================================

/**
 * 1. 查找 project
 * 2. 通过 project.workspaceId 验证 actorId 是成员
 * 3. 返回 ProjectDTO
 */
export async function getProjectById(
  projectId: string,
  actorId: string
): Promise<ProjectDTO> {
  // TODO: 实现
  throw new Error("Not implemented");
}

// ============================================================
// TODO：updateProject — 更新项目（OWNER 或 MEMBER）
// ============================================================

/**
 * 1. 查找 project（获取 workspaceId）
 * 2. 获取成员资格 + 检查权限
 * 3. prisma.project.update({ where: { id }, data: input })
 */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
  actorId: string
): Promise<ProjectDTO> {
  // TODO: 实现
  throw new Error("Not implemented");
}

// ============================================================
// TODO：deleteProject — 删除项目（仅 OWNER）
// ============================================================

/**
 * 1. 查找 project（获取 workspaceId）
 * 2. 获取成员资格 + 检查 canDeleteProject
 * 3. prisma.project.delete({ where: { id } })
 * 4. 级联删除关联的 Task（Prisma onDelete: Cascade 自动处理）
 */
export async function deleteProject(
  projectId: string,
  actorId: string
): Promise<void> {
  // TODO: 实现
  throw new Error("Not implemented");
}
