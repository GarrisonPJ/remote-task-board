/**
 * DELETE /api/workspaces/:workspaceId/members/:memberId — 移除成员
 *
 * 仅 OWNER 可移除成员。不能移除最后一个 OWNER。
 *
 * 实现流程：
 * 1. requireUser() 获取操作者
 * 2. 从 params 取 workspaceId 和 memberId（动态路由两个参数）
 * 3. 调 removeMember(workspaceId, memberId, user.id)
 * 4. 返回 ok(null)
 *
 * 调用的 Prisma 方法（在 service 中）：findUnique（查权限）、count（防删最后一个OWNER）、delete（删成员）
 * 参考：app/api/workspaces/[workspaceId]/route.ts 的 DELETE 写法
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
    // TODO: 按上方流程实现
    throw new Error("Not implemented");
  } catch (error) {
    return fail(error as Error);
  }
}
