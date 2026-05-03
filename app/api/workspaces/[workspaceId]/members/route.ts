/**
 * POST /api/workspaces/:workspaceId/members — 添加成员
 *
 * 仅 OWNER 可添加成员。
 *
 * TODO: 等你实现 workspace.service.ts 的 addMember() 方法后，取消以下代码注释。
 *
 * 实现流程（在 service 中）：
 * 1. 检查 actor 是 workspace 的 OWNER
 * 2. 根据 input.email 查找目标 user（prisma.user.findUnique）
 * 3. 如果用户不存在 → throw AppError("USER_NOT_FOUND", ...)
 * 4. 创建 WorkspaceMember（role 从 input 取，默认 MEMBER）
 * 5. 如果 @@unique([workspaceId, userId]) 冲突 → Prisma 会抛 P2002 错误
 *
 * addWorkspaceMemberSchema 校验：
 *   email: string().email()
 *   role: enum(["MEMBER", "VIEWER"]).default("MEMBER")
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
    const user = await requireUser();
    const { workspaceId } = await params;
    const body = await req.json();
    const input = addWorkspaceMemberSchema.parse(body);
    await addMember(workspaceId, input, user.id);
    return ok(null, 201);
  } catch (error) {
    return fail(error as Error);
  }
}
