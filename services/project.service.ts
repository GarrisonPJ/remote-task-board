/**
 * ProjectService — 项目业务逻辑
 *
 * 核心概念：
 * - Project 归属于 Workspace（通过 workspaceId 外键）
 * - 操作前必须验证用户是该 workspace 的成员（数据隔离）
 * - 权限：OWNER/MEMBER 可创建和编辑，仅 OWNER 可删除
 *
 * 设计文档参考：Section 8.3 (Project 模块), Section 16 (权限设计)
 *
 * ============================================================
 * 本文件中的 CRUD 模式
 * ============================================================
 *
 * 模式 A：getMembership — 检查用户在 workspace 中的身份。
 *   所有方法的第一步都是它：const member = await getMembership(workspaceId, actorId)
 *   返回 member.role，后续用 canCreateProject / canDeleteProject 判断。
 *
 * 模式 B：查 project → 取 workspaceId → 验成员资格。
 *   getProjectById / updateProject / deleteProject 都遵循：
 *   1. prisma.project.findUnique({ where: { id } }) 拿到 project.workspaceId
 *   2. getMembership(project.workspaceId, actorId) 验权限
 *   3. 执行实际操作（update / delete）
 *
 * 模式 C：DTO 转换 — Date → ISO string，description 可能为 null。
 *
 * 与 task.service.ts 的对应关系：
 *   - createProject ≈ createTask（先验成员，再创建）
 *   - updateProject ≈ updateTask（查 project → 验权限 → update）
 *   - deleteProject ≈ deleteTask（查 project → 验权限 → delete）
 *   - listProjects ≈ listMyWorkspaces（从某个 scope 查列表）
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

/** OWNER 或 MEMBER 都能编辑 */
function canUpdateProject(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "MEMBER";
}

// ============================================================
// 公共辅助：获取用户在 workspace 中的成员资格（模式 A）
// ============================================================

/**
 * 与 workspace.service.ts 的模式 A 相同：通过 @@unique 复合键查成员表。
 * Prisma 自动为 @@unique([workspaceId, userId]) 生成 workspaceId_userId 键名。
 */
async function getMembership(workspaceId: string, actorId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: actorId },
    },
  });
  if (!member) {
    throw new NotFoundError("Workspace");
  }
  return member;
}

// ============================================================
// createProject — 创建项目（完整实现，模式 A 演示）
// ============================================================

/**
 * Prisma 方法：findUnique（查成员资格）+ create（写数据）
 *
 * 流程：getMembership → 判权限 → create → DTO 转换
 */
export async function createProject(
  input: CreateProjectInput,
  actorId: string
): Promise<ProjectDTO> {
  const member = await getMembership(input.workspaceId, actorId);

  if (!canCreateProject(member.role)) {
    throw new ForbiddenError();
  }

  const project = await prisma.project.create({
    data: {
      workspaceId: input.workspaceId,
      name: input.name,
      description: input.description,
    },
  });

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
// listProjects — 获取项目列表
// ============================================================

/**
 * Prisma 方法：findUnique（查成员资格）+ findMany（查列表）
 * 参考：workspace.service.ts 的 listMyWorkspaces（同样是查属于某范围的列表）
 *
 * 流程：
 * 1. getMembership(workspaceId, actorId) — 验证成员资格
 * 2. prisma.project.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } })
 * 3. 每个 project 转为 ProjectDTO
 *
 * 调用的 Prisma 方法：findUnique, findMany
 */
export async function listProjects(
  workspaceId: string,
  actorId: string
): Promise<ProjectDTO[]> {
  await getMembership(workspaceId, actorId);

  const projects = await prisma.project.findMany({
    where: { workspaceId }, orderBy: { createdAt: "desc" }
  });

  return projects.map((p) => ({
    id: p.id,
    workspaceId: p.workspaceId,
    name: p.name,
    description: p.description,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

// ============================================================
// getProjectById — 获取项目详情
// ============================================================

/**
 * Prisma 方法：findUnique（查 project）+ findUnique（查成员资格）
 * 参考：task.service.ts 的 getTaskById（模式 B：先找资源 → 用其 workspaceId 验成员资格）
 *
 * 流程：
 * 1. prisma.project.findUnique({ where: { id: projectId } })
 *    → 不存在 throw NotFoundError("Project")
 * 2. getMembership(project.workspaceId, actorId) — 验证用户属于此 workspace
 * 3. DTO 转换
 *
 * 调用的 Prisma 方法：findUnique, findUnique
 */
export async function getProjectById(
  projectId: string,
  actorId: string
): Promise<{ project: ProjectDTO; userRole: WorkspaceRole }> {
  const p = await prisma.project.findUnique({ where: { id: projectId } });
  if (!p) throw new NotFoundError("Project Not Founded");

  const member = await getMembership(p.workspaceId, actorId);

  return {
    project: {
      id: p.id,
      workspaceId: p.workspaceId,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    },
    userRole: member.role as WorkspaceRole,
  };
}

// ============================================================
// updateProject — 更新项目
// ============================================================

/**
 * Prisma 方法：findUnique（查 project → 得 workspaceId）
 *            + findUnique（查成员资格）
 *            + update（写数据）
 * 参考：task.service.ts 的 updateTask（模式 B 完整流程）
 *
 * 流程：
 * 1. prisma.project.findUnique({ where: { id: projectId } })
 * 2. getMembership(project.workspaceId, actorId)
 * 3. if (!canUpdateProject(member.role)) throw new ForbiddenError()
 * 4. prisma.project.update({ where: { id }, data: { name, description } })
 * 5. DTO 转换
 *
 * 调用的 Prisma 方法：findUnique, findUnique, update
 */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
  actorId: string
): Promise<ProjectDTO> {
  const projects = await prisma.project.findUnique({ where: { id: projectId } });
  if (!projects) throw new NotFoundError("Project Not Founded");
  const member = await getMembership(projects.workspaceId, actorId);

  if (!canUpdateProject(member.role)) throw new ForbiddenError();

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { name: input.name, description: input.description },
  });

  return {
    id: updated.id,
    workspaceId: updated.workspaceId,
    name: updated.name,
    description: updated.description,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

// ============================================================
// deleteProject — 删除项目（仅 OWNER）
// ============================================================

/**
 * Prisma 方法：findUnique（查 project → 得 workspaceId）
 *            + findUnique（查成员资格）
 *            + delete（删数据）
 * 参考：task.service.ts 的 deleteTask（模式 B → 判权限 → delete）
 *
 * 流程：
 * 1. prisma.project.findUnique({ where: { id: projectId } })
 * 2. getMembership(project.workspaceId, actorId)
 * 3. if (!canDeleteProject(member.role)) throw new ForbiddenError()
 *    —— 注意：这里用 canDeleteProject，不是 canUpdateProject！只有 OWNER 能删
 * 4. prisma.project.delete({ where: { id } })
 * 5. 返回 void（级联删除 Task 由 onDelete: Cascade 处理）
 *
 * 调用的 Prisma 方法：findUnique, findUnique, delete
 */
export async function deleteProject(
  projectId: string,
  actorId: string
): Promise<void> {
  const projects = await prisma.project.findUnique({ where: { id: projectId } });
  if (!projects) throw new NotFoundError("Project Not Founded");
  const member = await getMembership(projects.workspaceId, actorId);

  if (!canDeleteProject(member.role)) throw new ForbiddenError();

  await prisma.project.delete({ where: { id: projectId } });
}
