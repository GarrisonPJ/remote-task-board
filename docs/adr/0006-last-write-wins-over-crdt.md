# ADR 0006: Last-Write-Wins over CRDT

**Status:** Accepted

**Date:** 2025-05-15

## Context

When two team members edit the same task simultaneously, their edits can
conflict. The application must define a strategy for resolving these conflicts
that is predictable, simple to reason about, and appropriate for the domain.

Three approaches were considered:

1. **Conflict-Free Replicated Data Types (CRDT)** -- data structures that allow
   concurrent edits to be merged automatically without a central coordinator.
   Each client maintains a replica state with a version vector; conflicts are
   resolved by deterministic merge rules. CRDT libraries (Yjs, Automerge)
   handle the complexity but introduce substantial overhead: state vectors with
   every update, tombstone entries for deleted data, and a transport layer for
   synchronizing replicas.

2. **Operational Transform (OT)** -- every operation is transformed against
   concurrent operations to produce a consistent result. OT is the technology
   behind Google Docs and has well-understood algorithms. However, OT requires
   a central server to sequence operations and transforms every operation
   against all concurrent operations, which adds latency and complexity
   proportional to the number of collaborators.

3. **Last-Write-Wins (LWW)** -- the most recently received write for a given
   field is accepted. Conflicting writes are resolved by server timestamp
   (or a Lamport clock in distributed systems). Earlier writes are silently
   discarded. This is the default behavior of most databases (including
   PostgreSQL) and the simplest possible conflict resolution strategy.

## Decision

Use Last-Write-Wins (LWW) as the conflict resolution strategy. Every API
endpoint that updates a task field accepts the new value and writes it directly
to the database. No version vectors, no merge functions, no tombstone cleanup:

```typescript
// services/task.service.ts
async updateTask(
  userId: string,
  taskId: string,
  data: UpdateTaskInput,
): Promise<TaskDTO> {
  const task = await this.getTaskWithAccess(userId, taskId);
  if (!task) throw new NotFoundError("Task");

  // Direct overwrite. The last `PATCH /api/tasks/:id` to arrive wins.
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: data.title ?? task.title,
      description: data.description ?? task.description,
      status: data.status ?? task.status,
      assigneeId: data.assigneeId ?? task.assigneeId,
      priority: data.priority ?? task.priority,
    },
  });

  return toTaskDTO(updated);
}
```

The database row is the single source of truth. If two requests arrive in quick
succession, PostgreSQL's row-level locking ensures they are serialized. The
second write overwrites the first. No client coordination is required.

This decision applies to the current scope of the application (task title,
description, status, priority, assignee). If collaborative rich-text editing of
task descriptions becomes a requirement in the future, CRDT may be introduced
for that specific field (via Yjs or similar) while the rest of the task model
remains LWW.

## Consequences

### Positive

- **No additional complexity.** The conflict resolution strategy is the default
  behavior of the database. No libraries, no synchronisation layer, no custom
  merge logic.
- **Predictable for developers.** There is no subtle CRDT merge behavior to
  understand. "The last save wins" is intuitive and requires no documentation
  beyond this ADR.
- **No storage overhead.** CRDTs require version vectors per document (or per
  field) and tombstones for deleted data. LWW requires nothing beyond the data
  itself.
- **Full compatibility with REST semantics.** `PUT` and `PATCH` are naturally
  idempotent under LWW. The server does not need to track partial updates or
  compute diffs against a previous known state.
- **Transaction safety is unchanged.** The existing Prisma `$transaction` for
  status changes + activity log still works. The activity log records the final
  state, not the intermediate conflict.

### Negative

- **Silent data loss on concurrent edit.** If Alice and Bob both edit the task
  title at the same time, and Bob's request arrives last, Alice's edit is
  silently discarded. Neither Alice nor Bob receives a conflict warning. At the
  project's target scale (small teams, low simultaneous edit frequency), this
  is acceptable -- the last editor's intent wins.
- **No undo for concurrent overwrites.** If Bob's edit overwrites Alice's,
  Alice cannot undo Bob's edit. The previous value is gone. A full audit trail
  (snapshot-based activity log, not just status changes) would mitigate this
  but is out of scope.
- **Not suitable for rich collaborative editing.** If task descriptions become
  collaborative rich-text documents (like Google Docs), LWW is a poor fit --
  one user's paragraph edit can silently delete another user's concurrent edit.
  This is an acknowledged future gap that would be addressed by introducing
  CRDT for that specific field.
- **Harder to add later without breaking existing data.** If the project later
  adopts CRDT for some fields, existing LWW-based writes would not carry
  version vectors, creating a migration challenge. The current scope
  (no collaborative editing) makes this a deferred concern.
