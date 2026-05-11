/**
 * Auth middleware — session-based authentication via httpOnly cookies.
 * Reads session_id from cookies → queries Session table → returns user or throws.
 */

import { cookies } from "next/headers";
import { UnauthorizedError } from "./errors";
import { getCurrentUser, cleanupExpiredSessions } from "@/services/auth.service";

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
    cleanupExpiredSessions();  // ~1%概率清理过期 session
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
