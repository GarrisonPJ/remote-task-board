# ADR 0002: Server Components vs. React Query for Data Fetching

**Status:** Accepted

**Date:** 2025-05-15

## Context

The application needs to fetch data from PostgreSQL and render it in the
browser. Two distinct usage patterns emerged:

1. **Stable page reads** -- pages like dashboard, workspace detail, project
   detail, and task detail. These render a defined view with no interactive
   filtering, sorting, or pagination. Data is part of the page content.

2. **Task list with filters and pagination** -- a highly interactive view with
   URL-driven search params, status/priority filters, assignee filter, and
   paginated results. The data changes as the user manipulates filters.

Three approaches were considered:

1. **All Server Components** -- all data fetching happens server-side via
   `async` components. Even the task list would re-render on the server for
   every filter change via search params. This would work but means every
   filter change triggers a full page navigation (or relies on `next/navigation`
   shallow routing with server re-execution).

2. **All React Query** -- all data fetching happens client-side via React Query
   calls to Route Handlers. No Server Component data fetching. This is simple
   (one pattern everywhere) but means pages like dashboard make an extra
   network round-trip for data that could have been part of the initial HTML.

3. **Hybrid** -- Server Components for stable reads, React Query + Route
   Handlers for the interactive task list. Each pattern matches the use case.

## Decision

Use a hybrid approach:

### Server Components (stable page reads)

```typescript
// app/(app)/dashboard/page.tsx
export default async function DashboardPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const workspaces = await workspaceService.listMyWorkspaces(user.id);
  const recentTasks = await taskService.listRecentTasks(user.id);

  return <DashboardView workspaces={workspaces} recentTasks={recentTasks} />;
}
```

- Used for: dashboard, workspace detail, project detail, task detail.
- Data is fetched in the Server Component and rendered into the RSC payload.
- No extra network round-trips for initial page load.
- Authentication happens server-side with no client-visible auth state.

### React Query + Route Handlers (interactive task list)

```typescript
// Client component uses React Query
const { data } = useQuery({
  queryKey: ["tasks", searchParams],
  queryFn: () => fetch(`/api/tasks?${searchParams}`).then(res => res.json()),
});
```

- Used for: the task list view with URL-driven filters and pagination.
- Filter state lives in URL query parameters. Changing a filter updates the
  URL and triggers a React Query refetch via key change.
- Mutations (create, update, delete, status change) invalidate the query cache.

### Route Handlers for all writes

Every mutation goes through a Route Handler (`app/api/.../route.ts`), not a
Server Action. This ensures:

- Explicit cookie-to-session validation via `requireUser()`.
- Zod input validation at the handler boundary.
- Consistent JSON response envelope via `ok()` / `fail()` helpers.

## Consequences

### Positive

- **Clear separation of concerns.** Stable reads stay simple (Server Component
  -> Service -> Prisma). Interactive reads get the caching and refetching
  machinery they need.
- **No unnecessary network hops for page loads.** Dashboard data arrives as
  part of the initial HTML/stream, not after a client-side waterfall.
- **URL-driven task list state.** Filters are shareable, bookmarked, and
  survive page refresh. The URL is the source of truth for the current view.

### Negative

- **Two mental models for data fetching.** Developers need to understand both
  Server Components (async/await in the component tree) and React Query (query
  keys, cache invalidation, optimistic updates). This adds onboarding cost.
- **Duplicate auth checks.** Server Components check the session cookie
  directly; Route Handlers call `requireUser()`. Both paths achieve the same
  goal but through slightly different code paths.
- **Cache invalidation surface.** Mutations in one part of the tree must
  correctly invalidate React Query caches in other parts. Getting this wrong
  leads to stale data visible until page refresh.
