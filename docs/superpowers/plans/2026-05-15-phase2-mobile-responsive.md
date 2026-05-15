# Phase 2: Mobile Responsive Layout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app usable on mobile screens (<768px) by adding hamburger navigation, card-based task lists, and responsive layout adjustments.

**Architecture:** A new `MobileNav` Client Component renders a hamburger button (in header) and a slide-in sidebar overlay (at root). The server layout adds `hidden md:flex` to the desktop sidebar and embeds `MobileNav` in the header. `TaskListContent` conditionally renders `TaskList` (cards) or `TaskTable` via Tailwind `md:hidden`/`hidden md:block`. `TaskFilters` switches to full-width inputs on mobile.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, React 19, existing shadcn/ui + @base-ui/react components.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `components/layout/MobileNav.tsx` | Create | Client Component: hamburger button + mobile sidebar overlay with slide animation |
| `app/(app)/layout.tsx` | Modify | Hide sidebar on mobile, embed MobileNav in header |
| `components/task/TaskListContent.tsx` | Modify | Conditional card/table rendering |
| `components/task/TaskFilters.tsx` | Modify | Full-width inputs on mobile |
| `app/(app)/tasks/[taskId]/page.tsx` | Modify | Responsive metadata grid |

---

### Task 1: Create MobileNav component

**Files:**
- Create: `components/layout/MobileNav.tsx`

**Description:** A "use client" component that provides:
1. A hamburger button (visible on mobile only) that toggles sidebar state
2. A full-screen overlay sidebar (slide-in from left) with navigation links

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { cn } from "@/lib/utils";

type Props = {
  userName: string;
};

