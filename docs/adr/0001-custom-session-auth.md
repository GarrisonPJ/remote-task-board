# ADR 0001: Custom Session Authentication

**Status:** Accepted

**Date:** 2025-05-15

## Context

The application requires user authentication: registration, login, logout, and
session persistence across requests. Users must be identifiable so the system
can enforce permissions and scope data to their workspaces.

Three approaches were considered:

1. **NextAuth.js** -- the de facto auth library for Next.js. Provides social
   logins, JWT or database sessions, and broad community support. However, it
   abstracts away the session lifecycle (cookie setting, session table reads)
   behind provider configuration, making it harder to reason about and debug.
   It also introduces a dependency with its own upgrade cadence.

2. **JWT (JSON Web Tokens)** -- stateless auth where all session data lives in
   a signed token on the client. Eliminates database lookups on every request.
   However, JWTs cannot be revoked server-side (immediate logout is
   impossible), and token size grows with claims. Leaked tokens remain valid
   until expiry.

3. **Custom session auth** -- a `Session` table in PostgreSQL storing a UUID
   keyed to a user, with an httpOnly cookie as the transport layer. This is
   the most manual approach but gives full control over the auth lifecycle.

## Decision

Use custom session authentication with the following design:

- **Password hashing:** bcryptjs, 12 rounds (the Node.js-only fork of bcrypt).
- **Session storage:** `Session` table in PostgreSQL with columns `id` (UUID),
  `userId` (FK to User), `expiresAt` (7 days from creation), `createdAt`.
- **Session ID generation:** `crypto.randomUUID()`.
- **Transport:** httpOnly cookie named `session_id` with `SameSite=Lax`,
  `Secure` in production, `Path=/`, `Max-Age=604800`.
- **Session validation (every request):** `lib/auth.ts:getUserFromSession()`
  reads the cookie, queries `prisma.session.findUnique()`, checks `expiresAt`,
  returns the user or null.
- **Immediate logout:** `DELETE FROM Session WHERE id = <sessionId>` -- the
  cookie is also cleared on the response.
- **Expired session cleanup:** `cleanupExpiredSessions()` runs at most once per
  hour (time-based throttle), deleting rows where `expiresAt < now()`.
- **Registration implies automatic login:** both user creation and session
  creation happen in a single Prisma transaction.

## Consequences

### Positive

- **Full ownership of the auth layer.** No dependency on a third-party auth
  library. The entire auth flow can be understood by reading three files:
  `lib/auth.ts`, `lib/cookie-options.ts`, and `services/auth.service.ts`.
- **Immediate logout.** Because sessions are database rows, deleting the row
  instantly invalidates the session. No token expiry window.
- **Simple mental model.** A cookie value maps to a database row. No signing,
  no JWT claims, no refresh token rotation.
- **Direct session introspection.** The `Session` table can be queried for
  debugging: "how many active sessions does user X have?" without decoding
  tokens.

### Negative

- **No social login.** Every user must register with email and password. Adding
  OAuth providers later would require either a migration to NextAuth or a
  custom OAuth implementation.
- **No MFA / multi-factor authentication.** Not built in. Would require a
  separate implementation.
- **Manual session cleanup.** Expired sessions accumulate before the hourly
  cleanup runs. For this project's scale (demo + small teams) the overhead is
  negligible (a handful of rows per user per week).
- **Database round-trip on every request.** Every protected page and Route
  Handler queries the `Session` table to validate the cookie. This is fast
  (indexed lookup by primary key on a small table) but not as fast as a
  JWT verify.
