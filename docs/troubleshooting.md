# Troubleshooting

A guide for developers working on the Remote Task Board project.

---

## Local Development

### WSL2 -- Windows browser access

The dev server must bind to `0.0.0.0` so Windows can reach it. The project already starts with:

```bash
pnpm dev   # runs next dev -H 0.0.0.0
```

Open `http://localhost:3000` from your Windows browser. If the page does not load, WSL2's port forwarding may have stalled. Restart WSL2 from PowerShell:

```powershell
wsl --shutdown
```

Then restart your WSL2 terminal and run `pnpm dev` again.

### Port 3000 in use

If another process is holding port 3000:

```bash
lsof -ti:3000 | xargs kill -9
```

If that fails (e.g. the process refuses to die), check for a stale `next dev` with:

```bash
kill -9 $(lsof -ti:3000)
```

### Docker PostgreSQL

The project expects a PostgreSQL container named `rtb-postgres`. Start it with:

```bash
docker start rtb-postgres
```

If the container does not exist, recreate it:

```bash
docker run -d \
  --name rtb-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=remote_task_board \
  -p 5432:5432 \
  postgres:16
```

Verify it is running:

```bash
docker ps --filter name=rtb-postgres
```

---

## Database Issues

### Prisma migration conflicts

If the schema is out of sync or you see migration errors, reset and re-seed:

```bash
pnpm prisma:migrate reset
pnpm db:seed
```

`prisma:migrate reset` drops the database, re-applies all migrations, and runs the seed script. This is safe to run locally (all data is synthetic).

### Seed data lost / Login fails

If demo accounts stop working, re-run the seed:

```bash
pnpm db:seed
```

Demo accounts:

| Email | Password |
|---|---|
| alice@test.com | password123 |
| bob@test.com | password123 |

### Prisma Client not found

If you see `Error: Cannot find module '@prisma/client'` or TypeScript complains about missing types, regenerate the client:

```bash
pnpm prisma:generate
```

Run this anytime you pull changes that modify `prisma/schema.prisma` or after switching branches.

---

## CI Failures

### E2E tests fail

1. Open the failing workflow run in GitHub Actions.
2. Click the failed job and scroll through the logs to find the Playwright report output.
3. If the failure is flaky, re-run the job from the GitHub Actions UI (top-right "Re-run jobs" button).
4. To reproduce locally:

```bash
pnpm test:e2e
```

Make sure your local PostgreSQL is running and seeded (`pnpm db:seed`). Playwright auto-starts the Next.js app via its `webServer` config.

### Build fails

Before pushing, run the type checker locally:

```bash
pnpm typecheck
```

This runs `tsc --noEmit` and catches type errors that would fail the CI build step. Also run `pnpm lint` to catch lint issues.

---

## Common Issues

### Edit/Delete buttons not showing

The UI conditionally renders Edit/Delete buttons based on the current user's role and task ownership. Check which role your session has:

```bash
curl http://localhost:3000/api/auth/me
```

- **OWNER** and **MEMBER** roles can edit tasks in their workspace.
- Only **OWNER** and the task **creator** (the user who created the task) can delete a task.
- **VIEWER** cannot see Edit/Delete buttons at all.

### Filters not working

Task list filters (status, priority, assignee) are read from URL search params. Ensure the query string format matches what the server component expects:

```
?status=TODO&priority=HIGH&assigneeId=<uuid>
```

Check the browser's address bar after applying filters. If the URL looks correct, verify the server component is receiving the params by checking the Network tab or server logs.

### 401 on API calls

A 401 response means the session is expired or invalid. This can happen after:

- A database reset (all sessions are wiped).
- A long idle period (sessions have a configurable TTL).
- Switching between seeded accounts without logging out first.

Re-login at `/login` with a demo account (alice@test.com / bob@test.com) or your registered account.
