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
// 公共辅助：获取用户在 workspace 中的成员资格
// ============================================================

/**
 * Looks up a user's membership in a workspace via the composite key.
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
// createProject — 创建项目
// ============================================================

/** Creates a new project within a workspace. */
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

/** Lists all projects in a workspace. */
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

/** Gets a project by its ID with user role. */
export async function getProjectById(
  projectId: string,
  actorId: string
): Promise<{ project: ProjectDTO; userRole: WorkspaceRole }> {
  const p = await prisma.project.findUnique({ where: { id: projectId } });
  if (!p) throw new NotFoundError("Project not found");

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

/** Updates a project. Only workspace OWNER or MEMBER can update. */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
  actorId: string
): Promise<ProjectDTO> {
  const projects = await prisma.project.findUnique({ where: { id: projectId } });
  if (!projects) throw new NotFoundError("Project not found");
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

/** Deletes a project. Only workspace OWNER can delete. */
export async function deleteProject(
  projectId: string,
  actorId: string
): Promise<void> {
  const projects = await prisma.project.findUnique({ where: { id: projectId } });
  if (!projects) throw new NotFoundError("Project not found");
  const member = await getMembership(projects.workspaceId, actorId);

  if (!canDeleteProject(member.role)) throw new ForbiddenError();

  await prisma.project.delete({ where: { id: projectId } });
}
