/**
 * POST /api/auth/logout
 *
 * Clears the session: validates auth → deletes session from DB → clears cookie.
 * The cookie is cleared even when no valid session_id is found server-side.
 */

import { NextRequest, NextResponse } from "next/server";
import { fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { logout } from "@/services/auth.service";
import { SESSION_COOKIE_OPTIONS } from "@/lib/cookie-options";

export async function POST(req: NextRequest) {
  try {
    await requireUser();

    const sessionId = req.cookies.get("session_id")?.value;
    if (sessionId) await logout(sessionId);

    const response = NextResponse.json(
      { success: true, data: null },
      { status: 200 }
    );

    response.cookies.set("session_id", "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });

    return response;
  } catch (error) {
    return fail(error);
  }
}
