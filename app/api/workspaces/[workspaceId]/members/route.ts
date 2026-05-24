import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { addWorkspaceMemberSchema } from "@/schemas/workspace.schema";
import { addMember, listMembers } from "@/services/workspace.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await requireUser();
    const { workspaceId } = await params;
    const members = await listMembers(workspaceId, user.id);
    return ok(members);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await requireUser();
    const { workspaceId } = await params;
    const body = await req.json();
    const input = addWorkspaceMemberSchema.parse(body);
    await addMember(workspaceId, input, user.id);
    return ok(null, 201);
  } catch (error) {
    return fail(error);
  }
}
