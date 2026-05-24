# Remote Task Board

A lightweight task management platform for remote teams.

Built with Next.js, TypeScript, PostgreSQL, and Prisma.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Custom Session (bcrypt + httpOnly cookie, stored in DB) |
| UI | Tailwind CSS + shadcn/ui |
| Validation | zod |
| Testing | Playwright |
| CI | GitHub Actions |
| Deploy | Vercel + Supabase |

## Features

- ✅ **Authentication** — Register, login, logout (custom session-based auth with bcrypt hashing)
- ✅ **Workspace management** — Create and manage workspaces with members
- ✅ **Project management** — Group tasks within projects under a workspace
- ✅ **Task CRUD** — Full create, read, update, delete for tasks
- ✅ **Task status workflow** — State machine with defined transitions, including review/reopen and cancel/reopen paths
- ✅ **Search, filtering & pagination** — Filter by status/priority/assignee, search by title, paginated results
- ✅ **Role-based access control** — OWNER / MEMBER / VIEWER roles with per-operation permissions
- ✅ **Assignee permissions** — Task assignees have special privileges for status changes
- ✅ **Activity log** — Track status change history per task (in Prisma transaction)
- ✅ **Data isolation** — Workspace-scoped data: users can only access their own workspaces via join-chain validation
- ✅ **Comments** — Task comments for OWNER/MEMBER users, read-only for VIEWER users
- ✅ **Optional AI task creation** — DeepSeek-backed natural language task parsing when `DEEPSEEK_API_KEY` is configured
- 📋 **Invite links** — Email-based workspace invitations
- 📋 **Email notifications** — Task assignment and status change alerts
- 📋 **Drag-and-drop kanban board** — Visual task management
- 📋 **Full audit log** — Complete change history tracking

## Data Flow

| Scenario | Data Source |
|---|---|
| Page initial render (dashboard, workspace, project, task detail) | Server Component → Service (direct Prisma call) |
| Task list filter, pagination, search | URL search params → Client Component → React Query → `GET /api/tasks` |
| Mutations (create, update, delete, comments, AI parsing) | Client Component → Route Handler → Service |
| Auth check / current user | Server Component calls auth lib directly |

Stable page reads go through Server Components. The task list uses a client-side API read because its filters, search, and pagination are URL-driven interactive state. Writes and AI parsing go through Route Handlers with zod validation and permission checks.

## Architecture

```
Remote Task Board
├── app/                   # Next.js App Router pages & API
│   ├── (app)/             # Authenticated pages (shared layout with sidebar)
│   │   ├── dashboard/     # Main workspace dashboard
│   │   ├── workspaces/    # Workspace detail pages
│   │   ├── projects/      # Project detail pages
│   │   └── tasks/         # Task detail & list pages
│   ├── (auth)/            # Login, register (no sidebar layout)
│   └── api/               # Route Handlers (API reads, mutations, AI parsing)
│
├── components/            # UI components by domain
│   ├── ui/                # Base components (shadcn/ui)
│   ├── layout/            # AppShell, Sidebar, Header
│   ├── workspace/         # Workspace-related components
│   ├── project/           # Project-related components
│   └── task/              # Task-related components
│
├── lib/                   # Infrastructure (prisma, auth, env, logger, errors)
├── services/              # Business logic (direct Prisma calls)
├── schemas/               # zod input validation
├── types/                 # Shared type definitions
├── prisma/                # Schema & seed data
└── tests/                 # Playwright E2E tests
```

## Database Schema

Key entities: User, Session, Workspace, WorkspaceMember, Project, Task, ActivityLog.

- Permissions are determined through the WorkspaceMember join table — no denormalized ownerId on Workspace
- Task has `creatorId` and `assigneeId` — creator determines delete permission, assignee determines status change permission
- ActivityLog uses explicit `fromStatus` / `toStatus` fields for status change tracking
- Session table stores sessions server-side for proper logout enforcement

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker (for local PostgreSQL)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/remote-task-board.git
cd remote-task-board

# 2. Install dependencies
pnpm install

# 3. Start local PostgreSQL
docker run -d \
  --name rtb-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=remote_task_board \
  -p 5432:5432 \
  postgres:16

# 4. Copy environment variables
cp .env.example .env
# Optional: set DEEPSEEK_API_KEY to enable AI task creation

# 5. Generate Prisma client and run migrations
pnpm prisma:generate
pnpm prisma:migrate

# 6. Seed demo data
pnpm db:seed

# 7. Start the dev server
pnpm dev
```

### Demo Accounts (after seeding)

| Email | Password | Role |
|---|---|---|
| alice@test.com | password123 | OWNER |
| bob@test.com | password123 | MEMBER |

## Running Tests

```bash
pnpm test:e2e          # Headless E2E tests
pnpm test:e2e:ui       # Playwright UI mode
```

Playwright is configured to auto-start the Next.js app via `webServer` in the config.
In CI, the app is started explicitly before running tests.

Test coverage:

| Test | What it covers |
|---|---|
| core-flow | Register → login → create workspace/project/task → status change. Also validates empty title rejection |
| permission | MEMBER cannot delete others' tasks; VIEWER cannot create tasks |
| isolation | User A cannot see User B's workspace data |
| task-status | Valid status transitions; invalid transitions (e.g. DONE → TODO) are rejected |

## CI

GitHub Actions runs on every PR: `typecheck → build → seed DB → start app → Playwright E2E tests`

The CI workflow starts a PostgreSQL service container, runs migrations and seed, then starts the Next.js app in background before running tests.

## Deployment

- **App:** Vercel (auto-deploy from `main`)
- **Database:** Supabase PostgreSQL

## Known Limitations

- Activity log only tracks status changes, not full audit trail
- Permission model covers OWNER/MEMBER/VIEWER + assignee — suitable for small teams but not enterprise org hierarchies
- No real-time collaboration or WebSocket presence
- Comments support create/list only; no edit, delete, or threaded replies
- AI task creation is hidden unless `DEEPSEEK_API_KEY` is configured

## Future Improvements

- Invite links
- Email notifications
- Drag-and-drop kanban board
- Full audit log
- Comment edit/delete and mention notifications
- Web3 wallet login (bonus module)
