/**
 * POST /api/workspaces/:workspaceId/members — 添加成员
 *
 * 仅 OWNER 可添加成员。
 *
 * 实现流程：
 * 1. requireUser() 获取操作者
 * 2. 从 params 取 workspaceId
 * 3. req.json() → addWorkspaceMemberSchema.parse() 校验输入（email + role）
 * 4. 调 addMember(workspaceId, input, user.id)
 * 5. 返回 ok(null, 201)
 *
 * 调用的 Prisma 方法（在 service 中）：findUnique（查权限）、findUnique（按 email 查用户）、create（写成员关系）
 * 参考：task.service.ts updateTaskStatus 的 Route Handler 写法
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { addWorkspaceMemberSchema } from "@/schemas/workspace.schema";
import { addMember } from "@/services/workspace.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    // TODO: 按上方流程实现
    throw new Error("Not implemented");
  } catch (error) {
    return fail(error as Error);
  }
}
