/**
 * /api/workspaces/[workspaceId]
 *
 * GET    /api/workspaces/:id — detail
 * PATCH  /api/workspaces/:id — rename (OWNER only)
 * DELETE /api/workspaces/:id — delete workspace (OWNER only, cascades to projects/tasks)
 *
 * In Next.js App Router, [workspaceId] is a dynamic segment accessed via params.
 * Next.js 15+ requires await params to unwrap the Promise.
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import {
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
} from "@/services/workspace.service";
import { updateWorkspaceSchema } from "@/schemas/workspace.schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await requireUser();
    const { workspaceId } = await params;
    const workspace = await getWorkspaceById(workspaceId, user.id);
    return ok(workspace);
  } catch (error) {
    return fail(error);
  }
}

/** Updates workspace name (OWNER only). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await requireUser();
    const { workspaceId } = await params;
    const body = await req.json();
    const input = updateWorkspaceSchema.parse(body);
    const workspace = await updateWorkspace(workspaceId, input, user.id);
    return ok(workspace);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Deletes a workspace (OWNER only).
 * Prisma onDelete: Cascade handles Project, Task, and ActivityLog cleanup.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await requireUser();
    const { workspaceId } = await params;
    await deleteWorkspace(workspaceId, user.id);
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}
