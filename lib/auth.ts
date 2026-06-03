/**
 * Auth middleware — session-based authentication via httpOnly cookies.
 * Reads session_id from cookies → queries Session table → returns user or throws.
 */

import { cookies } from "next/headers";
import type { UserDTO } from "@/types/domain";
import { UnauthorizedError } from "./errors";
import { getCurrentUser, cleanupExpiredSessions } from "@/services/auth.service";

/**
 * Reads session_id from cookie and returns the authenticated user.
 * Returns null (not throw) so callers can decide how to handle unauthenticated state.
 */
export async function getUserFromSession(): Promise<UserDTO | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session_id");
    if (!sessionCookie?.value) return null;

    // Delegates DB logic to auth service (single code path with login/register/logout)
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
