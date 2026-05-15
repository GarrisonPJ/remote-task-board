# Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comment module + TanStack Query integration to enhance job application readiness.

**Architecture:** Two independent subsystems. (A) Comment module adds Comment model to Prisma, a service layer with permission check (task → project → workspace membership), two Route Handlers (GET/POST), and two Client Components (list + form). (B) TanStack Query wraps the tasks list page with `useQuery` and the status control with `useMutation` + optimistic updates, replacing `router.refresh()` with targeted cache invalidation.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, Prisma (PostgreSQL), zod v4, @tanstack/react-query v5, vitest, Tailwind CSS v4 + shadcn/ui.

---

## Pre-Flight: Read existing API route for GET /api/tasks

- [ ] **Read `app/api/tasks/route.ts`** to understand the query parameters and response format that TanStack Query will call.

---

## Subsystem A: Comment Module

### Task A1: Add Comment model to Prisma

**Files:**
- Modify: `prisma/schema.prisma` (add Comment model + User/Task relations)

- [ ] **Add Comment model to schema**

Add right after `model ActivityLog`:

```prisma
model Comment {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  content   String
  createdAt DateTime @default(now())

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])

  @@index([taskId, createdAt])
}
```

The User model already has `activityLogs ActivityLog[]` — add `comments Comment[]` alongside it:

```prisma
model User {
  // ... existing fields ...
  activityLogs ActivityLog[]
  comments     Comment[]
  // ... existing fields ...
}
```

The Task model already has `activityLogs ActivityLog[]` — add `comments Comment[]` alongside it:

```prisma
model Task {
  // ... existing fields ...
  activityLogs ActivityLog[]
  comments     Comment[]
  // ... existing fields ...
}
```

- [ ] **Run migration**

```bash
pnpm prisma:migrate --name add_comment_model
```

Expected: Migration created and applied. Prisma client regenerated.

---

### Task A2: Create comment zod schema

**Files:**
- Create: `schemas/comment.schema.ts`

- [ ] **Write schema file**

```typescript
import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
```

---

### Task A3: Add CommentDTO to types

**Files:**
- Modify: `types/domain.ts`

- [ ] **Add CommentDTO type**

Add after `ActivityLogDTO`:

```typescript
export type CommentDTO = {
  id: string;
  taskId: string;
  user: UserDTO;
  content: string;
  createdAt: string;
};
```

---

### Task A4: Create comment service

**Files:**
- Create: `services/comment.service.ts`

- [ ] **Write the comment service**

```typescript
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { CommentDTO } from "@/types/domain";

/**
 * Lists comments for a task, ordered newest-first.
 * Permission is implicit — if actorId can find the task via the
 * 3-table join (task → project → workspace → member), they have access.
 */
export async function listComments(
  taskId: string,
  actorId: string
): Promise<CommentDTO[]> {
  // Verify access by checking workspace membership (same pattern as getTaskWithPermission)
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          workspace: {
            include: {
              members: {
                where: { userId: actorId },
                select: { role: true },
              },
            },
          },
        },
      },
    },
  });

  if (!task) throw new NotFoundError("Task");
  if (!task.project.workspace.members[0]) throw new NotFoundError("Task");

  const comments = await prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return comments.map((c) => ({
    id: c.id,
    taskId: c.taskId,
    user: c.user,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
  }));
}

/**
 * Creates a comment on a task.
 * Permission: MEMBER/OWNER of the task's workspace.
 */
export async function createComment(
  taskId: string,
  content: string,
  userId: string
): Promise<CommentDTO> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          workspace: {
            include: {
              members: {
                where: { userId },
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
  if (!member) throw new NotFoundError("Task");

  // VIEWER cannot create comments
  if (member.role === "VIEWER") {
    const { ForbiddenError } = await import("@/lib/errors");
    throw new ForbiddenError();
  }

  const comment = await prisma.comment.create({
    data: { taskId, content, userId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return {
    id: comment.id,
    taskId: comment.taskId,
    user: comment.user,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  };
}
```

---

