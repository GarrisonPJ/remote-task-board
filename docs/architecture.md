# Architecture

> Remote Task Board -- a full-stack task management platform built with Next.js 16 App Router.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router, server components, route handlers) |
| Language | TypeScript 5 (strict mode enabled) |
| Database | PostgreSQL 16 (via Supabase or standalone) |
| ORM | Prisma 7 with `@prisma/adapter-pg` (PrismaPg adapter) |
| Auth | Custom session auth: bcryptjs password hashing, httpOnly cookie, `Session` table in PostgreSQL |
| UI Framework | Tailwind CSS v4 + `tw-animate-css` |
| Component Libraries | shadcn/ui primitives + `@base-ui/react` v1.4 |
| Icons | lucide-react |
| Validation | zod v4 (server-side input validation) |
| E2E Testing | Playwright 1.59 |
| CI | GitHub Actions (PostgreSQL service container, typecheck, build, Playwright) |
| Package Manager | pnpm 9 |
| Runtime | Node.js 20 |

Key dependencies from `package.json`:

- `next@16.2.4`, `react@19.2.4`, `react-dom@19.2.4`
- `@prisma/client@^7.8.0`, `@prisma/adapter-pg@^7.8.0`
- `bcryptjs@^3.0.3`
- `zod@^4.4.2`
- `tailwindcss@^4`, `@tailwindcss/postcss@^4`
- `class-variance-authority`, `clsx`, `tailwind-merge` (utility chain for `cn()`)
- `sonner` (toast notifications)

---

## 2. Directory Structure

