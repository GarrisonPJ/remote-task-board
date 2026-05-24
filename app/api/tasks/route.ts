/**
 * Task API routes
 *
 * GET  /api/tasks?projectId=xxx&status=TODO&q=search&page=1&pageSize=20
 * POST /api/tasks
 *
 * Query params are extracted from URL search params and parsed by zod (coerce + defaults + validation).
 * Full example: /api/tasks?projectId=abc&status=IN_PROGRESS&priority=HIGH&q=bug&page=1&pageSize=10
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { createTaskSchema, listTasksQuerySchema } from "@/schemas/task.schema";
import { listTasks, createTask } from "@/services/task.service";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();

    // URLSearchParams → plain object for zod parsing
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());

    // zod handles coercion, defaults, and validation
    const query = listTasksQuerySchema.parse(params);

    const result = await listTasks(query, user.id);
    return ok(result);
  } catch (error) {
    return fail(error);
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
    return fail(error);
  }
}
