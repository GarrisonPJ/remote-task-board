import { prisma } from "@/lib/prisma";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  AddWorkspaceMemberInput,
} from "@/schemas/workspace.schema";
import type { WorkspaceDTO, WorkspaceMemberDTO } from "@/types/domain";

type WorkspaceRole = "OWNER" | "MEMBER" | "VIEWER";

// ============================================================
// Permission helpers
// ============================================================

/** Only OWNER can manage workspace settings, members, and delete the workspace */
function canManageWorkspace(role: WorkspaceRole): boolean {
  return role === "OWNER";
}

// ============================================================
// createWorkspace — creates a workspace and adds creator as OWNER
// ============================================================

/** Creates a workspace and adds the creator as OWNER. */
export async function createWorkspace(
  input: CreateWorkspaceInput,
  actorId: string
): Promise<WorkspaceDTO> {
  const workspace = await prisma.$transaction(async (tx) => {
    const created = await tx.workspace.create({
      data: { name: input.name },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: created.id,
        userId: actorId,
        role: "OWNER",
      },
    });

    return created;
  });

  return {
    id: workspace.id,
    name: workspace.name,
    role: "OWNER",
    createdAt: workspace.createdAt.toISOString(),
    updatedAt: workspace.updatedAt.toISOString(),
  };
}

// ============================================================
// listMyWorkspaces
// ============================================================

/** Lists all workspaces the user is a member of. Queries from WorkspaceMember for data isolation. */
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
// getWorkspaceById
// ============================================================

/** Gets a workspace by its ID. Only accessible to workspace members. */
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
// updateWorkspace (OWNER only)
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
// deleteWorkspace (OWNER only)
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
// addMember (OWNER only)
// ============================================================

export async function addMember(
  workspaceId: string,
  input: AddWorkspaceMemberInput,
  actorId: string
): Promise<void> {
  const operator = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: actorId } },
  });
  if (!operator) throw new NotFoundError("Workspace");
  if (!canManageWorkspace(operator.role)) throw new ForbiddenError();

  const targetUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (!targetUser) {
    throw new AppError("USER_NOT_FOUND", "User with this email does not exist.", 404);
  }

  await prisma.workspaceMember.create({
    data: {
      workspaceId,
      userId: targetUser.id,
      role: input.role,
    },
  });
}

// ============================================================
// listMembers
// ============================================================

export async function listMembers(
  workspaceId: string,
  actorId: string
): Promise<WorkspaceMemberDTO[]> {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: actorId } },
  });
  if (!member) throw new NotFoundError("Workspace");

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return members.map((m) => ({
    id: m.id,
    user: m.user,
    role: m.role as WorkspaceRole,
  }));
}

// ============================================================
// removeMember (OWNER only)
// ============================================================

export async function removeMember(
  workspaceId: string,
  memberId: string,
  actorId: string
): Promise<void> {
  const operator = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: actorId } },
  });
  if (!operator) throw new NotFoundError("Workspace");
  if (!canManageWorkspace(operator.role)) throw new ForbiddenError();

  // Prevent removing the last OWNER of a workspace.
  const ownerCount = await prisma.workspaceMember.count({
    where: { workspaceId, role: "OWNER" },
  });

  const target = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });
  if (!target || target.workspaceId !== workspaceId) throw new NotFoundError("Member");

  if (target.role === "OWNER" && ownerCount <= 1) {
    throw new AppError(
      "LAST_OWNER",
      "Cannot remove the last owner of a workspace.",
      400
    );
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } });
}
