# Project Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the complete project skeleton — Next.js init, directories, Prisma schema, lib infrastructure, types, zod schemas, configs. No Services, Route Handlers, pages, components, or tests.

**Architecture:** Standard Next.js App Router project with TypeScript strict mode. Data layer uses Prisma + PostgreSQL. Auth is custom session-based (bcrypt + httpOnly cookie). UI uses Tailwind CSS + shadcn/ui.

**Tech Stack:** Next.js 16, TypeScript strict, Prisma, bcryptjs, zod, Tailwind CSS, shadcn/ui

---

### Task 1: Initialize Next.js Project

**Files:** All scaffolded by `create-next-app`

- [ ] **Step 1: Create Next.js app with TypeScript**

```bash
cd /home/garry/Project/TSasS
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-pnpm --no-turbopack
```

Expected: Next.js project scaffolded in current directory with TypeScript, Tailwind, ESLint, App Router.

- [ ] **Step 2: Verify project starts**

```bash
pnpm dev
# Check it starts, then Ctrl+C
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with TypeScript and Tailwind"
```

---

### Task 2: Install Dependencies

- [ ] **Step 1: Install production dependencies**

```bash
cd /home/garry/Project/TSasS
pnpm add @prisma/client bcryptjs zod
```

- [ ] **Step 2: Install dev dependencies**

```bash
pnpm add -D prisma @types/bcryptjs tsx
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

Expected: shadcn/ui initialized with default settings, components.json created.

- [ ] **Step 4: Add shadcn/ui components needed for skeleton**

```bash
npx shadcn@latest add button input select dialog badge card table pagination toast sonner dropdown-menu avatar separator sheet
```

- [ ] **Step 5: Commit**

```bash
git add pnpm-lock.yaml package.json components.json
git commit -m "feat: install dependencies and initialize shadcn/ui"
```

---

### Task 3: Create Directory Structure

- [ ] **Step 1: Create all directories**

```bash
cd /home/garry/Project/TSasS
mkdir -p \
  app/'(auth)'/login \
  app/'(auth)'/register \
  app/dashboard \
  app/workspaces/'[workspaceId]' \
  app/projects/'[projectId]' \
  app/tasks/'[taskId]' \
  app/api/auth/register \
  app/api/auth/login \
  app/api/auth/logout \
  app/api/auth/me \
  app/api/workspaces/'[workspaceId]'/members/'[memberId]' \
  app/api/projects/'[projectId]' \
  app/api/tasks/'[taskId]'/status \
  components/ui \
  components/layout \
  components/workspace \
  components/project \
  components/task \
  lib \
  services \
  schemas \
  types \
  prisma \
  tests
```

- [ ] **Step 2: Add .gitkeep files to empty directories to preserve them**

```bash
find app -type d -empty -exec touch {}/.gitkeep \;
```

Wait — don't do `.gitkeep`. Instead, we'll add placeholder `page.tsx` files later. For now, the directories just need to exist.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: create directory structure"
```

---

