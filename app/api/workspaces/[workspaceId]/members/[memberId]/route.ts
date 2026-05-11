import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { removeMember } from "@/services/workspace.service";

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
    return fail(error as Error);
  }
}
