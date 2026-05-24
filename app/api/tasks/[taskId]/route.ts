/**
 * /api/tasks/[taskId] — 单个任务操作
 *
 * GET    /api/tasks/:id — 获取详情（含 ActivityLog 时间线）
 * PATCH  /api/tasks/:id — 更新任务字段（标题/描述/优先级/负责人/截止日期）
 * DELETE /api/tasks/:id — 删除任务
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
 * 更新任务字段：标题、描述、优先级、负责人、截止日期。
 * 不传的字段保持原值（Prisma 的 update 只修改 data 中提供的字段）。
 *
 * 注意：如果修改了 assigneeId，task.service.ts 必须验证新 assignee 在 workspace 中。
 * （设计文档 Schema 注释中的 #868）
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
 * 删除权限：OWNER 可以删任何人的任务，MEMBER 只能删自己创建的。
 * 权限检查在 task.service.ts 的 canDeleteTask() 中实现。
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