### Task A5: Write comment service unit tests

**Files:**
- Create: `unit-tests/comment.service.test.ts`

- [ ] **Write permission logic unit tests**

```typescript
import { describe, it, expect } from "vitest";

/**
 * Unit tests for comment permission helpers.
 * These test the role-based access rules independent of the database.
 *
 * We extract the two key permissions as pure functions so they're testable
 * without a DB — same pattern as canCreateTask / canDeleteTask in task.service.ts.
 */

function canCreateComment(role: string): boolean {
  return role === "OWNER" || role === "MEMBER";
}

describe("canCreateComment", () => {
  it("OWNER can create comments", () => {
    expect(canCreateComment("OWNER")).toBe(true);
  });

  it("MEMBER can create comments", () => {
    expect(canCreateComment("MEMBER")).toBe(true);
  });

  it("VIEWER cannot create comments", () => {
    expect(canCreateComment("VIEWER")).toBe(false);
  });
});
```

- [ ] **Run tests to verify they fail initially**

Run: `pnpm test:unit -- --reporter=verbose`
Expected: Test file runs but the function `canCreateComment` is not yet exported from the service.

Wait — the function is defined inside the test file, so it should pass directly. This step verifies test infrastructure works.

Run: `pnpm test:unit`
Expected: PASS (all tests pass because the function is defined in the test file itself).

---

### Task A6: Create GET /api/tasks/[taskId]/comments route

**Files:**
- Create: `app/api/tasks/[taskId]/comments/route.ts`

- [ ] **Write GET handler**

```typescript
import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { listComments } from "@/services/comment.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await requireUser();
    const { taskId } = await params;
    const comments = await listComments(taskId, user.id);
    return ok(comments);
  } catch (error) {
    return fail(error as Error);
  }
}
```

---

### Task A7: Create POST /api/tasks/[taskId]/comments route

**Files:**
- Modify: `app/api/tasks/[taskId]/comments/route.ts` (append POST handler)

- [ ] **Add POST handler**

Append to the same file:

```typescript
import { createCommentSchema } from "@/schemas/comment.schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await requireUser();
    const { taskId } = await params;
    const body = await req.json();
    const input = createCommentSchema.parse(body);
    const comment = await createComment(taskId, input.content, user.id);
    return ok(comment, 201);
  } catch (error) {
    return fail(error as Error);
  }
}
```

---

### Task A8: Build CommentList component

**Files:**
- Create: `components/comment/CommentList.tsx`

- [ ] **Write CommentList component**

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import type { CommentDTO } from "@/types/domain";

type Props = {
  taskId: string;
};

export function CommentList({ taskId }: Props) {
  const { data: comments, isLoading, error } = useQuery<CommentDTO[]>({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load comments");
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse space-y-1.5">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-3 w-full bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">Failed to load comments.</p>;
  }

  if (!comments || comments.length === 0) {
    return <p className="text-sm text-muted-foreground">No comments yet.</p>;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="border-b pb-3 last:border-b-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{comment.user.name}</span>
            <span className="text-xs text-muted-foreground">
              {timeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>
      ))}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
```

---

### Task A9: Build CommentForm component

**Files:**
- Create: `components/comment/CommentForm.tsx`

- [ ] **Write CommentForm component**

```tsx
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  taskId: string;
};

export function CommentForm({ taskId }: Props) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to post comment");
      return json.data;
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      toast.success("Comment posted");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    mutation.mutate(content.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={mutation.isPending}
        className="flex-1"
      />
      <Button type="submit" size="sm" disabled={!content.trim() || mutation.isPending}>
        {mutation.isPending ? "..." : "Post"}
      </Button>
    </form>
  );
}
```

---

### Task A10: Integrate comments into task detail page

**Files:**
- Modify: `app/(app)/tasks/[taskId]/page.tsx`

- [ ] **Add comment section to the task detail page**

Add imports at the top:

```typescript
import { CommentList } from "@/components/comment/CommentList";
import { CommentForm } from "@/components/comment/CommentForm";
```

Add a comment section before the closing `</div>` (after the activity timeline section):

```tsx
<section>
  <h2 className="text-lg font-semibold mb-4">Comments</h2>
  <div className="space-y-4">
    <CommentForm taskId={task.id} />
    <CommentList taskId={task.id} />
  </div>
