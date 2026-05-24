/**
 * PATCH /api/tasks/:taskId/status
 *
 * The most important write endpoint in the project:
 * 1. State-machine validation (VALID_TRANSITIONS in lib/constants.ts)
 * 2. Permission check (OWNER unrestricted, MEMBER must be assignee)
 * 3. Atomic transaction: task.status update + ActivityLog creation
 *
 * Prisma $transaction guarantees atomicity:
 *   If the ActivityLog write fails, the task.status update rolls back automatically.
 *   No risk of "status changed without an audit log" inconsistency.
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { updateTaskStatusSchema } from "@/schemas/task.schema";
import { updateTaskStatus } from "@/services/task.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await requireUser();
    const { taskId } = await params;
    const body = await req.json();
    const input = updateTaskStatusSchema.parse(body);
    const task = await updateTaskStatus(taskId, input, user.id);
    return ok(task);
  } catch (error) {
    return fail(error);
  }
}
