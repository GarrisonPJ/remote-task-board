import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { listComments } from "@/services/comment.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await requireUser();
    const { taskId } = await params;
    const comments = await listComments(taskId, user.id);
    return ok(comments);
  } catch (error) {
    return fail(error as Error);
  }
}
