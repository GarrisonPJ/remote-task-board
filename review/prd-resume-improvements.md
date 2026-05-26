# PRD: Remote Task Board — Resume-Grade Improvements

## Problem Statement

Remote Task Board is a functional real-time collaborative task management application, but its current implementation has several shallow modules that expose implementation complexity to callers, lack error resilience, and miss opportunities to demonstrate production-grade engineering practices. From a job-seeking perspective, the project needs deeper modules, observable reliability patterns, and quantifiable performance improvements to stand out against competing candidates.

## Solution

Deepen the codebase architecture by:
1. Consolidating the scattered Task mutation pattern into a deep module with a single interface
2. Extracting a Sync Event module that encapsulates WebSocket connection lifecycle, reconnection, and error handling
3. Building an authorization module at a proper seam between "who can do what" and "the doing"
4. Adding resilience infrastructure (Error Boundaries, optimistic updates, loading states) as first-class modules
5. Making all improvements measurable through Web Vitals, test coverage reports, and structured logging

## User Stories

### Real-time Reliability

1. As a **Member**, I want the Board to automatically reconnect when my WebSocket connection drops, so that I don't miss Sync Events while on unstable networks
2. As a **Member**, I want to see a visual indicator when my connection to the Board is lost, so that I know my view might be stale
3. As a **Member**, I want Tasks I create while offline to be queued and submitted when my connection recovers, so that I don't lose work
4. As a **Member**, I want the Board to recover gracefully from a Soketi server restart, so that I don't need to manually refresh
5. As a **Member**, I want to see a "syncing" indicator after making a change, so that I know whether other Members will see my update

### Optimistic Updates

6. As a **Member**, I want Status transitions via drag-and-drop to feel instant, so that the Board feels responsive regardless of server latency
7. As a **Member**, I want to see my newly created Task appear on the Board immediately, even before the server confirms, so that the interaction feels snappy
8. As a **Member**, I want failed optimistic updates to roll back with a clear error message, so that I understand what happened

### Error Handling & Loading

9. As a **Member**, I want to see a loading skeleton when the Board is initially loading, so that I know the application is working
10. As a **Member**, I want to see a meaningful error page if the Board fails to load, so that I can take corrective action (retry, report)
11. As a **Member**, I want error messages from failed Task operations to appear as toast notifications, so that I know what went wrong without losing my current context
12. As a **Member**, I want the application to recover from a component crash without losing the entire page, so that partial failures don't destroy my workflow

### Access Control & Permissions

13. As an **Admin**, I want only the Task creator or an Admin to be able to delete a Task, so that Members can't accidentally delete each other's work
14. As an **Admin**, I want a Viewer Role that can see the Board but not modify Tasks, so that stakeholders can observe progress without risk
15. As a **Member**, I want the UI to hide action buttons I don't have permission for, so that the interface matches my actual capabilities
16. As an **Admin**, I want to see an activity log of who created, updated, and deleted Tasks, so that I can audit team actions

### Performance & Observability

17. As a **Member**, I want the Board to load within 1.5 seconds on a 3G connection, so that the application is usable on slow networks
18. As a **Member**, I want the Board to handle 200+ Tasks without noticeable lag, so that it scales with team growth
19. As a **developer**, I want structured error logs with context (user, action, Task ID), so that I can diagnose production issues
20. As a **developer**, I want Web Vitals (LCP, FID, CLS) reported and visible, so that I can track and improve performance over time
21. As a **developer**, I want test coverage reports generated in CI, so that I can maintain and communicate code quality

### Developer Experience

22. As a **developer**, I want a single Task mutation interface that handles auth, validation, persistence, and broadcasting, so that new mutations require zero boilerplate
23. As a **developer**, I want a Sync Event module I can test with an in-memory adapter, so that real-time features are testable without a running Soketi instance
24. As a **developer**, I want authorization rules defined declaratively in one place, so that adding new permissions doesn't require changes across multiple files
25. As a **developer**, I want structured Server Action responses (`{ success, data?, error? }`), so that client-side error handling is consistent and predictable

## Implementation Decisions

### 1. Task Mutation Module — Deepen via Pipeline Pattern

The current Task mutation module (task-service.ts) is shallow: four exported functions each independently calling auth(), validating, calling Prisma, then triggering Pusher. The interface is as complex as the implementation.

**Decision**: Consolidate into a pipeline — a single `executeMutation` module that accepts an operation descriptor and handles auth → validate → persist → broadcast internally. Individual mutations (`createTask`, `updateTask`, etc.) become thin wrappers that define _what_ to do, while the pipeline handles _how_.

