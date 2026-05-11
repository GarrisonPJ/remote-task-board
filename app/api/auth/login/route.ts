/**
 * POST /api/auth/login — 用户登录
 *
 * 这个 Route Handler 多了一步：设置 httpOnly cookie。
 *
 * Cookie 安全配置说明：
 *   httpOnly: true   — JS 无法通过 document.cookie 读取，防止 XSS 窃取 session
 *   secure: true     — 仅通过 HTTPS 传输（生产环境必须，本地 HTTP 开发时关闭）
 *   sameSite: "lax"  — 防止 CSRF 攻击，允许从其他站点 GET 导航但禁止 POST
 *   path: "/"        — cookie 对所有路径有效
 *   maxAge: 7天       — 与 Session.expiresAt 保持一致
 */

import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { loginSchema } from "@/schemas/auth.schema";
import { login } from "@/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = loginSchema.parse(body);
    const { user, sessionId } = await login(input);

    // 创建响应并设置 httpOnly cookie
    const response = NextResponse.json(
      { success: true, data: user },
      { status: 200 }
    );

    response.cookies.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 天（单位：秒）
    });

    return response;
  } catch (error) {
    return fail(error as Error);
  }
}
