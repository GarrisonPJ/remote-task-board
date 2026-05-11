/**
 * /api/workspaces/[workspaceId] — 单个工作区操作
 *
 * GET    /api/workspaces/:id — 获取详情
 * PATCH  /api/workspaces/:id — 更新名称（仅 OWNER）
 * DELETE /api/workspaces/:id — 删除工作区（仅 OWNER）
 *
 * Next.js App Router 动态路由：
 *   [workspaceId] 目录名 → params.workspaceId 获取值
 *   Next.js 15+ 中 params 是 Promise，需要用 await params 解包
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import {
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
} from "@/services/workspace.service";
import { updateWorkspaceSchema } from "@/schemas/workspace.schema";

// ============================================================
// GET /api/workspaces/:workspaceId
// ============================================================
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await requireUser();
    const { workspaceId } = await params;
    const workspace = await getWorkspaceById(workspaceId, user.id);
    return ok(workspace);
  } catch (error) {
    return fail(error as Error);
  }
}

// ============================================================
// PATCH /api/workspaces/:workspaceId
// ============================================================

/**
 * 更新工作区名称（仅 OWNER）。
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await requireUser();
    const { workspaceId } = await params;
    const body = await req.json();
    const input = updateWorkspaceSchema.parse(body);
    const workspace = await updateWorkspace(workspaceId, input, user.id);
    return ok(workspace);
  } catch (error) {
    return fail(error as Error);
  }
}

// ============================================================
// DELETE /api/workspaces/:workspaceId
// ============================================================

/**
 * 删除工作区（仅 OWNER）。
 * 级联删除：Project/Task/ActivityLog 由 Prisma schema 的 onDelete: Cascade 自动处理。
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await requireUser();
    const { workspaceId } = await params;
    await deleteWorkspace(workspaceId, user.id);
    return ok(null);
  } catch (error) {
    return fail(error as Error);
  }
}