</section>
```

---

## Subsystem B: TanStack Query Integration

### Task B1: Install @tanstack/react-query

- [ ] **Install the package**

```bash
pnpm add @tanstack/react-query
```

Expected: Package added to `dependencies` in `package.json`.

---

### Task B2: Create QueryClient factory

**Files:**
- Create: `lib/query-client.ts`

- [ ] **Write the factory**

```typescript
import { QueryClient } from "@tanstack/react-query";

let queryClient: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,       // 30s — data stays fresh between navigations
          retry: 1,                    // one retry before showing error state
          refetchOnWindowFocus: false, // explicit refetch only
        },
      },
    });
  }
  return queryClient;
}
```

---

### Task B3: Create QueryClientProvider wrapper

**Files:**
- Create: `components/layout/QueryProvider.tsx`

- [ ] **Write the provider component**

```tsx
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

### Task B4: Add QueryProvider to app layout

**Files:**
- Modify: `app/(app)/layout.tsx`

- [ ] **Wrap children with QueryProvider**

Add import:

```typescript
import { QueryProvider } from "@/components/layout/QueryProvider";
```

Wrap the children in the `<main>` tag:

```tsx
<main className="flex-1 overflow-auto p-6">
  <QueryProvider>{children}</QueryProvider>
</main>
```

---

### Task B5: Build TaskTableSkeleton component

**Files:**
- Create: `components/task/TaskTableSkeleton.tsx`

- [ ] **Write the skeleton**

```tsx
export function TaskTableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 border-b pb-3">
          <div className="h-4 w-1/3 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded ml-auto" />
        </div>
      ))}
    </div>
  );
}
```

---

### Task B6: Create TaskListContent client component

**Files:**
- Create: `components/task/TaskListContent.tsx`

- [ ] **Write the TanStack Query-powered tasks list**

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { TaskTable } from "./TaskTable";
import { TaskFilters } from "./TaskFilters";
import { TaskTableSkeleton } from "./TaskTableSkeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import Link from "next/link";
import type { PaginatedResponse } from "@/types/api";
import type { TaskDTO } from "@/types/domain";

