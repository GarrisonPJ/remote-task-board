/**
 * Task API 路由
 *
 * GET  /api/tasks?projectId=xxx&status=TODO&q=search&page=1&pageSize=20
 * POST /api/tasks
 *
 * GET 查询参数通过 URL search params 传递，zod coerce 自动转换类型。
 *
 * 筛选/分页/搜索完整示例 URL：
 *   /api/tasks?projectId=abc&status=IN_PROGRESS&priority=HIGH&q=bug&page=1&pageSize=10
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { createTaskSchema, listTasksQuerySchema } from "@/schemas/task.schema";
import { listTasks, createTask } from "@/services/task.service";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();

    // 将 URL search params 转为普通对象（zod parse 需要）
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());

    // parse() 执行：coerce 类型转换 + 默认值填充 + 校验
    const query = listTasksQuerySchema.parse(params);

    const result = await listTasks(query, user.id);
    return ok(result);
  } catch (error) {
    return fail(error as Error);
  }
}

// ============================================================
// POST /api/tasks
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const input = createTaskSchema.parse(body);
    const task = await createTask(input, user.id);
    return ok(task, 201);
  } catch (error) {
    return fail(error as Error);
  }
}
