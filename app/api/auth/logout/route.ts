/**
 * POST /api/auth/logout — 用户登出
 *
 * 登出操作：
 * 1. 验证登录状态
 * 2. 调用 service 删除 session
 * 3. 清除浏览器 cookie
 *
 * cookie 读取方式：req.cookies.get("session_id")?.value
 */

import { NextRequest, NextResponse } from "next/server";
import { fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { logout } from "@/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    await requireUser();

    const sessionId = req.cookies.get("session_id")?.value;
    if (sessionId) await logout(sessionId);

    // 清除 cookie —— 无论 session 是否存在都执行
    const response = NextResponse.json(
      { success: true, data: null },
      { status: 200 }
    );

    response.cookies.set("session_id", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // 立即过期
    });

    return response;
  } catch (error) {
    return fail(error as Error);
  }
}