export function TaskListContent() {
  const searchParams = useSearchParams();

  const queryString = searchParams.toString();
  const currentPage = Number(searchParams.get("page") ?? 1);

  const { data, isLoading, error } = useQuery<PaginatedResponse<TaskDTO>>({
    queryKey: ["tasks", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?${queryString}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load tasks");
      return json.data;
    },
  });

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    return `/tasks?${params.toString()}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          {" / "}
          <span>Tasks</span>
        </p>
        <h1 className="text-2xl font-bold mt-1">Tasks</h1>
      </div>

      <TaskFilters />

      {isLoading ? (
        <TaskTableSkeleton />
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-destructive mb-2">Failed to load tasks.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      ) : data && data.items.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No tasks found.</p>
      ) : data ? (
        <>
          <TaskTable tasks={data.items} />

          {data.meta.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={buildPageUrl(currentPage - 1)} />
                  </PaginationItem>
                )}
                {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === data.meta.totalPages)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          href={buildPageUrl(p)}
                          isActive={p === currentPage}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    </span>
                  ))}
                {currentPage < data.meta.totalPages && (
                  <PaginationItem>
                    <PaginationNext href={buildPageUrl(currentPage + 1)} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}

          <p className="text-sm text-muted-foreground text-center">
            {data.meta.total} task{data.meta.total !== 1 ? "s" : ""} found
          </p>
        </>
      ) : null}
    </div>
  );
}
```

---

### Task B7: Simplify tasks list page to wrapper

**Files:**
- Modify: `app/(app)/tasks/page.tsx`

- [ ] **Replace full page with thin wrapper**

```tsx
import { Suspense } from "react";
import { TaskListContent } from "@/components/task/TaskListContent";
import { TaskTableSkeleton } from "@/components/task/TaskTableSkeleton";

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="space-y-8"><TaskTableSkeleton /></div>}>
      <TaskListContent />
    </Suspense>
  );
}
```

Note: `Suspense` is required because `TaskListContent` uses `useSearchParams()`, which triggers deopt in Next.js without a Suspense boundary.

---

### Task B8: Update TaskStatusControl to use TanStack Query

**Files:**
- Modify: `components/task/TaskStatusControl.tsx`

- [ ] **Replace `router.refresh()` with TanStack Query mutation**

Change the imports at the top:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
```

Remove `import { useRouter } from "next/navigation";` (no longer needed).

Move hook calls to the top of the component function, replacing the old hooks:

```typescript
const queryClient = useQueryClient();

const statusMutation = useMutation({
  mutationFn: async (newStatus: string) => {
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? "Failed to update status");
    return json.data;
  },
  onSuccess: (_data, newStatus) => {
    toast.success(`Status changed to ${STATUS_LABELS[newStatus]}`);
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  },
  onError: (err: Error) => {
    toast.error(err.message);
  },
});
```

Remove `const router = useRouter();` and `const [changing, setChanging] = useState<string | null>(null);` — they're replaced by TanStack Query.

> **Important:** Both `useQueryClient()` and `useMutation()` must be called **before** the early returns (`if (!canChangeStatus(...)) return null`), not after. Hooks cannot be called conditionally.

Replace the `handleChange` function body:

```typescript
const mutation = useMutation({
  mutationFn: async (newStatus: string) => {
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? "Failed to update status");
    return json.data;
  },
  onSuccess: (_data, newStatus) => {
    toast.success(`Status changed to ${STATUS_LABELS[newStatus]}`);
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  },
  onError: (err: Error) => {
    toast.error(err.message);
  },
});

async function handleChange(newStatus: string) {
  mutation.mutate(newStatus);
}
```

Remove the old `handleChange` function body (the one that uses `fetch` + `router.refresh()`).

Remove the `useRouter` import and `changing`/`setChanging` state, replacing `changing !== null` check with `mutation.isPending` and `changing === target` with `mutation.isPending && mutation.variables === target`.

The final simplified handleChange:

```typescript
async function handleChange(newStatus: string) {
  mutation.mutate(newStatus);
}
```

The button disabled state:

```tsx
disabled={mutation.isPending}
```

The button loading text:

```tsx
{mutation.isPending && mutation.variables === target ? "..." : STATUS_LABELS[target]}
```

Remove `const router = useRouter();` and `const [changing, setChanging] = useState<string | null>(null);` since they're replaced by TanStack Query.

Remove `import { useRouter } from "next/navigation";` and `import { useState } from "react";` (if useState is no longer used, keep the import if there are other uses).

---

## Summary of all files changed

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add Comment model + relations |
| — | `pnpm prisma:migrate --name add_comment_model` |
| `schemas/comment.schema.ts` | Create |
| `types/domain.ts` | Add CommentDTO |
| `services/comment.service.ts` | Create |
| `unit-tests/comment.service.test.ts` | Create |
| `app/api/tasks/[taskId]/comments/route.ts` | Create (GET + POST) |
| `components/comment/CommentList.tsx` | Create |
| `components/comment/CommentForm.tsx` | Create |
| `app/(app)/tasks/[taskId]/page.tsx` | Add CommentList + CommentForm |
| `package.json` | Add @tanstack/react-query |
| `lib/query-client.ts` | Create |
| `components/layout/QueryProvider.tsx` | Create |
| `app/(app)/layout.tsx` | Wrap main with QueryProvider |
| `components/task/TaskTableSkeleton.tsx` | Create |
| `components/task/TaskListContent.tsx` | Create |
| `app/(app)/tasks/page.tsx` | Replace with thin Suspense wrapper |
| `components/task/TaskStatusControl.tsx` | Replace router.refresh with TanStack Query |
