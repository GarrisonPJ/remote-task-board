/**
 * POST /api/auth/register — User registration.
 * Parses request body, validates via zod, delegates to auth service,
 * and sets httpOnly session cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { fail } from "@/lib/api-response";
import { registerSchema } from "@/schemas/auth.schema";
import { register } from "@/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = registerSchema.parse(body);
    const { user, sessionId } = await register(input);

    const response = NextResponse.json(
      { success: true, data: user },
      { status: 201 }
    );
    response.cookies.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return fail(error as Error);
  }
}
