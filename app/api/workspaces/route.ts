/**
 * Workspace API 路由
 *
 * GET  /api/workspaces — 获取我的工作区列表
 * POST /api/workspaces — 创建工作区
 *
 * 设计文档参考：Section 14.2 (Workspace API)
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { createWorkspaceSchema } from "@/schemas/workspace.schema";
import {
  listMyWorkspaces,
  createWorkspace,
} from "@/services/workspace.service";

// ============================================================
// GET /api/workspaces — 获取当前用户的工作区列表
// ============================================================
export async function GET() {
  try {
    const user = await requireUser();
    const workspaces = await listMyWorkspaces(user.id);
    return ok(workspaces);
  } catch (error) {
    return fail(error as Error);
  }
}

// ============================================================
// POST /api/workspaces — 创建工作区
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const input = createWorkspaceSchema.parse(body);
    const workspace = await createWorkspace(input, user.id);
    return ok(workspace, 201);
  } catch (error) {
    return fail(error as Error);
  }
}
