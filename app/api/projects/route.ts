/**
 * Project API 路由
 *
 * GET  /api/projects?workspaceId=xxx — 获取项目列表（按 workspace 筛选）
 * POST /api/projects — 创建项目
 *
 * 查询参数读取方式：
 *   req.nextUrl.searchParams.get("workspaceId")
 *
 * 设计文档参考：Section 14.3 (Project API)
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { createProjectSchema } from "@/schemas/project.schema";
import { createProject } from "@/services/project.service";

// ============================================================
// GET /api/projects?workspaceId=xxx
// ============================================================

/**
 * 实现流程：
 * 1. requireUser()
 * 2. req.nextUrl.searchParams.get("workspaceId") 读查询参数
 * 3. 无 workspaceId → 返回空列表 ok([])
 * 4. 调 listProjects(workspaceId, user.id)
 * 5. 返回 ok(projects)
 *
 * 依赖：你补完 project.service.ts 的 listProjects 后即通
 * 参考：app/api/workspaces/route.ts 的 GET 写法
 */
export async function GET(req: NextRequest) {
  try {
    // TODO: 按上方流程实现
    throw new Error("Not implemented — 补完 project.service.ts 的 listProjects 后实现");
  } catch (error) {
    return fail(error as Error);
  }
}

// ============================================================
// POST /api/projects
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const input = createProjectSchema.parse(body);
    const project = await createProject(input, user.id);
    return ok(project, 201);
  } catch (error) {
    return fail(error as Error);
  }
}
