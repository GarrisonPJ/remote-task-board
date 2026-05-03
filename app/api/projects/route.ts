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
import { listProjects, createProject } from "@/services/project.service";

// ============================================================
// GET /api/projects?workspaceId=xxx
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();

    // 从 URL 查询参数中读取 workspaceId
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId) {
      return ok([]); // 无 workspaceId 时返回空列表
    }

    const projects = await listProjects(workspaceId, user.id);
    return ok(projects);
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
