# Remote Task Board -- Context

## Project Vision

A full-stack task management platform for remote teams, built as a demonstration
of modern TypeScript full-stack engineering. Covers the complete stack: database
modeling, custom authentication, role-based access control, state machine
enforcement, interactive UI, and automated testing.

## Non-Goals / Scope Boundaries

- Activity log tracks status changes only -- not a full audit trail.
- No real-time collaboration or WebSocket presence.
- Comments support create/list only; no edit, delete, or threaded replies.
- Designed for small teams (5-50 members), not enterprise org hierarchies.

## Key Constraints

| Constraint | Detail |
|---|---|
| Database | PostgreSQL 16 required (no SQLite fallback) |
| Runtime | Node.js 20+, pnpm 9 |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Framework | Next.js 16 App Router (Server Components + Route Handlers) |
| Auth | Custom session auth in PostgreSQL (no Auth0/NextAuth) |
| UI Framework | Tailwind CSS v4 + shadcn/ui primitives |
| Validation | Zod v4 on every Route Handler |
| E2E Testing | Playwright with real PostgreSQL (no mocking) |
| Locale | English (code, docs, comments) |

## Domain Language

| Term | Definition |
|---|---|
| **Workspace** | Top-level tenant. Users must be members (via `WorkspaceMember`) to access anything inside. |
| **Project** | A grouping of tasks within a workspace. Owned by the workspace. |
| **Task** | The core unit of work. Has a title, description, status, priority, assignee, and creator. Lives inside a project. |
| **Status** | One of `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, `CANCELED`. Transition rules are enforced server-side as a state machine. |
| **Priority** | One of `NONE`, `LOW`, `MEDIUM`, `HIGH`, `URGENT`. |
| **WorkspaceMember** | Join table linking a user to a workspace with a role. Uses a composite unique key `(workspaceId, userId)`. |
| **OWNER** | Full permissions: create/edit/delete any resource, manage members, delete workspace. |
| **MEMBER** | Can create and edit tasks/projects. Can delete own tasks. Can change status on assigned tasks only. |
| **VIEWER** | Read-only access to workspace content. |
| **ActivityLog** | Records every task status transition (actor, from status, to status, timestamp). |
| **Session** | Server-side session record with 7-day expiry. Linked to `User` via `userId`. |

## Architecture Decisions

| Decision | Summary | ADR |
|---|---|---|
| Custom session auth | bcryptjs + httpOnly cookie + `Session` table. No JWT, no third-party auth. Logout is immediate (DELETE FROM Session). | [0001](docs/adr/0001-custom-session-auth.md) |
| Hybrid data fetching | Server Components for stable page reads; React Query + Route Handlers for interactive task list with filters/pagination. | [0002](docs/adr/0002-rsc-vs-react-query.md) |
| Join-chain data isolation | Multi-tenant isolation via Prisma relation filters (Task -> Project -> Workspace -> WorkspaceMember). No RLS, no middleware hooks. | [0003](docs/adr/0003-prisma-join-chain-isolation.md) |
| Task state machine | Strict transition map shared between service layer and client. Wrapped in Prisma `$transaction` for atomic status + activity log updates. | (embedded in [architecture.md](docs/architecture.md#6-task-state-machine)) |
| RBAC with task-level exceptions | OWNER bypasses all checks; MEMBER can delete own tasks and change status on assigned tasks only. | (embedded in [architecture.md](docs/architecture.md#5-permission-model)) |

## Testing Philosophy

- **E2E tests** (Playwright) run against a real PostgreSQL instance via GitHub
  Actions service container. No mocking of the database.
- **Unit tests** (Vitest) cover service layer logic, Zod schema validation, and
  permission/state-machine constants.
- Tests use the same `test` accounts (`alice@test.com` / `bob@test.com`)
  seeded by `prisma/seed.ts`.
- CI pipeline: Postgres service -> migrate -> typecheck -> build -> Playwright.

## Key Files

| File | What it covers |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Full architecture: data flow, auth flow, permission model, state machine, data isolation |
| [docs/design-decisions.md](docs/design-decisions.md) | Design system, component decisions, CSS variable strategy |
| [docs/api.md](docs/api.md) | API endpoint reference (request/response shapes) |
| [docs/adr/](docs/adr/) | Architecture Decision Records for major tradeoffs |
| [lib/constants.ts](lib/constants.ts) | Shared state machine transition map and permission helpers |
| [prisma/schema.prisma](prisma/schema.prisma) | Data model: 7 tables, 3 enums, relations |
| [tests/](tests/) | Playwright E2E test specs |
