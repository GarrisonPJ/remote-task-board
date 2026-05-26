import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { removeMember, updateMemberRole } from "@/services/workspace.service";
import type { WorkspaceRole } from "@/lib/constants";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const user = await requireUser();
    const { workspaceId, memberId } = await params;
    const body = await req.json();
    if (!body.role) throw new Error("Role is required");
    await updateMemberRole(workspaceId, memberId, body.role as WorkspaceRole, user.id);
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const user = await requireUser();
    const { workspaceId, memberId } = await params;
    await removeMember(workspaceId, memberId, user.id);
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}