```
remote-task-board/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Authenticated routes (sidebar layout)
│   │   ├── layout.tsx            #   AppLayout -- sidebar + header, redirects to /login if unauthenticated
│   │   ├── loading.tsx           #   Root loading state (suspense boundary)
│   │   ├── error.tsx             #   Root error boundary (catches Server Component errors)
│   │   │   ├── dashboard/
│   │   │   ├── page.tsx          #   Server Component: workspace list + recent tasks (Suspense streaming)
│   │   │   ├── loading.tsx       #   Dashboard skeleton with animate-pulse placeholders
│   │   │   ├── error.tsx         #   Dashboard error boundary with retry button
│   │   │   └── not-found.tsx     #   Dashboard not-found page
│   │   ├── workspaces/
│   │   │   └── [workspaceId]/
│   │   │       └── page.tsx      #   Workspace detail: project grid + recent tasks
│   │   ├── projects/
│   │   │   └── [projectId]/
│   │   │       └── page.tsx      #   Project detail: task list + create task button
│   │   ├── tasks/
│   │   │   ├── page.tsx          #   Task list shell; client content uses URL params + React Query
│   │   │   └── [taskId]/
│   │   │       └── page.tsx      #   Task detail: status badge, meta info, activity timeline
│   │   └── page.tsx              #   Root redirect to /dashboard
│   ├── (auth)/                   # Unauthenticated routes (no sidebar)
│   │   ├── login/
│   │   │   └── page.tsx          #   Login form
│   │   └── register/
│   │       └── page.tsx          #   Registration form
│   ├── api/                      # Route Handlers (API reads, writes, AI parsing)
│   │   ├── auth/
│   │   │   ├── register/route.ts #   POST -- register user, create session, set cookie
│   │   │   ├── login/route.ts    #   POST -- verify bcrypt, create session, set cookie
│   │   │   ├── logout/route.ts   #   POST -- delete session, clear cookie
│   │   │   └── me/route.ts       #   GET  -- return current user from session
│   │   ├── workspaces/
│   │   │   ├── route.ts          #   GET (list), POST (create)
│   │   │   └── [workspaceId]/
│   │   │       ├── route.ts      #   GET, PATCH, DELETE
│   │   │       ├── members/
│   │   │       │   ├── route.ts          #   POST (add member)
│   │   │       │   └── [memberId]/
│   │   │       │       └── route.ts      #   DELETE (remove member)
│   │   │       └── ...
│   │   ├── projects/
│   │   │   ├── route.ts          #   GET (list), POST (create)
│   │   │   └── [projectId]/
│   │   │       └── route.ts      #   GET, PATCH, DELETE
│   │   ├── activity/
│   │   │   └── route.ts          #   GET (activity feed for OWNER role — last 50 entries)
│   │   └── tasks/
│   │       ├── route.ts          #   GET (list with filters+pagination+cursor), POST (create)
│   │       └── [taskId]/
│   │           ├── route.ts      #   GET, PATCH (update fields), DELETE
│   │           └── status/
│   │               └── route.ts  #   PATCH (status transition + activity log)
│   ├── globals.css               # Tailwind v4 CSS entry point
│   ├── layout.tsx                # Root layout (fonts, metadata)
│   └── page.tsx                  # Root page (redirect)
│
├── components/
│   ├── ui/                       # shadcn/ui primitives (button, card, dialog, input, badge, etc.)
│   ├── layout/
│   │   └── LogoutButton.tsx      # Client component: logout action
│   ├── workspace/
│   │   ├── WorkspaceCard.tsx     # Workspace summary card
│   │   └── CreateWorkspaceDialog.tsx
│   ├── project/
│   │   ├── ProjectCard.tsx       # Project summary card
│   │   └── CreateProjectDialog.tsx
│   └── task/
│       ├── TaskCard.tsx          # Individual task card
│       ├── TaskList.tsx          # Task list renderer (used by multiple pages)
│       ├── TaskForm.tsx          # Create/edit task form (shared)
│       ├── CreateTaskDialog.tsx  # Wraps TaskForm in a dialog
│       ├── TaskFilters.tsx       # Filter/search bar (client component, manipulates URL params)
│       ├── TaskStatusBadge.tsx   # Color-coded status badge
│       ├── TaskPriorityBadge.tsx # Color-coded priority badge
│       ├── TaskActivityFeed.tsx  # Activity log feed (OWNER-only, fetches from /api/activity)
│       └── TaskActivityTimeline.tsx # Per-task activity timeline (supports all action types)
│
├── lib/                          # Infrastructure layer
│   ├── prisma.ts                 # Singleton PrismaClient with PrismaPg adapter
│   ├── auth.ts                   # getUserFromSession(), requireUser() -- cookie reader helpers
│   ├── env.ts                    # Environment variable validation
│   ├── errors.ts                 # AppError, UnauthorizedError, ForbiddenError, NotFoundError
│   ├── constants.ts              # Shared VALID_TRANSITIONS, STATUS_LABELS, permission helpers, type re-exports
│   ├── cookie-options.ts         # Shared SESSION_COOKIE_OPTIONS used by register/login/logout routes
│   ├── api-response.ts           # ok() / fail() response builders
│   ├── authorization.ts          # Declarative policy map: authorize(action, context) + can(action, context)
│   ├── utils.ts                  # cn() utility (clsx + tailwind-merge)
│   └── hooks/
│       └── use-optimistic-task.ts # React 19 useOptimistic wrapper for instant UI updates (task status)
│
├── services/                     # Business logic layer (direct Prisma calls)
│   ├── auth.service.ts           # register(), login(), logout(), getCurrentUser()
│   ├── workspace.service.ts      # createWorkspace, listMyWorkspaces, getWorkspaceById, members, etc.
│   ├── project.service.ts        # CRUD + permission checks
│   ├── task.service.ts           # CRUD + status machine + data isolation + pipeline pattern (executeTaskMutation auto-logs every mutation)
│   ├── task-list.service.ts      # Paginated/filtered task list queries with dual-mode pagination (offset + cursor)
│   └── task-mapper.ts            # toTaskDTO() — shared Prisma→DTO mapping (used by task.service + task-list.service)
│
├── schemas/                      # Zod validation schemas
│   ├── auth.schema.ts            # RegisterInput, LoginInput
│   ├── workspace.schema.ts       # CreateWorkspaceInput, AddWorkspaceMemberInput
│   ├── project.schema.ts         # CreateProjectInput, UpdateProjectInput
│   └── task.schema.ts            # CreateTaskInput, UpdateTaskInput, UpdateTaskStatusInput, ListTasksQuery
│
├── types/                        # Shared TypeScript type definitions
│   ├── domain.ts                 # UserDTO, WorkspaceDTO, ProjectDTO, TaskDTO, ActivityLogDTO
│   └── api.ts                    # ApiResponse<T>, PaginatedResponse<T>, PaginationMeta
│
├── prisma/
│   ├── schema.prisma             # Data model: 7 tables, 3 enums, relations
│   ├── migrations/               # SQL migration files
│   └── seed.ts                   # Seed data (test users, workspaces, projects, tasks)
│
├── tests/                        # Playwright E2E tests
│   ├── core-flow.spec.ts         # Registration, login, workspace→project→task flow, status change
│   ├── task-status.spec.ts       # State machine transition validation
│   ├── isolation.spec.ts         # Cross-workspace data isolation tests
│   └── permission.spec.ts        # Role-based access control tests
│
├── .github/workflows/
│   └── ci.yml                    # CI pipeline: Postgres service → install → migrate → typecheck → build → test
│
├── playwright.config.ts          # Playwright configuration
├── prisma.config.ts              # Prisma CLI configuration (schema path, migration path, seed command)
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript strict config with @/ path alias
├── tailwind.config.ts            # Tailwind CSS v4 config
└── package.json                  # Dependencies and scripts
```