This deepens the module: callers learn one interface, and auth/validate/broadcast logic has **locality** — bugs and changes concentrate in one place.

### 2. Sync Event Module — Extract and Encapsulate

Real-time sync is currently scattered across three files with no abstraction: `pusher.ts` (server trigger), `pusher-client.ts` (client config), and raw `useEffect` in `task-board.tsx` (subscription lifecycle).

**Decision**: Extract a `useSyncChannel` hook that encapsulates:
- Connection/disconnection lifecycle
- Automatic reconnection with exponential backoff
- Connection state tracking (connected / connecting / disconnected)
- Type-safe event binding

Server-side: wrap `pusher.trigger` in a `broadcastSyncEvent` function that standardizes event shapes.

This creates a real seam with two adapters: Pusher/Soketi in production, and an in-memory event bus in tests.

### 3. Authorization Module — Declarative Policy

Current approach: `currentUser?.role !== 'ADMIN'` checks inlined in each Server Action.

**Decision**: Extract an authorization module with a declarative policy map:
```typescript
// Decision-encoding snippet from design exploration
type PolicyMap = {
  'task:create': { roles: ['ADMIN', 'MEMBER'] };
  'task:delete': { roles: ['ADMIN'], or: 'isCreator' };
  'member:invite': { roles: ['ADMIN'] };
  'member:remove': { roles: ['ADMIN'] };
};
```

The interface is one function: `authorize(action, context)`. The implementation absorbs all role checks, ownership checks, and future Viewer role logic.

### 4. Error Resilience Layer

**Decision**: Three modules:
- `error.tsx` and `loading.tsx` at the dashboard route level (Next.js conventions)
- A `useOptimisticTask` hook wrapping React 19's `useOptimistic` for Status transitions
- Structured Server Action responses: `{ success: boolean, data?: T, error?: { code: string, message: string } }`

### 5. Schema Evolution

**Decision**: Add to Prisma schema:
- `creatorId` field on Task (for ownership-based permissions)
- `VIEWER` value added to Role enum
- `ActivityLog` model for audit trail (Task ID, action type, actor, timestamp)

### 6. Performance Module

**Decision**: 
- Add `<Suspense>` boundaries with skeleton UI at the dashboard level
- Implement virtual scrolling for task columns when count > 50 (using `@tanstack/react-virtual`)
- Add `next/web-vitals` reporting
- Configure pagination on `getTasks` with cursor-based pagination

## Testing Decisions

### What makes a good test

Tests verify behavior through the module's **interface**, not implementation details. A test should break only when the behavior changes, never when internals are refactored.

### Modules to test

| Module | Test Type | Priority |
|--------|-----------|----------|
| Task mutation pipeline | Unit (Vitest) | High — test the consolidated interface, mock Prisma + Pusher |
| Authorization policy | Unit (Vitest) | High — pure function, no mocks needed |
| `useSyncChannel` hook | Unit (Vitest + React Testing Library) | Medium — test with in-memory adapter |
| Optimistic update behavior | Unit (Vitest + RTL) | Medium — test rollback on failure |
| Error Boundary | Integration (Playwright) | Medium — test error recovery flow |
| Full task lifecycle | E2E (Playwright) | High — create → assign → move → delete |
| WebSocket reconnection | E2E (Playwright) | Medium — simulate connection drop |

### Prior art

Existing tests in `unit-tests/task-service.test.ts` mock Prisma and Pusher at the module level. This pattern should be preserved and extended. Playwright tests in `tests/dashboard.spec.ts` use login-first flow that can be reused.

### Coverage target

Generate coverage reports via `vitest --coverage` and add a badge to README. Target: >80% line coverage for service and authorization modules.

## Out of Scope

- **Multi-board / multi-project support**: Significant schema and UI changes that exceed the improvement scope
- **Real-time cursor presence**: Would require additional WebSocket channels and complex state management
- **File attachments on Tasks**: Requires blob storage infrastructure
- **Email notifications**: Requires email service integration
- **Mobile native app**: The responsive web UI is sufficient for resume purposes
- **Full CRDT conflict resolution**: Last-write-wins is acceptable; CRDT is overengineering for this scale
- **GraphQL migration**: REST-equivalent Server Actions are the deliberate choice (see ADR-0001)

## Further Notes

- All improvements should be reflected in updated README.md with architecture diagram, performance badges, and coverage badges
- CONTEXT.md should be updated as new domain terms emerge (e.g., "Activity Log", "Viewer")
- ADRs should be written for: Server Actions over REST (existing decision to document), Soketi over Pusher Cloud (existing decision to document), Last-write-wins over CRDT (new decision)
- The PRD is designed so that each user story cluster maps to an independent vertical slice for issue tracking
