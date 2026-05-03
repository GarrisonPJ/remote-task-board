/**
 * GET /api/auth/me — 获取当前登录用户
 *
 * 最简单的 GET 端点：requireUser() 已经完成 session 验证并返回 user，
 * 直接包装返回即可。
 *
 * requireUser() 的工作流程（在 lib/auth.ts 中实现）：
 *   1. 从 cookie 中读取 session_id
 *   2. 在 Session 表中查找 + 检查过期
 *   3. 通过 userId 关联查询 User
 *   4. 未登录 → 抛出 UnauthorizedError → fail() 返回 401
 */

import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    return ok(user);
  } catch (error) {
    return fail(error as Error);
  }
}