---

## 3. Data Flow

The application uses two distinct data-fetching patterns depending on whether the operation reads or writes data.

| Scenario | Path | Description |
|---|---|---|
| Stable page read (dashboard, workspace, project, task detail) | Server Component --> Suspense boundary --> inline async component --> Service --> Prisma --> PostgreSQL | Loading skeleton streams immediately via `<Suspense fallback={<Loading />}>`. Data is fetched server-side and rendered into the RSC payload. |
| Task list read (filters/search/pagination+cursor) | Client Component --> React Query --> `GET /api/tasks` --> Service --> Prisma --> PostgreSQL | URL search params drive the interactive task list state. Supports dual-mode pagination (offset via page/pageSize, cursor via cursor). |
| Write (create/update/delete/status/comment) | Client Component --> React Query (useMutation with optimistic updates) --> fetch() --> Route Handler --> Service (pipeline) --> Prisma/PostgreSQL | Writes use structured `{ success, data?, error? }` responses. Status changes use optimistic cache updates with automatic rollback on error. ActivityLog entries are created atomically by the service pipeline. |
| Auth check | Server Component --> `getUserFromSession()` --> `auth.service.getCurrentUser()` --> Prisma | Each protected page reads the session cookie and queries the `Session` table. |
| Filter / Search | URL search params --> task list client re-query | Filter state lives in the URL query string. Changing a filter updates the URL and the React Query key. |

### Server Component read flow (page render, detailed)

```
Browser                    Next.js Server
  |                            |
  |--- GET /dashboard          |
  |                            |
  |                    1. Read "session_id" cookie
  |                    2. await getUserFromSession()
  |                       -> prisma.session.findUnique({ id: sessionId })
  |                       -> check expiresAt
  |                       -> return user or null
  |                    3. await listTasks({ page: 1, pageSize: 5 }, user.id)
  |                       -> prisma.task.findMany({ where: { project: { workspace: { members: { some: { userId } } } } }, ... })
  |                       -> prisma.task.count({ where })
  |                    4. Render React tree (RSC payload)
  |                            |
  |<--- HTML (streamed) --------
```

### Write flow (create/update/delete, detailed with optimistic updates)

```
Browser                          Next.js Server
  |                                  |
  |-- user clicks status change     |
  |   (e.g. "IN_PROGRESS")          |
  |                                  |
  |  Client-side (optimistic):
  |  1. React Query onMutate fires
  |     -> cancel outgoing refetches
  |     -> snapshot current cache
  |     -> optimistically update cache
  |     -> UI shows new status instantly
  |                                  |
  |-- PATCH /api/tasks/:id/status   |
  |   { status: "IN_PROGRESS" }     |
  |   (session_id cookie auto-sent) |
  |                                  |
  |                          1. requireUser()
  |                             -> getUserFromSession()
  |                             -> throws UnauthorizedError if null
  |                          2. zod schema.parse(body) -- validate input
  |                          3. service.executeTaskMutation pipeline:
  |                             -> getTaskWithPermission (join-chain isolation)
  |                             -> authorize via declarative policy
  |                             -> execute via Prisma $transaction
  |                                (task.update + ActivityLog.create)
  |                          4. ok(task) -> NextResponse.json
  |                                  |
  |  Client-side (resolution):
  |  onSettled -> invalidateQueries(refetch in background)
  |  onError   -> rollback cache to snapshot + show error toast
  |                                  |
  |<-- { success: true, data: ... } -
```

