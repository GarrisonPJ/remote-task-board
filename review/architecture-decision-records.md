# Architecture Decision Records for Remote Task Board

These ADRs are ready to be placed in `docs/adr/` when implemented (Issue #10). They document existing decisions that currently lack written justification — exactly the kind of context that prevents future developers (or future-you) from re-litigating settled choices.

---

## ADR-0001: Server Actions over REST API

> Status: accepted

We use Next.js Server Actions for all Task and Member mutations instead of building a REST API layer (`/api/tasks`, `/api/members`, etc.).

**Why**: Server Actions give us end-to-end type safety without a serialization boundary — the function signature in `task-service.ts` is the same interface that `create-task-dialog.tsx` calls. No route definitions, no fetch wrappers, no request/response type duplication. The tradeoff is vendor lock-in to Next.js's mutation model, but we're already committed to Next.js for routing, SSR, and the App Router. Adding a REST layer would be a shallow module — an interface nearly as complex as the implementation it wraps — offering portability we don't need.

If we later need a public API for external consumers, we'd add REST routes alongside Server Actions, not replace them.

---

## ADR-0002: Soketi over Pusher Cloud

> Status: accepted

We use Soketi (self-hosted, Pusher-compatible WebSocket server) instead of Pusher Cloud for real-time Sync Events.

**Why**: Three factors:

1. **Data privacy**: Task data (titles, descriptions, assignments) flows through WebSocket messages. Self-hosting means Sync Event payloads never leave our infrastructure.
2. **Cost**: Pusher Cloud charges per connection and per message. Soketi is free, bounded only by the server it runs on. For a team tool with persistent connections, the Pusher Cloud cost scales poorly.
3. **Zero external dependencies**: The Docker Compose stack (App + PostgreSQL + Soketi) is fully self-contained. No external accounts, no API keys to manage, no third-party uptime dependency.

The tradeoff is operational responsibility — we maintain the Soketi instance ourselves. This is acceptable because Soketi is a single stateless container with no persistent storage, making it trivial to restart or replace. The Pusher client library works identically against Soketi, so switching back to Pusher Cloud is a config change (`PUSHER_HOST` + `useTLS`), not a code change.

---

## ADR-0003: Last-Write-Wins over CRDT for Concurrent Edits

> Status: accepted

When two Members edit the same Task simultaneously, the last write to reach the server wins. We do not implement Conflict-free Replicated Data Types (CRDTs), Operational Transform (OT), or any conflict resolution beyond overwrite.

**Why**: Task board edits are low-conflict by nature:

- **Status transitions** are the most common operation, and the set of states is small (TODO → IN_PROGRESS → DONE). Two people rarely drag the same Task at the same instant.
- **Title/description edits** happen through a modal dialog that a single Member opens. Concurrent text editing of the same field is structurally unlikely (unlike a shared document).
- **The domain expert confirmed**: "Last write wins. Both Sync Events propagate, and the final Status is whatever the server processed last." This matches user expectations.

CRDTs would add substantial complexity (state vectors, merge functions, tombstones for deletes) to solve a conflict frequency that is near-zero in practice. The CRDT complexity would be a poor trade — a deep implementation behind an interface that users rarely exercise.

If conflict frequency increases (e.g., scaling to 50+ simultaneous editors on the same Board), we'd revisit this — but at that scale, the Board model itself likely needs to change (multiple Boards, sub-teams), which would reduce per-Board concurrency back down.

---

## How to Use These ADRs

1. Create `docs/adr/` directory if it doesn't exist
2. Save each ADR as:
   - `docs/adr/0001-server-actions-over-rest.md`
   - `docs/adr/0002-soketi-over-pusher-cloud.md`
   - `docs/adr/0003-last-write-wins-over-crdt.md`
3. Link from README under a "Technical Decisions" section
4. Future ADRs should only be written when all three criteria are met:
   - **Hard to reverse** — changing your mind later costs meaningful effort
   - **Surprising without context** — a future reader would wonder "why?"
   - **Real trade-off** — genuine alternatives existed
