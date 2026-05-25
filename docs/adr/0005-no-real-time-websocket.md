# ADR 0005: No Real-Time WebSocket Sync

**Status:** Accepted

**Date:** 2025-05-15

## Context

Task management applications often advertise real-time collaboration features:
when one team member moves a task to "In Progress," another member sees the
update immediately without refreshing the page. Achieving this typically
requires a persistent bidirectional connection (WebSocket or SSE) or a
third-party service (Pusher, Ably, Soketi).

Two approaches were considered:

1. **WebSocket / Server-Sent Events** -- a persistent connection between the
   browser and server (or a sidecar like Soketi) that pushes events to all
   connected clients. Changes are broadcast instantly. This requires connection
   lifecycle management (reconnect, backoff, stale connection detection),
   a pub/sub channel per workspace or per board, and infrastructure for
   horizontal scaling (adapters for Redis or similar).

2. **Polling via React Query** -- React Query's built-in `refetchInterval`,
   `staleTime`, and `refetchOnWindowFocus` provide near-real-time freshness
   without a persistent connection. Mutations invalidate the query cache
   optimistically, making the local update instant. Cross-client sync occurs
   on the next refetch (triggered by window refocus, interval, or manual
   invalidation).

## Decision

Do not use WebSocket, SSE, Pusher, Soketi, or any real-time sync mechanism for
the initial build. Rely entirely on React Query's cache invalidation strategy:

- **Mutations invalidate affected query keys.** Creating, updating, or deleting
  a task calls `queryClient.invalidateQueries({ queryKey: ["tasks"] })` in the
  mutation's `onSuccess` callback, triggering a background refetch.
- **`refetchOnWindowFocus: true`** (React Query default). When a user switches
  back to the task board tab, React Query refetches any stale queries. This
  catches updates made by other team members while the user was on a different
  tab.
- **Optimistic updates.** The UI updates immediately on mutation. No waiting for
  the server round-trip. If the server rejects the mutation (e.g., invalid
  status transition), the cache rolls back to the previous value.
- **No `refetchInterval` by default.** Polling adds unnecessary database load.
  The combination of mutation invalidation + window focus refetch provides
  adequate freshness for the target team size.

If real-time sync becomes necessary in the future, it should be added behind
a channel abstraction (e.g., a `SyncChannel` interface with a Pusher-compatible
Socket.io or Soketi implementation) rather than baked into every mutation path.

## Consequences

### Positive

- **Simplest possible deployment.** No WebSocket server, no Soketi container,
  no Pusher account, no Redis adapter for pub/sub. The stack is Next.js +
  PostgreSQL + Prisma -- nothing else.
- **No connection management.** No reconnection logic, no heartbeat, no
  stale-connection detection, no exponential backoff implementation. These are
  subtle and difficult to get right.
- **No scaling concerns for connection affinity.** WebSocket servers need sticky
  sessions or a shared pub/sub adapter (Redis) to broadcast to all connected
  instances. Polling has no such requirement -- any instance can serve any
  request.
- **Lower database load than naive polling.** Without real-time sync, the
  database only serves requests triggered by user actions (page loads,
  mutations, window refocus). A polling approach would add constant read load
  proportional to the number of open tabs.
- **Optimistic updates already feel instant.** The perceived latency of a
  mutation is zero (the UI updates immediately). The only visible latency is
  when another user's changes appear on the current user's screen -- and this
  is bounded by the next user-triggered refetch.

### Negative

- **Cross-client sync is not instant.** If Alice and Bob are both viewing the
  same task list, and Alice changes a status, Bob will not see it until his
  React Query refetches. The delay is at most the time between Bob's next
  interaction (window refocus, tab switch, manual navigation) plus the server
  round-trip.
- **Window-focus-based refetch is unreliable for collaboration.** If both Alice
  and Bob keep the task board tab focused, neither will trigger a refetch.
  Changes propagate only when someone navigates away and back, or triggers a
  mutation that invalidates the cache. In practice, this is acceptable for
  small teams (5-50 members) where simultaneous editing is rare.
- **No presence awareness.** There is no indicator showing "Alice is also viewing
  this workspace." Real-time sync is a prerequisite for presence features. This
  is an explicit scope tradeoff: presence is not needed for the current feature
  set.
- **Potential for stale data on long-lived pages.** A user who leaves the task
  board open overnight will see stale data until they refocus the tab or
  trigger a mutation. This is a minor UX concern (the data is never incorrect,
  just potentially outdated) and can be mitigated later with a gentle
  `refetchInterval` (e.g., 60 seconds) if needed.