The `ok()` and `fail()` helpers in `lib/api-response.ts` provide a consistent JSON envelope:

```typescript
// Success
{ "success": true, "data": { ... } }

// Known error (AppError)
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Task not found." } }

// Validation error (ZodError)
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Input validation failed.", "details": [...] } }

// Unexpected error
{ "success": false, "error": { "code": "INTERNAL_SERVER_ERROR", "message": "Unexpected server error." } }
```

---

## 4. Auth Flow

Authentication is handled entirely server-side using a custom session system built on bcryptjs and a `Session` table in PostgreSQL.

### Models

```
User {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  passwordHash String    (bcrypt hash, never returned to the client)
  ...
}

Session {
  id        String   @id   (crypto.randomUUID())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime  (7 days from creation)
  createdAt DateTime @default(now())
}
```

### Registration

1. Client sends `{ name, email, password }` to `POST /api/auth/register`.
2. Route Handler parses input with `registerSchema` (zod).
3. `auth.service.register()` checks email uniqueness -- throws `EMAIL_TAKEN` (409) if duplicate.
4. Password is hashed with `bcrypt.hash(password, 12)`.
5. `User` and `Session` records are created in one Prisma transaction. The session uses `crypto.randomUUID()` and a 7-day expiry.
6. Route Handler sets the `session_id` cookie on the response:
   ```
   Set-Cookie: session_id=<uuid>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
   ```
7. Browser is redirected to `/dashboard`. Registration implies automatic login.

### Login

1. Client sends `{ email, password }` to `POST /api/auth/login`.
2. `auth.service.login()` looks up the user by email, then calls `bcrypt.compare(password, passwordHash)`.
3. On mismatch, throws `INVALID_CREDENTIALS` (401). The error message is deliberately vague to avoid email enumeration.
4. On success, a new `Session` record is created (7-day expiry) and the `session_id` cookie is set identically to registration.

### Session Validation (every protected request)

1. `lib/auth.ts:getUserFromSession()` reads the `session_id` cookie via `next/headers`.
2. Calls `auth.service.getCurrentUser(sessionId)`.
3. `getCurrentUser` queries `prisma.session.findUnique({ where: { id: sessionId }, include: { user } })`.
4. If the session does not exist OR `session.expiresAt < new Date()`, returns `null`.
5. `requireUser()` wraps this and throws `UnauthorizedError` (401) if null, causing the Route Handler's `fail()` to return a 401 JSON response.
6. Page-level protection uses a guard pattern:
   ```typescript
   const user = await getUserFromSession();
   if (!user) redirect("/login");
   ```

### Logout

1. Client calls `POST /api/auth/logout`.
2. `auth.service.logout(sessionId)` calls `prisma.session.deleteMany({ where: { id: sessionId } })`.
3. Route Handler clears the cookie: `response.cookies.delete("session_id")`.

### Session Cleanup

Expired session rows are cleaned up opportunistically: `cleanupExpiredSessions()` runs at most once per hour (time-based throttle), deleting rows where `expiresAt < now()`. The auth service tolerates expired sessions gracefully — sessions past their expiry simply return `null` from `getCurrentUser`.

### Cookie Configuration

Defined in `lib/cookie-options.ts` and shared across register, login, and logout routes:

```typescript
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60, // 7 days
};
```

| Attribute | Value | Rationale |
|---|---|---|
| `httpOnly` | `true` | Prevents XSS-based session theft (JS cannot read the cookie) |
| `secure` | `true` in production | Requires HTTPS |
| `sameSite` | `lax` | CSRF protection — allows GET navigations from external sites but blocks cross-origin POST |
| `path` | `/` | Cookie is sent on every request to the domain |
| `maxAge` | 604800 (7 days) | Matches the `Session.expiresAt` database column |

---

## 5. Permission Model

Permissions operate in two layers: workspace-level roles and task-level ownership.

### Layer 1: Workspace Roles

Every user who belongs to a workspace has a role stored in the `WorkspaceMember` table.

