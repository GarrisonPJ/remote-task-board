/**
 * POST /api/auth/register — User registration.
 * Parses request body, validates via zod, delegates to auth service,
 * and sets httpOnly session cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { fail } from "@/lib/api-response";
import { registerSchema } from "@/schemas/auth.schema";
import { register } from "@/services/auth.service";
import { SESSION_COOKIE_OPTIONS } from "@/lib/cookie-options";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = registerSchema.parse(body);
    const { user, sessionId } = await register(input);

    const response = NextResponse.json(
      { success: true, data: user },
      { status: 201 }
    );
    response.cookies.set("session_id", sessionId, SESSION_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    return fail(error);
  }
}
