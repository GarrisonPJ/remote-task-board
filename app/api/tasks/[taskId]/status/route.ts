/**
 * PATCH /api/tasks/:taskId/status — 更新任务状态
 *
 * 这是项目中最重要的写端点：
 * 2. 权限检查（OWNER 全面 + MEMBER 需是 assignee）
 * 3. 事务：同时更新 task.status 和创建 ActivityLog
 *
 * Prisma $transaction 保证原子性：
 *   如果 ActivityLog 写入失败，task.status 的更新会自动回滚。
 *   不会出现"状态改了但没日志"的数据不一致。
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
