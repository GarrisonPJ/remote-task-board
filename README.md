# Remote Task Board

A full-stack task management platform for remote teams — built as a demonstration of modern TypeScript full-stack engineering.

[![CI](https://github.com/GarrisonPJ/remote-task-board/actions/workflows/ci.yml/badge.svg)](https://github.com/GarrisonPJ/remote-task-board/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-80%25-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)]()

> **Live Demo:** [remote-task-board.vercel.app](https://remote-task-board.vercel.app) (deploy your own — see [Getting Started](#getting-started))
>
> **Demo Accounts:** `alice@test.com` / `bob@test.com` — password: `password123`

### At a Glance

- **50 tests** (26 E2E + 24 unit) across Playwright and Vitest — full CI run with real PostgreSQL
- **CI pipeline:** typecheck → build → unit test + coverage → E2E (Postgres service container)
- **Security:** httpOnly + SameSite=Lax cookies, bcrypt (12 rounds), Zod validation on every endpoint
- **Architecture:** State machine with transaction atomicity, join-chain data isolation, hybrid RSC + React Query
- **Data integrity:** Prisma `$transaction` for status changes + activity log, cascade deletes, composite unique keys

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Server Components for stable page reads; Route Handlers for mutations with auth. No SPA-only tradeoffs. |
| Language | **TypeScript 5** (strict) | Full strict mode. No `any`, no `as` casts in business logic. |
| Database | **PostgreSQL 16** | Real relational DB. Enforced referential integrity, cascade deletes, composite unique constraints for permission joins. |
| ORM | **Prisma 7** | Type-safe queries with PrismaPg adapter. Join-chain filtering for data isolation (see Architecture). |
| Auth | **Custom session** (bcryptjs + httpOnly cookie) | Session table in PostgreSQL. `SameSite=Lax`, `HttpOnly`, secure in production. No JWT, no Auth0 dependency — you own the auth layer. |
| UI | **Tailwind CSS v4** + **shadcn/ui** + **@base-ui/react** | Design tokens via CSS variables. Full dark mode. Teal productivity palette. `prefers-reduced-motion` respected. |
| State (client) | **TanStack React Query v5** | Task list with URL-driven filters/pagination. Cache invalidation on mutations. |
| Validation | **Zod v4** | Server-side input validation in every Route Handler. Shared schemas with TypeScript type inference. |
| E2E | **Playwright** | 26 E2E + 24 unit = 50 total tests across 6 spec files + 3 unit test files. API-level and browser-level coverage for core flow, permissions, data isolation, state machine, comments, and API security. |
| CI | **GitHub Actions** | Postgres service container → migrate → seed → typecheck → build → unit test + coverage → Playwright E2E. Every push and PR. |
| AI | **OpenAI SDK / DeepSeek** | Optional natural-language task creation. Hidden unless `DEEPSEEK_API_KEY` is configured. No hard dependency. |

---

## Architecture Highlights

These are the design decisions that made the project worth building deliberately — not just another CRUD app.

### 1. State Machine with Transaction Atomicity

Task status transitions follow a strict state machine. Invalid transitions are rejected server-side.

```
TODO → IN_PROGRESS → IN_REVIEW → DONE
  ↑         ↑            ↑
  └─────────┴────────────┴── CANCELED → TODO (revive path)
```

Every status change is wrapped in a Prisma `$transaction` — the task updates and the activity log entry commit or roll back together. No orphaned history.

The transition map lives in `lib/constants.ts` and is shared between the service layer and the client component, so UI buttons always reflect valid targets:

```
TODO     → [IN_PROGRESS, CANCELED]
DONE     → [IN_REVIEW]
CANCELED → [TODO]
```

### 2. Data Isolation via Join Chains

Users can only access data in workspaces they belong to. This is enforced at the Prisma query level, not in application middleware:

```
Task → Project → Workspace → WorkspaceMember (where userId = actorId)
```

Every task query includes a filtered relation chain. If the user has no `WorkspaceMember` row for the owning workspace, the query returns empty — no data leaks, no "access denied" hints that reveal resource existence.

### 3. Role-Based Access Control (RBAC) with Task-Level Exceptions

| Role | Create | Edit | Delete | Status Change |
|---|---|---|---|---|
| OWNER | Yes | Yes | Yes (any) | Yes (any) |
| MEMBER | Yes | Yes | Own tasks only | Only assigned tasks |
| VIEWER | No | No | No | No |

MEMBERs can change status **only on tasks they are assigned to**. OWNERs bypass this check. The permission functions in `lib/constants.ts` are used by both the service layer and client UI for consistent guard rendering.

### 4. Custom Session Auth (No Auth0, No NextAuth)

- Passwords hashed with bcrypt (12 rounds).
- Session table in PostgreSQL — logout is immediate (DELETE FROM Session).
- Cookie: `HttpOnly`, `SameSite=Lax`, `Secure` in production, 7-day expiry.
- Expired sessions cleaned up hourly via time-based throttle.
- No JWTs, no third-party auth services. Full ownership of the auth layer.

### 5. Two Data-Fetching Patterns

| Scenario | Pattern | Rationale |
|---|---|---|
| Page renders (dashboard, workspace, project, task detail) | Server Component → Service → Prisma | No extra network hops. Data is part of the RSC payload. |
| Task list (filters, search, pagination) | Client Component → React Query → `GET /api/tasks` | URL-driven interactive state. Filters live in query params. Mutations invalidate the query cache. |

---

## Testing Strategy

| File | Tests | What it covers |
|---|---|---|
| `core-flow.spec.ts` | 6 | Register → login → logout → create workspace/project/task → status change. Also validates empty title rejection and post-logout dashboard protection. |
| `task-status.spec.ts` | 3 | Every valid transition; invalid transitions (e.g. DONE → TODO) return 400; cancel → reopen. |
| `permission.spec.ts` | 5 | MEMBER cannot delete others' tasks; VIEWER cannot create tasks; OWNER bypasses delete restriction. Input edge cases (invalid page, large page). |
| `isolation.spec.ts` | 3 | User A cannot see User B's workspace data, even with a known UUID. Unauthenticated redirect and 401. |
| `api-security.spec.ts` | 6 | Unauthenticated 401 on protected endpoints. Non-member 404 on workspace-scoped resources. Input validation for empty title, invalid status, bad email. |
| `comment-flow.spec.ts` | 3 | Comment create + list end-to-end. Empty content rejection. Unauthenticated 401. |

All tests run against a real PostgreSQL instance via Playwright's `webServer` config and a CI Postgres service container. Unit test coverage is collected via Vitest with v8 provider.

```bash
pnpm test:e2e        # Playwright E2E
pnpm test:unit       # Vitest unit tests
pnpm test:coverage   # Vitest with coverage report
```

---

## Project Structure

```
remote-task-board/
├── app/
│   ├── (app)/              # Authenticated pages (sidebar layout)
│   │   ├── dashboard/
│   │   ├── workspaces/[id]/
│   │   ├── projects/[id]/
│   │   └── tasks/
│   ├── (auth)/             # Login, register (no sidebar)
│   └── api/                # Route Handlers with auth + validation
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # AppShell, Sidebar, Header
│   ├── workspace/          # WorkspaceCard, MemberList, CreateDialog
│   ├── project/            # ProjectCard, CreateDialog
│   ├── task/               # TaskList, TaskForm, TaskFilters, TaskStatusControl, etc.
│   └── comment/            # CommentList, CommentForm
├── lib/                    # Infrastructure: prisma, auth, env, constants, errors, cookie-options
├── services/               # Business logic: auth, workspace, project, task, comment
├── schemas/                # Zod input validation schemas
├── types/                  # Domain types (DTOs) + API response types
├── prisma/                 # Schema, migrations, seed
└── tests/                  # Playwright E2E specs
```

---

## Getting Started

### Prerequisites

- Node.js 20+, pnpm 9
- Docker (for local PostgreSQL)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL with Docker Compose
docker compose up -d

# 3. Copy environment variables
cp .env.example .env
# Optional: set DEEPSEEK_API_KEY to enable AI task creation

# 4. Generate Prisma client, run migrations, seed demo data
pnpm prisma:generate
pnpm prisma:migrate
pnpm db:seed

# 5. Start dev server
pnpm dev
```

Or without Docker Compose:

```bash
docker run -d \
  --name rtb-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=remote_task_board \
  -p 5432:5432 \
  postgres:16
```

### Demo Accounts

| Email | Password | Role |
|---|---|---|
| alice@test.com | password123 | OWNER |
| bob@test.com | password123 | MEMBER |

---

## Design Decisions

Key architectural choices and their rationale are documented in:

- [`CONTEXT.md`](CONTEXT.md) — Project vision, domain language, constraints, and architecture decision index
- [`docs/architecture.md`](docs/architecture.md) — Data flow diagrams, auth flow, permission model, state machine, data isolation pattern
- [`docs/design-decisions.md`](docs/design-decisions.md) — Design system (Teal palette, typography), component enhancement backlog, CSS variable strategy
- [`docs/api.md`](docs/api.md) — API endpoint reference
- [`docs/security.md`](docs/security.md) — Security model: session protection, CSRF/XSS defenses, data isolation, known gaps
- [`docs/production-migration-policy.md`](docs/production-migration-policy.md) — Database migration and seed data strategy across environments
- [`docs/adr/`](docs/adr/) — Architecture Decision Records:
  - [ADR 0001 — Custom Session Auth](docs/adr/0001-custom-session-auth.md)
  - [ADR 0002 — RSC vs React Query Data Fetching](docs/adr/0002-rsc-vs-react-query.md)
  - [ADR 0003 — Prisma Join-Chain Data Isolation](docs/adr/0003-prisma-join-chain-isolation.md)
  - [ADR 0004 — Route Handlers over Server Actions](docs/adr/0004-route-handlers-over-server-actions.md)
  - [ADR 0005 — No Real-Time WebSocket Sync](docs/adr/0005-no-real-time-websocket.md)
  - [ADR 0006 — Last-Write-Wins over CRDT](docs/adr/0006-last-write-wins-over-crdt.md)

---

## What This Project Demonstrates

- **Full-stack TypeScript:** Server Components, Route Handlers, shared types between frontend and backend
- **Database modeling:** 7 tables, 3 enums, composite unique keys, cascade deletes, relation filtering
- **Authentication & security:** Custom session auth, bcrypt, CSRF protection via SameSite cookies, input validation on every endpoint
- **Testing discipline:** 26 E2E tests (6 spec files) + 24 unit tests covering happy paths, edge cases, permission boundaries, and isolation guarantees
- **CI/CD:** Automated typecheck → build → test pipeline with real PostgreSQL
- **Clean architecture:** Service layer separated from route handlers, shared constants, mapper functions to decouple Prisma from DTOs

---

## Scope Boundaries

- Activity log tracks status changes only — not a full audit trail
- No real-time collaboration or WebSocket presence
- Comments support create/list only; no edit, delete, or threaded replies
- Designed for small teams (5-50 members), not enterprise org hierarchies

These are explicit scope decisions, not shortcomings. Each would be a meaningful addition in a production context.
