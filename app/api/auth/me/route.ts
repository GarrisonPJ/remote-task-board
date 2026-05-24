/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user.
 * requireUser() validates the session cookie and returns the user or throws 401.
 * The complete flow is: read session_id cookie → query Session table → check expiry → return User.
 */

import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    return ok(user);
  } catch (error) {
    return fail(error);
  }
}