| Role | Create Project | Update Project | Delete Project | Create Task | Update Task | Delete Any Task | Delete Own Task | Change Any Task Status | Change Assigned Status | Manage Members | Delete Workspace |
|---|---|---|---|---|---|---|---|---|---|---|---|
| OWNER | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| MEMBER | Yes | Yes | No | Yes | Yes | No | Yes | No | Yes | No | No |
| VIEWER | No | No | No | No | No | No | No | No | No | No | No |

Key permission functions in the codebase (from `lib/authorization.ts` and `lib/constants.ts`):

The new declarative authorization module (`lib/authorization.ts`) provides a single interface:

```typescript
import { authorize, can } from "@/lib/authorization";

// Throws ForbiddenError if not permitted
authorize("task:delete", { role: "MEMBER", isCreator: false });

// Returns boolean (no throw)
can("task:status", { role: "MEMBER", isAssignee: true }); // true
```

The policy map uses action identifiers mapped to role-based conditions:

| Action | Who can do it |
|--------|---------------|
| `task:create` | OWNER or MEMBER |
| `task:update` | OWNER or MEMBER |
| `task:delete` | OWNER, or MEMBER who is the creator |
| `task:status` | OWNER, or MEMBER who is the assignee |
| `comment:create` | OWNER or MEMBER |
| `workspace:manage` | OWNER only |
| `member:invite` | OWNER only |
| `member:remove` | OWNER only |
| `activity:view` | OWNER only |

Legacy inline helpers in `lib/constants.ts` remain for backward compatibility.

### Layer 2: Task-level Permissions

Within the workspace roles, additional granularity exists at the task level:

- **Creator privilege**: A MEMBER can delete a task only if they are its creator (`creatorId === actorId`).
- **Assignee privilege**: A MEMBER can change a task's status only if they are the current assignee (`assigneeId === actorId`). This allows delegated task workers to update progress without needing full edit permissions.
- **OWNER override**: OWNERs bypass both creator and assignee checks -- they can delete any task and change any status.

### Guard Implementation Pattern

All services follow a consistent two-step guard pattern:

1. **Identity check**: Verify the actor is a member of the relevant workspace. If not, throw `NotFoundError` (not `ForbiddenError`) to avoid leaking the existence of the resource.
2. **Permission check**: Check the role and any task-level conditions. Throw `ForbiddenError` if the action is not permitted.

---

## 6. Task State Machine

Tasks follow a strict state machine. Each transition must be explicitly allowed; illegal transitions are rejected with a 400 error that includes the list of valid targets.

```
                        ┌──────────────────┐
                        │      DONE        │
                        └──────────────────┘
                              ▲
                              │
                    ┌─────────┴──────────┐
                    │     IN_REVIEW      │
                    └─────────┬──────────┘
                    ▲         │         ▲
                    │         │         │
              ┌─────┴─────┐   │   ┌─────┴──────┐
              │ IN_PROGRESS│◄──┘   │  CANCELED  │
              └─────┬─────┘       └──────┬──────┘
                    │                    │
                    └─────┐    ┌─────────┘
                          │    │
                    ┌─────┴────┴────┐
                    │     TODO      │
                    └───────────────┘
```

### Valid Transitions Table

| Current Status | Allowed Targets |
|---|---|
| `TODO` | `IN_PROGRESS`, `CANCELED` |
| `IN_PROGRESS` | `IN_REVIEW`, `TODO`, `CANCELED` |
| `IN_REVIEW` | `DONE`, `IN_PROGRESS`, `CANCELED` |
| `DONE` | `IN_REVIEW` |
| `CANCELED` | `TODO` |

The transition map is implemented in `lib/constants.ts` and shared across the service layer and client components:

```typescript
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["IN_REVIEW", "CANCELED", "TODO"],
  IN_REVIEW: ["DONE", "IN_PROGRESS", "CANCELED"],
  DONE: ["IN_REVIEW"],
  CANCELED: ["TODO"],
};
```

### Transition Enforcement

When `updateTaskStatus()` is called, it:

