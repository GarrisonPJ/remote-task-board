# Project Enhancement Plan

**Date:** 2026-05-15
**Goal:** Enhance remote-task-board for junior fullstack remote job applications

## Phases

1. **Phase 1** — Local dev improvement: Comment module + TanStack Query (tasks list + comments)
2. **Phase 2** — Mobile responsive layout
3. **Phase 3** — Docker packaging + Vercel/Supabase deployment

---

## Phase 1: Local Dev Enhancement

### 1.1 Comment Module

#### Data Model

Add `Comment` model to Prisma:

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

- Text-only content, no edit/delete
- Cascade delete with Task

#### API Routes

- `GET /api/tasks/[taskId]/comments` — list comments by taskId, ordered by createdAt desc
- `POST /api/tasks/[taskId]/comments` — create comment (auth required, MEMBER role of the task's workspace)

#### Frontend

New components under `components/comment/`:

- `CommentList.tsx` — display comment list (author name, content, relative time)
- `CommentForm.tsx` — text input + submit button

Integrated into task detail page (`app/(app)/tasks/[taskId]/page.tsx`), below activity timeline.

#### Permission

- MEMBER/OWNER can create comments (same as task creation permission)
- VIEWER can read comments but not create
- No edit/delete (scope: MVP)

---

### 1.2 TanStack Query Integration

#### Setup

- Install `@tanstack/react-query` (v5)
- Add `QueryClientProvider` in `app/(app)/layout.tsx` (only authenticated pages need it)
- `lib/query-client.ts` — factory with sensible defaults (staleTime: 30s, retry: 1)

#### Tasks List Page Conversion

Current: Server Component fetches tasks directly via service → renders TaskTable.

Change: Convert `app/(app)/tasks/page.tsx` to a Client Component. It uses TanStack Query's `useQuery` to call the existing `GET /api/tasks` endpoint (filter/pagination params via URL search params → API query string).

Add:
- Loading skeleton (`components/task/TaskTableSkeleton.tsx`)
- Error state (retry button)
- Optimistic updates for status transitions via `useMutation`

Parts staying as Server Components:
- Task detail page (read-only view, no mutation)
- Dashboard, workspace, project pages — unchanged

#### Comment Module Uses TanStack Query

- `useQuery` to fetch comments on task detail page
- `useMutation` to post new comment, `invalidateQueries` on success for auto-refresh
- Provides a clear example of cache invalidation pattern (visible in code and interview discussion)

---

## Phase 2: Mobile Responsive (Direction Only)

- Tailwind breakpoints (`sm`/`md`/`lg`)
- Mobile sidebar: hamburger toggle instead of persistent left nav
- Task table → card layout on small screens
- Dialog forms full-screen on mobile

---

## Phase 3: Docker + Deployment (Direction Only)

- `docker-compose.yml` with PostgreSQL + Next.js
- Vercel deployment with Supabase PostgreSQL
- Live demo link + badges in README

---

## Files Changed (Phase 1)

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add Comment model + migration |
| `package.json` | Add @tanstack/react-query |
| `app/(app)/layout.tsx` | Add QueryClientProvider |
| `lib/query-client.ts` | New — TanStack Query client factory |
| `app/api/tasks/[taskId]/comments/route.ts` | New — GET + POST |
| `components/comment/CommentList.tsx` | New |
| `components/comment/CommentForm.tsx` | New |
| `components/task/TaskTableSkeleton.tsx` | New |
| `app/(app)/tasks/page.tsx` | Convert to Client Component + TanStack Query |
| `schemas/comment.schema.ts` | New — zod validation for comment input |

## Not in Scope (Phase 1)

- Edit/delete comments
- Rich text or markdown comments
- Real-time updates
- Email notifications for comments
- Refactoring existing Server Components on dashboard/workspace/project pages
