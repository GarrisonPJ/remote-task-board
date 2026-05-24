/**
 * /api/tasks/[taskId]
 *
 * GET    /api/tasks/:id — task detail with ActivityLog timeline
 * PATCH  /api/tasks/:id — update fields (title, description, priority, assignee, dueDate)
 * DELETE /api/tasks/:id — delete task
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { updateTaskSchema } from "@/schemas/task.schema";
import {
  getTaskById,
  updateTask,
  deleteTask,
} from "@/services/task.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await requireUser();
    const { taskId } = await params;
    const { task } = await getTaskById(taskId, user.id);
    return ok(task);
  } catch (error) {
    return fail(error);
  }
}

/**
 * PATCH /api/tasks/:taskId
 *
 * Updates optional task fields (title, description, priority, assigneeId, dueDate).
 * Prisma update only touches provided fields — omitted fields retain their values.
 * When assigneeId changes, validateAssigneeInWorkspace() ensures the new assignee
 * is a member of the project's workspace.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await requireUser();
    const { taskId } = await params;
    const body = await req.json();
    const input = updateTaskSchema.parse(body);
    const task = await updateTask(taskId, input, user.id);
    return ok(task);
  } catch (error) {
    return fail(error);
  }
}

/**
 * DELETE /api/tasks/:taskId
 *
 * Permission: OWNER can delete any task. MEMBER can only delete tasks they created.
 * Enforcement is in task.service.ts via canDeleteTask().
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await requireUser();
    const { taskId } = await params;
    await deleteTask(taskId, user.id);
    return ok(null);
  } catch (error) {
    return fail(error);
  }
}
