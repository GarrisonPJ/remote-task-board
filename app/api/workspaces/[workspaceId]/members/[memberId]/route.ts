/**
 * DELETE /api/workspaces/:workspaceId/members/:memberId — 移除成员
 *
 * 仅 OWNER 可移除成员。不能移除最后一个 OWNER。
 *
 * TODO: 等你实现 workspace.service.ts 的 removeMember() 方法后即可工作。
 *
 * 动态路由参数：
 *   同时使用了 [workspaceId] 和 [memberId]，两个都从 params 获取：
 *   const { workspaceId, memberId } = await params;
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { removeMember } from "@/services/workspace.service";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const user = await requireUser();
    const { workspaceId, memberId } = await params;
    await removeMember(workspaceId, memberId, user.id);
    return ok(null);
  } catch (error) {
    return fail(error as Error);
  }
}
