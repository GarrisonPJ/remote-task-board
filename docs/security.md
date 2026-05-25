# Security

> Security model for Remote Task Board -- session management, authentication, authorization, data isolation, and input validation.

---

## 1. Session Security

### Session Fixation

Prevented by regenerating the session ID on every login. `auth.service.login()` always creates a new `Session` record via `crypto.randomUUID()` -- never reuses an existing session ID from the client.

### CSRF

Mitigated by `SameSite=Lax` on the session cookie. Cross-origin POST requests (from another site's form or fetch) are not sent the cookie. Same-origin requests carry the cookie normally. This covers all mutation endpoints (`POST /api/auth/login`, `POST /api/tasks`, etc.).

### XSS

The `httpOnly` flag on the session cookie prevents any client-side JavaScript from reading `document.cookie`. Even if an XSS vulnerability exists, the attacker cannot extract the session ID.

### Cookie Attributes

```typescript
// lib/cookie-options.ts
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,                        // JS cannot read the cookie
  secure: process.env.NODE_ENV === "production",  // HTTPS only in production
  sameSite: "lax" as const,              // blocks cross-origin POST
  path: "/",                             // sent on every request to the domain
  maxAge: 7 * 24 * 60 * 60,             // 7 days, matches Session.expiresAt
};
```

In development (`NODE_ENV !== "production"`), `secure` is `false` so the cookie works over HTTP on localhost.

### bcrypt Rounds

Passwords are hashed with 12 salt rounds via `bcryptjs`:

```typescript
const passwordHash = await bcrypt.hash(password, 12);
```

12 rounds provides approximately 250ms verification time per attempt, slowing brute-force attacks while remaining acceptable for the login flow.

---

## 2. Authentication

### Password Hashing

- Hashing: `bcryptjs.hash(password, 12)` on registration.
- Verification: `bcryptjs.compare(password, passwordHash)` on login.
- The `passwordHash` field is never included in any DTO returned to the client. The Prisma query selects only non-sensitive fields.

### Email Enumeration Prevention

Login errors use deliberately vague messages to prevent email enumeration attacks:

```typescript
// auth.service.ts
const user = await prisma.user.findUnique({ where: { email } });
if (!user) throw new AppError("INVALID_CREDENTIALS", "Invalid credentials", 401);

const valid = await bcrypt.compare(password, user.passwordHash);
if (!valid) throw new AppError("INVALID_CREDENTIALS", "Invalid credentials", 401);
```

Both "email not found" and "password mismatch" return the same response: `401 { "error": "Invalid credentials" }`. An attacker cannot determine whether a specific email is registered.

### Registration Uniqueness

Duplicate emails are caught at registration and returned as a distinct error:

```typescript
// auth.service.ts
const existing = await prisma.user.findUnique({ where: { email } });
if (existing) throw new AppError("EMAIL_TAKEN", "Email is already registered.", 409);
```

This is safe because the endpoint is unauthenticated and the error is expected during normal UX (user picked an existing email).

### Session-Based Auth (No JWTs)

The system uses server-side sessions stored in PostgreSQL rather than JWTs. This means:

- **Immediate logout**: `DELETE FROM Session WHERE id = sessionId` instantly invalidates the session. No token blacklist needed.
- **No token replay risk**: If a session ID is leaked, it can be deleted server-side. JWTs remain valid until expiry.
- **No JWT signing key to rotate**.

### Session Cleanup

Expired sessions are cleaned up opportunistically via `cleanupExpiredSessions()` with a time-based throttle (at most once per hour). Expired sessions encountered during validation simply return `null` from `getCurrentUser()`.

---

## 3. Authorization (RBAC)

### Workspace Roles

Three roles defined in the `WorkspaceMember` table:

| Role | Create Task | Update Task | Delete Any Task | Delete Own Task | Change Any Status | Change Assigned Status | Manage Members |
|---|---|---|---|---|---|---|---|
| OWNER | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| MEMBER | Yes | Yes | No | Yes | No | Yes | No |
| VIEWER | No | No | No | No | No | No | No |

### Task-Level Exceptions

Permission functions in `lib/constants.ts` implement granular checks beyond the workspace role:

```typescript
function canDeleteTask(role: WorkspaceRole, creatorId: string, actorId: string): boolean {
  if (role === "OWNER") return true;
  if (role === "MEMBER") return creatorId === actorId;
  return false;
}

function canUpdateTaskStatus(role: WorkspaceRole, assigneeId: string | null, actorId: string): boolean {
  if (role === "OWNER") return true;
  if (role === "MEMBER" && assigneeId === actorId) return true;
  return false;
}
```

### Consistent NotFoundError

Both "resource does not exist" and "user has no access" throw the same `NotFoundError`. This prevents resource enumeration by returning indistinguishable error messages:

```typescript
// task.service.ts
const task = await prisma.task.findUnique({
  where: { id: taskId },
  include: { project: { include: { workspace: { include: { members: { where: { userId: actorId } } } } } } },
});
if (!task) throw new NotFoundError("Task");
const member = task.project.workspace.members[0];
if (!member) throw new NotFoundError("Task"); // same error for both cases
```

### Permission Checks in the Service Layer

All permission checks live in `services/` (business logic), not in middleware or route handlers. Every service function that requires authorization accepts `actorId` and performs checks as part of its core logic. This keeps route handlers thin and ensures authorization cannot be bypassed by calling a different route.

---

## 4. Data Isolation

### Join-Chain Filtering

Every query that accesses domain objects (tasks, projects, workspaces) includes a Prisma relation filter that chains from the target table to `WorkspaceMember`:

```
Task --> Project --> Workspace --> WorkspaceMember (where userId = actorId)
```

Implementation in task queries:

```typescript
const where = {
  project: {
    workspace: {
      members: {
        some: { userId: actorId },
      },
    },
  },
};
```

This generates an `EXISTS` subquery in SQL. If the user has no `WorkspaceMember` row for the owning workspace, the query returns zero rows.

### Defense in Depth

- **Known UUIDs**: Even if a client possesses a task's UUID (e.g., leaked via URL or logs), they cannot access data without membership in the owning workspace.
- **No cross-workspace assignment**: `validateAssigneeInWorkspace()` in `task.service.ts` rejects assignments where the assignee is not a member of the task's workspace.
- **Cascade deletes**: Prisma `onDelete: Cascade` ensures deleting a workspace removes all associated data (projects, tasks, activity logs, member records).

---

## 5. Input Validation

### Zod Schemas

Every Route Handler validates its input with a Zod schema before any database operation:

```typescript
// Route handler pattern
const body = await req.json();
const input = createTaskSchema.parse(body); // throws ZodError on invalid input
const task = await taskService.createTask(input, user.id);
```

### Shared Schemas

Zod schemas in `schemas/` are shared between client and server, ensuring validation consistency. The schemas define the contract for every endpoint.

### Error Response

Validation errors return a consistent envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed.",
    "details": [{ "path": ["title"], "message": "Required" }]
  }
}
```

---

## 6. Known Gaps (TODO)

These are acknowledged security gaps that would need to be addressed for a production deployment:

- **Rate limiting**: Not implemented. An attacker can brute-force login credentials without throttle. Would add a middleware (e.g., `express-rate-limit`-style or edge-based rate limiting) before production.
- **Account lockout**: No lockout after N failed login attempts. Combined with the lack of rate limiting, weak passwords are the only barrier to brute force.
- **MFA**: No multi-factor authentication. Would require a TOTP or WebAuthn integration in the login flow.
- **HTML sanitization**: Comments are stored and rendered as plain text. While React's JSX escaping prevents direct XSS, stored HTML in comment content is not sanitized server-side. Would add a sanitizer (e.g., DOMPurify on the client or a server-side strip) for defense in depth.
- **Audit log**: Authentication events (login, logout, failed login attempts) are not tracked. The `ActivityLog` table only records task status transitions. Would add an `AuthEvent` table or extend the existing log before production.
- **Session invalidation on password change**: Currently not implemented. If a user changes their password, existing sessions remain valid.