1. Fetches the current task (with workspace membership check via `getTaskWithPermission`).
2. Looks up `VALID_TRANSITIONS[currentStatus]` and checks if the requested target is included.
3. If not, throws an `AppError` with code `INVALID_TRANSITION`, status 400, and a message listing valid targets.
4. If valid, checks that the actor has permission to change status (OWNER, or MEMBER who is the assignee).
5. If permitted, executes a Prisma `$transaction` containing two operations:
   - `prisma.task.update({ where: { id: taskId }, data: { status: newStatus } })`
   - `prisma.activityLog.create({ data: { taskId, actorId, fromStatus: oldStatus, toStatus: newStatus } })`

The transaction guarantees atomicity: either both the status update and the activity log entry succeed, or both roll back.

### Design Notes

- `DONE` can move back to `IN_REVIEW`, allowing completed work to be reopened for review without creating a duplicate task.
- `CANCELED` can return to `TODO`, allowing canceled tasks to be revived.
- A task is always created with `status = TODO`.

---

## 7. Data Isolation

Data isolation ensures that a user can only access tasks, projects, and workspaces to which they have been explicitly added. This is enforced at the Prisma query level through join-chains that terminate at the `WorkspaceMember` table.

### The Join Chain

```
Task --> Project --> Workspace --> WorkspaceMember (where userId = actorId)
```

Every query that returns domain objects (tasks, projects, workspaces) includes a filter or condition along this chain. If the actor's `WorkspaceMember` record does not exist for the workspace, the query returns no results (or throws `NotFoundError`).

### Implementation Pattern

**For task queries** (`task.service.ts`), the pattern is a Prisma `where` clause with nested relation filters:

```typescript
// Every task query includes this base filter:
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

This generates SQL equivalent to:

```sql
SELECT * FROM "Task"
WHERE EXISTS (
  SELECT 1 FROM "Project"
  JOIN "Workspace" ON "Workspace"."id" = "Project"."workspaceId"
  JOIN "WorkspaceMember" ON "WorkspaceMember"."workspaceId" = "Workspace"."id"
  WHERE "Project"."id" = "Task"."projectId"
    AND "WorkspaceMember"."userId" = $1
);
```

**For single-resource lookups** (e.g., `getTaskById`), the pattern uses Prisma `include` with a filtered nested condition:

```typescript
const task = await prisma.task.findUnique({
  where: { id: taskId },
  include: {
    project: {
      include: {
        workspace: {
          include: {
            members: {
              where: { userId: actorId },   // filter: only this user's membership
              select: { role: true },
            },
          },
        },
      },
    },
  },
});

if (!task) throw new NotFoundError("Task");
const member = task.project.workspace.members[0];
if (!member) throw new NotFoundError("Task");   // same error for "not found" and "no access"
```

**For project queries** (`project.service.ts`), the pattern is a two-step lookup:

```typescript
// Step 1: Fetch the resource
const project = await prisma.project.findUnique({ where: { id: projectId } });
if (!project) throw new NotFoundError("Project");

// Step 2: Verify membership via the composite unique key
const member = await prisma.workspaceMember.findUnique({
  where: {
    workspaceId_userId: { workspaceId: project.workspaceId, userId: actorId },
  },
});
if (!member) throw new NotFoundError("Workspace");
```

**For workspace queries** (`workspace.service.ts`), the pattern starts from the `WorkspaceMember` table itself:

```typescript
// List: "my workspaces" = memberships where I am the user
const memberships = await prisma.workspaceMember.findMany({
  where: { userId: actorId },
  include: { workspace: ... },
});

// Single: verify membership first, then return workspace data
const member = await prisma.workspaceMember.findUnique({
  where: { workspaceId_userId: { workspaceId, userId: actorId } },
  include: { workspace: ... },
});
if (!member) throw new NotFoundError("Workspace");
```

### Security Properties

- **No information leakage**: `NotFoundError` is thrown for both "resource does not exist" and "user has no access." An attacker cannot distinguish between the two cases.
- **Defense in depth**: Even if a client knows a task UUID, they cannot access it without being a member of the owning workspace.
- **No orphaned cross-workspace references**: The `validateAssigneeInWorkspace` function in `task.service.ts` prevents assigning a task to a user who is not a member of the task's workspace.
- **Cascading deletes**: Prisma's `onDelete: Cascade` on foreign keys ensures that deleting a workspace removes all associated projects, tasks, activity logs, and member records. Deleting a project cascades to its tasks and their activity logs.
