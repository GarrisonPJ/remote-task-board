/**
 * Auth 中间件 — Session 认证
 *
 * 自定义 Session 认证的完整链路（面试可以完整讲清楚）：
 *
 *   浏览器 → cookie(session_id) → Next.js Route Handler
 *     → requireUser() 读 cookie → 查 Session 表 → 验证过期 → 返回 User
 *
 * bcrypt + httpOnly cookie + 数据库 Session 表 = 一个完整的 Web 认证实现
 *
 * 你需要实现的部分：
 * 1. getUserFromSession() — 从 cookie 读 session_id → 查 Session 表 → 返回 User
 * 2. 可选的 middleware.ts — 保护 /dashboard, /api/* 等路由
 *
 * 使用方式（在 Server Component 中）：
 *   const user = await getUserFromSession();
 *   if (!user) redirect("/login");
 *
 * 使用方式（在 Route Handler 中）：
 *   const user = await requireUser(); // 未登录自动返回 401
 *
 * 设计文档参考：Section 8.1 (Session 实现细节表格), Section 18.3
 */

import { cookies } from "next/headers";
import { UnauthorizedError } from "./errors";
import { prisma } from "./prisma";

/**
 * 从 cookie 中读取 session_id，查 Session 表，返回当前用户。
 *
 * 实现步骤：
 * 1. 用 next/headers 的 cookies().get("session_id") 读取 cookie
 * 2. 用 prisma.session.findUnique 查 Session 表
 * 3. include user（只 select id, name, email — 不要返回 passwordHash！）
 * 4. 检查 session 是否过期（expiresAt < now）
 * 5. 返回 user 或 null
 *
 * 为什么返回 null 而不直接抛异常：
 *   这样 Server Component 可以根据是否登录决定渲染不同内容（如登录页 vs 仪表盘），
 *   Route Handler 可以用 requireUser() 统一抛异常。
 */
export async function getUserFromSession(): Promise<{
  id: string;
  name: string;
  email: string;
} | null> {
  try {
    // Step 1: 读取 cookie（next/headers 的 cookies() 是同步的）
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session_id");

    if (!sessionCookie?.value) {
      return null; // 没有 cookie → 未登录
    }

    // Step 2: 查 Session 表
    const session = await prisma.session.findUnique({
      where: { id: sessionCookie.value },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!session) {
      return null; // session 不存在（可能已被删除）
    }

    // Step 3: 检查过期
    if (session.expiresAt < new Date()) {
      return null; // session 已过期
    }

    // Step 4: 返回用户信息
    return session.user;
  } catch {
    // 如果数据库连接失败等，安全返回 null（不是 500）
    return null;
  }
}

/**
 * 获取当前用户，未登录则抛 UnauthorizedError。
 * 用于 Route Handler 的第一行：
 *
 *   const user = await requireUser();
 *
 * fail() 会自动将 UnauthorizedError 转为 401 JSON 响应。
 */
export async function requireUser() {
  const user = await getUserFromSession();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}
