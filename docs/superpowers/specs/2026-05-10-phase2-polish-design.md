# Phase 2: Polish & Documentation

**Date:** 2026-05-10
**Status:** Design approved

## Overview

Complete the remaining polish items after the code review fixes (Phase 1). Five independent work packages: documentation, API security tests, frontend CRUD UI, session cleanup, and README update.

---

## Work Package 1: Documentation

### docs/api.md — API Reference

Reference for all Route Handlers. Per-endpoint:
- Method + Path
- Request body (with zod schema reference)
- Success response format
- Error codes (AppError codes + HTTP status)
- Permission requirements (which WorkspaceRole can call it)

Endpoints to document:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/workspaces` + `POST /api/workspaces`
- `GET/PATCH/DELETE /api/workspaces/[workspaceId]`
- `POST /api/workspaces/[workspaceId]/members`
- `DELETE /api/workspaces/[workspaceId]/members/[memberId]`
- `GET /api/projects` + `POST /api/projects`
- `GET/PATCH/DELETE /api/projects/[projectId]`
- `GET /api/tasks` + `POST /api/tasks`
- `GET/PATCH/DELETE /api/tasks/[taskId]`
- `PATCH /api/tasks/[taskId]/status`

### docs/architecture.md — Architecture Document

Sections:
- **Tech Stack** — framework, language, database, ORM, auth, UI, validation, testing
- **Directory Structure** — annotated src tree
- **Data Flow** — reads via Server Components, writes via Route Handlers
- **Auth Flow** — register creates session, login verifies credentials, httpOnly cookie, session expiry
- **Permission Model** — OWNER/MEMBER/VIEWER + assignee special rights
- **Task State Machine** — VALID_TRANSITIONS map, legal status flows
- **Data Isolation** — Task → Project → WorkspaceMember join-chain

### docs/troubleshooting.md — Troubleshooting Guide

Common issues:
- WSL2 port forwarding (`next dev -H 0.0.0.0`)
- Prisma migration conflicts (`prisma migrate reset`)
- Seed data reset (`pnpm db:seed`)
- Login failures (seed data lost, re-seed)
- CI debugging (check CI logs, re-run failed jobs)
- Port conflict (kill process on :3000)

---

## Work Package 2: API Security Tests

**File:** `tests/api-security.spec.ts`

Pattern: request API only, `browser.newContext()` for user isolation.

### Test cases:

**Authorization:**
1. Unauthenticated user gets 401 on all write endpoints
2. Non-member (user outside workspace) gets 404 on workspace-scoped resources
3. MEMBER cannot delete another user's task (already covered in permission.spec.ts — move here or keep)

**Input validation:**
4. Empty task title returns 400
5. Invalid task status returns 400
6. Invalid UUID format returns 400
7. Email with invalid format on register returns 400

**Data isolation:**
8. User A cannot access User B's workspace (404 or 403)
9. User A cannot modify User B's tasks

---

## Work Package 3: Frontend CRUD UI

### Components to create/modify:

**1. TaskEditDialog** (`components/task/TaskEditDialog.tsx`)
- Opens on "Edit" button in task detail page
- Dialog pre-filled with current task title/description/priority/assignee/dueDate
- Submit PATCH `/api/tasks/[taskId]`
- Reuses `TaskForm` component (refactor TaskForm to support edit mode)
- Closes + refreshes on success

**2. TaskDeleteButton** (`components/task/TaskDeleteButton.tsx`)
- Red "Delete" button in task detail page
- Confirmation dialog (`window.confirm` or simple Dialog)
- Calls DELETE `/api/tasks/[taskId]`
- Redirects to `/dashboard` on success
- Shows toast on success/error

**3. TaskForm edit mode** (`components/task/TaskForm.tsx`)
- Add optional `task` prop for pre-fill
- When task is provided, change to PATCH mode (use taskId in URL)
- Keep CREATE mode when no task prop

**4. Modify task detail page** (`app/(app)/tasks/[taskId]/page.tsx`)
- Add Edit + Delete buttons next to title or in action bar
- Conditionally show based on permissions (creator sees delete, assignee sees status change)

**5. MemberList** (`components/workspace/MemberList.tsx`)
- Display member list: name, email, role badge
- Remove button for OWNER role members (not allowed to remove last OWNER)
- Add member inline form (email input + role Select + Add button)
- Embed in workspace detail page

**6. ProjectEditDialog** (`components/project/ProjectEditDialog.tsx`)
- Edit button in project detail page
- Dialog with name + description fields
- Submit PATCH `/api/projects/[projectId]`

**7. Modify workspace detail page** (`app/(app)/workspaces/[workspaceId]/page.tsx`)
- Embed MemberList component
- Add ProjectEditDialog entry point

---

## Work Package 4: Session Cleanup

### Implementation

Add to `services/auth.service.ts`:

```typescript
let cleanupCounter = 0;

export async function cleanupExpiredSessions(): Promise<void> {
  cleanupCounter++;
  // ~1%概率执行，避免每次请求都扫表
  if (cleanupCounter % 100 !== 0) return;
  await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
```

Call `cleanupExpiredSessions()` in `getUserFromSession()` in `lib/auth.ts` (每次 session 查询时调用，频次由内部计数器控制)。

---

## Work Package 5: README Update

### Changes to `README.md`:

Feature list add status markers:
- ✅ Authentication — Register, login, logout
- ✅ Workspace management
- ✅ Project management
- ✅ Task CRUD
- ✅ Task status workflow
- ✅ Search, filtering & pagination
- ✅ Role-based access control
- ✅ Assignee permissions
- ✅ Activity log
- ✅ Data isolation
- 📋 Invite links
- 📋 Email notifications
- 📋 Drag-and-drop kanban board
- 📋 Full audit log

Also update same in `README.zh-CN.md`.

---

## Implementation Order

```
Doc 1 (api.md) → Doc 2 (architecture.md) → Doc 3 (troubleshooting.md)
    → Security Tests → Frontend CRUD → Session Cleanup → README
```

Docs first because they clarify the API contracts needed for tests and frontend. No dependencies between packages, so order is flexible.

## Verification

| Step | Expected |
|------|----------|
| `pnpm typecheck` | Zero errors |
| `pnpm build` | Success |
| New test file `tests/api-security.spec.ts` | All cases pass |
| Manual: task detail page | Edit/Delete buttons visible, dialogs work |
| Manual: workspace detail page | Member list visible, add/remove works |
| Manual: session expiry | Old sessions cleaned up after threshold |
