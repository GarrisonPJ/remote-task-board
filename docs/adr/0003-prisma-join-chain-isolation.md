# ADR 0003: Prisma Join-Chain Data Isolation

**Status:** Accepted

**Date:** 2025-05-15

## Context

The application is multi-tenant by workspace: users should only see data
belonging to workspaces they are members of. An attacker who knows a valid
task UUID should not be able to access it unless they belong to the owning
workspace.

Three approaches were considered for enforcing data isolation:

1. **Middleware-level filtering** -- intercept Prisma queries at the
   middleware layer and inject a `where` clause automatically. This would make
   isolation invisible to developers (no risk of forgetting it) but creates a
   hidden behavior that is hard to debug and does not compose well with
   includes and nested queries.

2. **Row-Level Security (RLS) in PostgreSQL** -- enable RLS on tables and
   define policies that check `current_setting('app.user_id')` against the
   `WorkspaceMember` table. This enforces isolation at the database level
   regardless of application code. However, RLS requires raw SQL (Prisma
   does not support RLS policy definitions in the schema), and the connection
   pool would need per-request `SET` statements, which adds complexity with
   Prisma's connection management.

3. **Query-level join chains in Prisma** -- every query that accesses
   tenant-scoped data includes an explicit relation filter that terminates at
   `WorkspaceMember`. If the actor's membership record does not exist, the
   query returns no results.

## Decision

Use join-chain filtering at the Prisma query level:

```
Task --> Project --> Workspace --> WorkspaceMember (where userId = actorId)
```

Every task query includes a nested `where` clause:

```typescript
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
const member = task.project.workspace.members[0];
if (!member) throw new NotFoundError("Task");
```

Key design properties:

- **Uniform 404 for non-existent and unauthorized resources.** Both cases
  throw `NotFoundError` with the same message. An attacker cannot distinguish
  "this task UUID does not exist" from "this task UUID exists but you don't
  have access." This prevents information leakage.
- **Same pattern, different entry points.** Task queries filter from Task up
  to WorkspaceMember. Project queries do a two-step lookup (fetch project
  then verify membership via composite unique key). Workspace queries start
  from WorkspaceMember itself. Each has a consistent pattern for its entity
  type.
- **No global middleware.** Every service file explicitly includes its
  isolation filters. There is no hidden magic.
- **No RLS dependency.** The application works on any PostgreSQL 16 instance
  without special configuration. No `SET` statements, no connection pool
  wrangling.

## Consequences

### Positive

- **No data leaks.** An unauthorized query returns empty results or
  NotFoundError. There is no path that reveals resource existence to
  non-members.
- **Uniform error handling.** The same `NotFoundError` covers both "not found"
  and "no access." Callers do not need to handle different error codes for the
  two cases.
- **No RLS dependency.** The application can run against any standard
  PostgreSQL 16 instance. No database-level configuration beyond creating the
  tables.
- **Defense in depth.** Even if a client-side route or API endpoint exposes the
  wrong data, the service layer's join-chain filter still enforces isolation.
  And even if a service-layer call omits the filter, the worst case is a
  database error (missing required include), not a data leak.

### Negative

- **Verbose queries.** The Prisma `include` chains for a single task lookup
  are 15-20 lines. This adds boilerplate compared to a simpler `findUnique`
  without isolation. Every new query that accesses workspace-scoped data must
  include the full filter chain.
- **Easy to forget on new queries.** A developer adding a new service function
  could accidentally omit the join-chain filter. Code review and test coverage
  (especially [isolation.spec.ts](../../tests/isolation.spec.ts)) are the
  safety net. There is no compiler-enforced guard.
- **N+1 potential with the two-step pattern.** The project lookup pattern
  (fetch project, then separately verify membership) makes two database
  round-trips where one could suffice. At this project's scale the cost is
  negligible, but it is a known inefficiency.
