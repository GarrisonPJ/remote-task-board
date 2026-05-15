import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { createCommentSchema } from "@/schemas/comment.schema";
import { listComments, createComment } from "@/services/comment.service";

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await requireUser();
    const { taskId } = await params;
    const body = await req.json();
    const input = createCommentSchema.parse(body);
    const comment = await createComment(taskId, input.content, user.id);
    return ok(comment, 201);
  } catch (error) {
    return fail(error as Error);
  }
}
