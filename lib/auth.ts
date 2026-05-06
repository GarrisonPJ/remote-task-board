/**
 * Auth 中间件 — Session 认证
 *
 * 职责：从 cookie 读 session_id → 调 auth service 查用户 → 返回 / 抛异常。
 * 数据库逻辑全在 services/auth.service.ts，这里只做 HTTP 层的 cookie 读写。
 *
 * 完整链路：
 *   浏览器 → cookie(session_id) → requireUser()
 *     → 读 cookie → getCurrentUser(sessionId) 查 Session 表
 *     → 验证过期 → 返回 User 或 null → 未登录抛 401
 */

import { cookies } from "next/headers";
import { UnauthorizedError } from "./errors";
import { getCurrentUser } from "@/services/auth.service";

/**
 * 从 cookie 读取 session_id，调 service 查 Session 表，返回当前用户。
 * 未登录返回 null（不抛异常，让调用方决定怎么处理）。
 */
export async function getUserFromSession(): Promise<{
  id: string;
  name: string;
  email: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session_id");
    if (!sessionCookie?.value) return null;

    // 数据库逻辑委托给 auth service（和 logout/register/login 统一管理）
    return await getCurrentUser(sessionCookie.value);
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getUserFromSession();
  if (!user) throw new UnauthorizedError();
  return user;
}