export function MobileNav({ userName }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button — visible on mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 -ml-2 rounded-md hover:bg-muted transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay — click to close */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in sidebar — mobile only */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-background border-r p-4 flex flex-col transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="font-semibold text-lg">Remote Task Board</div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 flex-1">
          <a
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
          >
            Dashboard
          </a>
          <CreateWorkspaceDialog />
        </nav>

        <div className="border-t pt-3 space-y-2">
          <p className="text-sm text-muted-foreground px-3">{userName}</p>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
```

The sidebar uses `fixed` positioning with a `translate-x` transition. When `open` is true, `translate-x-0` slides it in from left. The overlay captures clicks outside to close.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/layout/MobileNav.tsx
git commit -m "feat: add MobileNav component"
```

---

### Task 2: Integrate MobileNav into layout

**Files:**
- Modify: `app/(app)/layout.tsx`

**Description:** Add `hidden md:flex` to the existing sidebar (it disappears on mobile), and embed `<MobileNav>` inside the header.

- [ ] **Step 1: Read the current layout file**

File: `app/(app)/layout.tsx`

- [ ] **Step 2: Modify the layout**

Current structure:
```tsx
<div className="flex h-screen">
  <aside className="w-64 border-r bg-muted/50 p-4 flex flex-col">
    ...
  </aside>
  <div className="flex flex-1 flex-col overflow-hidden">
    <header className="flex items-center justify-between border-b px-6 py-3">
      <h1 className="text-lg font-medium">Remote Task Board</h1>
    </header>
    <main className="flex-1 overflow-auto p-6">
      <QueryProvider>{children}</QueryProvider>
    </main>
  </div>
</div>
```

Changes:

1. Add `hidden md:flex` to the sidebar `<aside>` to hide it on mobile:
```tsx
<aside className="hidden md:flex w-64 border-r bg-muted/50 p-4 flex flex-col">
```

2. Import MobileNav at top:
```tsx
import { MobileNav } from "@/components/layout/MobileNav";
```

3. Add MobileNav in the header, before the h1:
```tsx
<header className="flex items-center justify-between border-b px-4 md:px-6 py-3">
  <div className="flex items-center gap-3">
    <MobileNav userName={user.name} />
    <h1 className="text-lg font-medium">Remote Task Board</h1>
  </div>
</header>
```

4. Reduce main padding on mobile:
```tsx
<main className="flex-1 overflow-auto p-4 md:p-6">
```

Full final layout.tsx:
```tsx
import { getUserFromSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { QueryProvider } from "@/components/layout/QueryProvider";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen">
      <aside className="hidden md:flex w-64 border-r bg-muted/50 p-4 flex flex-col">
        <div className="font-semibold mb-6 text-lg">Remote Task Board</div>
        <nav className="space-y-1 flex-1">
          <a
            href="/dashboard"
            className="block px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
          >
            Dashboard
          </a>
          <CreateWorkspaceDialog />
        </nav>
        <div className="border-t pt-3 space-y-2">
          <p className="text-sm text-muted-foreground px-3">{user.name}</p>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b px-4 md:px-6 py-3">
          <div className="flex items-center gap-3">
            <MobileNav userName={user.name} />
            <h1 className="text-lg font-medium">Remote Task Board</h1>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <QueryProvider>{children}</QueryProvider>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add app/(app)/layout.tsx
git commit -m "feat: integrate MobileNav into layout with responsive sidebar"
```

---

### Task 3: Make TaskListContent responsive

**Files:**
- Modify: `components/task/TaskListContent.tsx`

**Description:** After `<TaskFilters />`, render both a card layout (mobile, `md:hidden`) and a table layout (desktop, `hidden md:block`). The card layout reuses `TaskList` + `TaskCard` which already exist.

- [ ] **Step 1: Read the current TaskListContent.tsx**

Read `components/task/TaskListContent.tsx` to confirm current structure.

- [ ] **Step 2: Modify the render section**

After the `<TaskFilters />` component, replace the single `TaskTable` render with conditional layouts:

Add imports:
```tsx
import { TaskList } from "./TaskList";
```

Replace the data rendering section (the part inside the `{data ? ...}` block after filters):

The current render is:
```tsx
<TaskTable tasks={data.items} />
```

The new render (inside the existing `{data ? ...}` block) becomes:
```tsx
<>
  {/* Mobile: card layout */}
  <div className="md:hidden">
    <TaskList tasks={data.items} />
  </div>

  {/* Desktop: table layout */}
  <div className="hidden md:block">
    <TaskTable tasks={data.items} />
  </div>
</>
```

Note: The pagination and total count remain the same for both layouts — no changes needed to the pagination section.

The empty state also splits:
```tsx
{data && data.items.length === 0 ? (
  <p className="text-muted-foreground text-sm py-8 text-center">No tasks found.</p>
) : data ? (
  ...
) : null}
```

The final conditional block (replacing the `{isLoading ? ...}` block):
```tsx
{isLoading ? (
  <TaskTableSkeleton />
) : error ? (
  <div className="text-center py-8">
    <p className="text-destructive mb-2">Failed to load tasks.</p>
    <button
      onClick={() => window.location.reload()}
      className="text-sm text-primary hover:underline"
    >
      Try again
    </button>
  </div>
) : data && data.items.length === 0 ? (
  <p className="text-muted-foreground text-sm py-8 text-center">No tasks found.</p>
) : data ? (
  <>
    <div className="md:hidden">
      <TaskList tasks={data.items} />
    </div>
    <div className="hidden md:block">
      <TaskTable tasks={data.items} />
    </div>

    {data.meta.totalPages > 1 && (
      <Pagination>
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious href={buildPageUrl(currentPage - 1)} />
            </PaginationItem>
          )}
          {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === data.meta.totalPages)
            .map((p, idx, arr) => (
              <span key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    href={buildPageUrl(p)}
                    isActive={p === currentPage}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              </span>
            ))}
          {currentPage < data.meta.totalPages && (
            <PaginationItem>
              <PaginationNext href={buildPageUrl(currentPage + 1)} />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    )}

    <p className="text-sm text-muted-foreground text-center">
      {data.meta.total} task{data.meta.total !== 1 ? "s" : ""} found
    </p>
  </>
) : null}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add components/task/TaskListContent.tsx
git commit -m "feat: responsive task list with card layout on mobile"
```

---

### Task 4: Make TaskFilters responsive

**Files:**
- Modify: `components/task/TaskFilters.tsx`

**Description:** Full-width search input and select dropdowns on mobile.

- [ ] **Step 1: Modify className props**

Current:
```tsx
<Input
  placeholder="Search tasks..."
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  className="max-w-xs"
/>
<SelectTrigger className="w-[150px]">
```

Changes:
- Search input: `className="w-full md:max-w-xs"` (full width on mobile)
- Status select: `className="w-full sm:w-[150px]"` (full width on very small, 150px from sm)
- Priority select: `className="w-full sm:w-[150px]"`
- Container: `flex flex-col sm:flex-row flex-wrap gap-3` (stack vertically on very small)

Final return JSX:
```tsx
return (
  <div className="flex flex-col sm:flex-row flex-wrap gap-3">
    <Input
      placeholder="Search tasks..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="w-full md:max-w-xs"
    />

    <Select value={currentStatus} onValueChange={(v) => updateFilter("status", v ?? "")}>
      <SelectTrigger className="w-full sm:w-[150px]">
        <SelectValue placeholder="All Statuses" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Statuses</SelectItem>
        <SelectItem value="TODO">To Do</SelectItem>
        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
        <SelectItem value="IN_REVIEW">In Review</SelectItem>
        <SelectItem value="DONE">Done</SelectItem>
        <SelectItem value="CANCELED">Canceled</SelectItem>
      </SelectContent>
    </Select>

    <Select value={currentPriority} onValueChange={(v) => v && updateFilter("priority", v)}>
      <SelectTrigger className="w-full sm:w-[150px]">
        <SelectValue placeholder="All Priorities" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Priorities</SelectItem>
        <SelectItem value="LOW">Low</SelectItem>
        <SelectItem value="MEDIUM">Medium</SelectItem>
        <SelectItem value="HIGH">High</SelectItem>
        <SelectItem value="URGENT">Urgent</SelectItem>
      </SelectContent>
    </Select>
  </div>
);
```

No imports change. No logic change.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/task/TaskFilters.tsx
git commit -m "refactor: responsive TaskFilters with full-width on mobile"
```

---

### Task 5: Responsive task detail page

**Files:**
- Modify: `app/(app)/tasks/[taskId]/page.tsx`

**Description:** Make metadata grid and layout responsive on task detail page.

- [ ] **Step 1: Read current task detail page**

Read `app/(app)/tasks/[taskId]/page.tsx`

- [ ] **Step 2: Adjust metadata grid and spacing**

Changes:
1. Metadata grid: `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (single column on mobile)
2. Outer container: `max-w-2xl` → remove or keep as-is (already fine)
3. Add `p-4 md:p-6` to the main div

The main container div:
```tsx
return (
  <div className="space-y-6 md:space-y-8 max-w-2xl">
```

The metadata grid section:
```tsx
<section className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add app/(app)/tasks/[taskId]/page.tsx
git commit -m "refactor: responsive task detail page layout"
```

---

### Task 6: Verify and final commit

**Files:**
- None (verification only)

- [ ] **Step 1: Run typecheck and tests**

```bash
pnpm typecheck && pnpm test:unit
```

Expected: zero type errors, 21 tests passing.

- [ ] **Step 2: Review visual diffs**

Run `git diff --stat` to confirm only intended files changed.

---

## Summary of Changes

| File | Action |
|------|--------|
| `components/layout/MobileNav.tsx` | Create |
| `app/(app)/layout.tsx` | Modify (sidebar responsive, MobileNav embed, padding) |
| `components/task/TaskListContent.tsx` | Modify (conditional card/table) |
| `components/task/TaskFilters.tsx` | Modify (full-width inputs) |
| `app/(app)/tasks/[taskId]/page.tsx` | Modify (responsive grid) |
