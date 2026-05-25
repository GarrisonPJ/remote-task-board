# ADR 0004: Route Handlers over Server Actions

**Status:** Accepted

**Date:** 2025-05-15

## Context

Next.js provides two mechanisms for handling mutations: Server Actions (annotated
`"use server"` functions callable directly from client components) and Route
Handlers (traditional RESTful API endpoints in `app/api/` that accept HTTP
requests and return standard responses).

Two approaches were considered:

1. **Server Actions** -- functions co-located with components (or extracted to
   a `lib/actions/` directory) that run on the server and can be called from
   client components via a `form` action attribute or `startTransition`. Server
   Actions are the idiomatic Next.js 16 recommendation for mutations. They
   support progressive enhancement (forms work without JavaScript) and revalidate
   server cache implicitly via `revalidatePath` / `revalidateTag`. However, they
   conflate HTTP semantics (every action is a POST), cannot return standard HTTP
   status codes without workarounds, and are harder to test in isolation (they
   require a Next.js runtime context).

2. **Route Handlers (REST API)** -- files at `app/api/<resource>/route.ts`
   exporting named functions for `GET`, `POST`, `PUT`, `DELETE`, `PATCH`. These
   accept standard `Request` and return `Response` (or `NextResponse`). They
   are plain HTTP endpoints -- testable via standard `fetch` calls, directly
   callable from `curl` or any HTTP client, and return standard status codes
   with structured JSON bodies.

## Decision

Use Route Handlers for all mutations and reads that require React Query:

```typescript
// app/api/tasks/route.ts
export async function POST(request: Request) {
  const user = await requireUser();
  const body = createTaskSchema.parse(await request.json());
  const task = await taskService.createTask(user.id, body);
  return ok(task, 201);
}

export async function GET(request: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const query = listTasksSchema.parse(Object.fromEntries(searchParams));
  const result = await taskService.listTasks(user.id, query);
  return ok(result);
}
```

Every handler follows the same pattern:

1. Authenticate via `requireUser()` (validates session cookie, returns user or
   401).
2. Validate input via a Zod schema parsed at the boundary.
3. Delegate to a service-layer function.
4. Return a structured JSON response via `ok(data, status?)` or
   `fail(error, status)` helpers.

The response envelope is always `{ success, data?, error? }`, giving the client
a predictable shape regardless of endpoint.

Server Actions are not prohibited -- they may be added later for specific form
patterns that benefit from progressive enhancement (e.g., an inline "add comment"
form that works without JavaScript). They would coexist alongside Route Handlers
as a narrow complement, not a replacement.

## Consequences

### Positive

- **Clear HTTP semantics.** `GET` is a read, `POST` is a create, `DELETE` is a
  delete. No ambiguity about what a given endpoint does. Middleware (logging,
  rate limiting, CSRF) can operate at the HTTP level.
- **Standard status codes.** `201 Created`, `400 Bad Request`, `401
  Unauthorized`, `404 Not Found`, `409 Conflict`. Clients parse these
  consistently without inspecting a custom `action` field or error message.
- **Testable via standard Request/Response.** Integration tests call handlers
  with `new Request(url, { method, body })` and assert on status + JSON body.
  No special test harness or Next.js runtime context needed.
- **Directly callable from tools.** A developer can debug an endpoint with
  `curl`, `httpie`, or Postman without reverse-engineering the Server Action
  internal protocol.
- **End-to-end type safety.** Shared Zod schemas (in `schemas/`) validate input
  and infer TypeScript types for both the handler and the client query. Type
  safety is identical to Server Actions -- the only difference is how the
  function is called.

### Negative

- **More boilerplate.** Every Route Handler requires explicit cookie-to-session
  auth, Zod parsing, and response wrapping. Server Actions handle some of this
  implicitly (auth context is available without parsing cookies). The overhead
  is roughly 5-10 lines per handler.
- **No progressive enhancement.** Forms backed by Route Handlers require
  JavaScript. A "create task" form cannot work without client JS unless we also
  build a Server Action for the same operation.
- **Cache revalidation is manual.** Server Actions call `revalidatePath()` /
  `revalidateTag()` implicitly or explicitly. Route Handlers require the client
  to invalidate React Query caches after a successful mutation. This is handled
  by the `onSuccess` callback in the `useMutation` hook, but it is another thing
  to remember.
- **Duplicate auth check surface.** Route Handlers call `requireUser()` which
  reads and validates the session cookie. Server Components call
  `getUserFromSession()` which does the same thing. Both paths exist and must
  be kept in sync (they share the same underlying function, so in practice this
  is a documentation concern, not a code duplication concern).