### Task 4: Create Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Write the complete Prisma schema**

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String            @id @default(cuid())
  name         String
  email        String            @unique
  passwordHash String
  memberships  WorkspaceMember[]
  assignedTasks Task[]           @relation("TaskAssignee")
  createdTasks  Task[]           @relation("TaskCreator")
  activityLogs ActivityLog[]
  sessions     Session[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Session {
  id        String   @id
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime

  createdAt DateTime @default(now())

  @@index([userId])
}

model Workspace {
  id        String            @id @default(cuid())
  name      String
  members   WorkspaceMember[]
  projects  Project[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model WorkspaceMember {
  id          String        @id @default(cuid())
  workspaceId String
  userId      String
  role        WorkspaceRole @default(MEMBER)

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([workspaceId, userId])
}

model Project {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  description String?

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  tasks     Task[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Task {
  id          String       @id @default(cuid())
  projectId   String
  title       String
  description String?
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  assigneeId  String?
  creatorId   String
  dueDate     DateTime?

  project  Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee User?   @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  creator  User    @relation("TaskCreator", fields: [creatorId], references: [id])

  activityLogs ActivityLog[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([creatorId])
  @@index([projectId, status, assigneeId])
}

model ActivityLog {
  id         String     @id @default(cuid())
  taskId     String
  actorId    String
  fromStatus TaskStatus?
  toStatus   TaskStatus

  task  Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  actor User @relation(fields: [actorId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([taskId, createdAt])
}

enum WorkspaceRole {
  OWNER
  MEMBER
  VIEWER
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
  CANCELED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

- [ ] **Step 2: Generate Prisma client**

```bash
pnpm prisma generate
```

Expected: Prisma client generated without errors.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Prisma schema with all models and enums"
```

---

### Task 5: Create Environment Config

**Files:**
- Create: `.env.example`
- Create: `lib/env.ts`

- [ ] **Step 1: Write `.env.example`**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/remote_task_board
AUTH_SECRET=replace-me-with-a-random-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 2: Write `lib/env.ts`**

```ts
const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  AUTH_SECRET: process.env.AUTH_SECRET ?? "dev-secret-change-me",
  NODE_ENV: (process.env.NODE_ENV ?? "development") as
    | "development"
    | "production"
    | "test",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

function validateEnv(): void {
  const errors: string[] = [];

  if (!env.DATABASE_URL) {
    errors.push("DATABASE_URL is required");
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
  }
}

export { env, validateEnv };
```

- [ ] **Step 3: Commit**

```bash
git add .env.example lib/env.ts
git commit -m "feat: add environment config and .env.example"
```

---

### Task 6: Create Lib Infrastructure

**Files:**
- Create: `lib/prisma.ts`
- Create: `lib/errors.ts`
- Create: `lib/api-response.ts`
- Create: `lib/auth.ts` (stub)
- Create: `lib/logger.ts`

- [ ] **Step 1: Write `lib/prisma.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 2: Write `lib/errors.ts`**

```ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super("UNAUTHORIZED", "You must be logged in.", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super("FORBIDDEN", "You do not have permission to perform this action.", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super("NOT_FOUND", `${resource} not found.`, 404);
  }
}
```

- [ ] **Step 3: Write `lib/api-response.ts`**

```ts
import { NextResponse } from "next/server";
import { AppError } from "./errors";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(error: Error) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  console.error("Unhandled error:", error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected server error.",
      },
    },
    { status: 500 }
  );
}
```

- [ ] **Step 4: Write `lib/logger.ts`**

```ts
type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  process.env.NODE_ENV === "production" ? "info" : "debug";

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;

  const timestamp = new Date().toISOString();
  const entry = { timestamp, level, message, ...meta };

  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};
```

- [ ] **Step 5: Write `lib/auth.ts` (stub — user writes full implementation)**

```ts
import { prisma } from "./prisma";
import { UnauthorizedError } from "./errors";

// Stub — user implements full Session logic per design doc.
// Real implementation: read session_id cookie, lookup Session in DB,
// verify not expired, return user. Wrap in requireUser() that throws UnauthorizedError.

export async function getUserFromSession(): Promise<{
  id: string;
  name: string;
  email: string;
} | null> {
  // TODO: Implement session-based auth (user's task)
  return null;
}

export async function requireUser() {
  const user = await getUserFromSession();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/prisma.ts lib/errors.ts lib/api-response.ts lib/logger.ts lib/auth.ts
git commit -m "feat: add lib infrastructure (prisma, errors, api-response, logger, auth stub)"
```

---

### Task 7: Create Type Definitions

**Files:**
- Create: `types/api.ts`
- Create: `types/domain.ts`

- [ ] **Step 1: Write `types/api.ts`**

```ts
export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginationMeta;
};
```

- [ ] **Step 2: Write `types/domain.ts`**

```ts
export type WorkspaceRole = "OWNER" | "MEMBER" | "VIEWER";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "CANCELED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type UserDTO = {
  id: string;
  name: string;
  email: string;
};

export type WorkspaceDTO = {
  id: string;
  name: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
};

export type ProjectDTO = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskDTO = {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  creatorId: string;
  assignee?: UserDTO | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ActivityLogDTO = {
  id: string;
  taskId: string;
  actor: UserDTO;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  createdAt: string;
};
```

- [ ] **Step 3: Commit**

```bash
git add types/api.ts types/domain.ts
git commit -m "feat: add type definitions (API response types and domain DTOs)"
```

---

### Task 8: Create Zod Schemas

**Files:**
- Create: `schemas/auth.schema.ts`
- Create: `schemas/workspace.schema.ts`
- Create: `schemas/project.schema.ts`
- Create: `schemas/task.schema.ts`

- [ ] **Step 1: Write `schemas/auth.schema.ts`**

```ts
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 2: Write `schemas/workspace.schema.ts`**

```ts
import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(80),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(80),
});

export const addWorkspaceMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["MEMBER", "VIEWER"]).default("MEMBER"),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>;
```

- [ ] **Step 3: Write `schemas/project.schema.ts`**

```ts
import { z } from "zod";

export const createProjectSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
```

- [ ] **Step 4: Write `schemas/task.schema.ts`**

```ts
import { z } from "zod";

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELED"]),
});

export const listTasksQuerySchema = z.object({
  projectId: z.string().optional(),
  workspaceId: z.string().optional(),
  status: z
    .enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELED"])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
```

- [ ] **Step 5: Commit**

```bash
git add schemas/
git commit -m "feat: add zod validation schemas for auth, workspace, project, task"
```

---

### Task 9: Configure package.json Scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add scripts to package.json**

Add these scripts to the existing `package.json` scripts section:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

Where scripts don't exist yet (`db:seed`, `test:e2e`, `test:e2e:ui`), add them. Where they overlap, keep the existing ones.

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "feat: add project scripts (prisma, seed, test, typecheck)"
```

---

### Task 10: Create Seed Data Stub

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Write seed stub**

```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // TODO: User implements full seed per design doc (Section 38):
  // - alice@test.com / password123 — OWNER
  // - bob@test.com / password123 — MEMBER
  // - "Alice's Workspace" with members
  // - "MVP Features" project with 4 tasks

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: add seed data stub"
```

---

### Task 11: Add Placeholder Page Files

**Files:**
- Create: `app/layout.tsx` (modify existing)
- Create: `app/page.tsx` (modify existing)
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `app/dashboard/page.tsx`
- Create: `app/globals.css` (ensure Tailwind is set up)
- Remove: all `.gitkeep` files if any

- [ ] **Step 1: Update root layout with shadcn/ui provider**

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Remote Task Board",
  description: "A lightweight task management platform for remote teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Write placeholder pages (each indicates what the user should implement)**

```tsx
// app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

```tsx
// app/(auth)/login/page.tsx
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">
        Login page — implement auth UI here
      </p>
    </div>
  );
}
```

```tsx
// app/(auth)/register/page.tsx
export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">
        Register page — implement auth UI here
      </p>
    </div>
  );
}
```

```tsx
// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        Implement dashboard with workspace list, recent tasks, and activity.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/
git commit -m "feat: add root layout with shadcn Toaster and placeholder pages"
```

---

### Task 12: Verify TypeScript Compilation

- [ ] **Step 1: Run typecheck**

```bash
pnpm typecheck
```

Expected: Zero type errors. If errors appear, fix them before proceeding.

- [ ] **Step 2: Run build**

```bash
pnpm build
```

Expected: Successful production build.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A && git commit -m "chore: fix type errors and finalize skeleton"
```

---

## Summary

After completing all tasks, the project skeleton will be ready:

**Done (implemented):**
- Next.js project initialized with TypeScript strict, Tailwind CSS
- Prisma schema with all models (User, Session, Workspace, WorkspaceMember, Project, Task, ActivityLog)
- All `lib/` infrastructure: prisma client, errors, api-response, logger, auth stub, env
- All `types/`: ApiResponse, domain DTOs
- All `schemas/`: zod validation for auth, workspace, project, task
- shadcn/ui installed with needed components
- Placeholder pages at all routes
- `.env.example`, `prisma/seed.ts` stub
- All project scripts in `package.json`
- TypeScript compiles clean, project builds

**Remaining (user implements):**
- `lib/auth.ts` — full session-based auth (bcrypt, cookie, middleware)
- `services/` — AuthService, WorkspaceService, ProjectService, TaskService
- `app/api/` — all Route Handlers
- `app/` pages — all UI pages (login, register, dashboard, workspace, project, task detail)
- `components/` — all UI components (layout, workspace, project, task)
- `prisma/seed.ts` — full seed data
- `tests/` — Playwright E2E tests
- `.github/workflows/ci.yml` — GitHub Actions CI
- `docs/` — api.md, troubleshooting.md, architecture.md
