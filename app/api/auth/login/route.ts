/**
 * POST /api/auth/login
 *
 * Authenticates user credentials and sets an httpOnly session cookie.
 *
 * Cookie security configuration:
 *   httpOnly: true   — prevents XSS-based token theft via document.cookie
 *   secure: true     — HTTPS only in production
 *   sameSite: "lax"  — CSRF protection, allows GET navigations from external sites
 *   path: "/"        — cookie is valid for all routes
 *   maxAge: 7d       — matches Session.expiresAt in the database
 */

import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { loginSchema } from "@/schemas/auth.schema";
import { login } from "@/services/auth.service";
import { SESSION_COOKIE_OPTIONS } from "@/lib/cookie-options";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = loginSchema.parse(body);
    const { user, sessionId } = await login(input);

    const response = NextResponse.json(
      { success: true, data: user },
      { status: 200 }
    );

    response.cookies.set("session_id", sessionId, SESSION_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    return fail(error);
  }
}
