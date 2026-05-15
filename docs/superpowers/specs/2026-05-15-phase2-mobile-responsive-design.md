# Phase 2: Mobile Responsive Layout

**Date:** 2026-05-15
**Goal:** 适配 mobile 端，让 recruiters 在手机上打开 demo 时体验良好

## Decisions

| Topic | Decision |
|-------|----------|
| Mobile navigation | 汉堡菜单，点击展开 Sheet/Drawer 侧边栏 |
| Task list (mobile) | 卡片布局（复用 TaskCard from TaskList），大屏保持 TaskTable |
| Dialogs (mobile) | 保持现状（`max-w-[calc(100%-2rem)]` 已全宽居中） |
| Breakpoint | Tailwind `md` (768px) 为 mobile/desktop 分界线 |

---

## Files Changed

### 1. `app/(app)/layout.tsx` — 汉堡菜单 + 侧边栏

Add mobile hamburger button in header (visible `md:hidden`), sidebar hidden on mobile (`hidden md:flex`):

```
Desktop: sidebar visible (w-64) + main content
Mobile:  no sidebar → hamburger in header → Sheet slides from left
```

The Sheet component reuses existing shadcn pattern (same as Dialog, using `@base-ui/react/dialog` — or we can just build a simple collapsible with state).

Actually, simpler approach without adding new deps:
- Add a `useState` toggle in a new Client Component wrapper
- Mobile header has hamburger → state toggles sidebar visibility
- Sidebar uses `hidden md:flex` — on mobile only shows when state is open
- Overlay click → close sidebar

New component: `components/layout/MobileSidebar.tsx` — Client Component managing toggle state.

### 2. `components/task/TaskListContent.tsx` — 条件渲染表格/卡片

Add responsive rendering below TaskFilters:

```tsx
// Mobile: card layout (md:hidden)
// Desktop: table layout (hidden md:block)
```

Data already fetched via TanStack Query — both layouts share same data.

Reuses `TaskList` + `TaskCard` (already exist in dashboard). Need to ensure `TaskCard` handles navigation link.

### 3. `components/task/TaskFilters.tsx` — 全宽搜索 + 换行

Minor adjustments:
- Search `Input`: remove `max-w-xs` on mobile (`md:max-w-xs`)
- Select widths: `w-full sm:w-[150px]` on mobile

### 4. `app/(app)/tasks/[taskId]/page.tsx` — 详情页布局

Metadata grid: `grid-cols-2` already, but might be tight. Keep as-is or go `grid-cols-1 sm:grid-cols-2`.

TaskStatusControl buttons: `flex-wrap` already handles overflow. Keep as-is.

### 5. `app/(app)/dashboard/page.tsx` — Dashboard

Already partially responsive:
- Stats: `grid-cols-2 sm:grid-cols-4` ✓
- Workspaces: `sm:grid-cols-2 lg:grid-cols-3` ✓
- Recent Tasks: TaskList already uses `sm:grid-cols-2 lg:grid-cols-3` ✓

Minor: heading padding reduce on mobile (`space-y-4` instead of `space-y-8`).

### 6. Global adjustments

- `main` padding: `p-4 md:p-6`
- Header: `px-4 md:px-6`
- Page heading: `text-xl md:text-2xl`

---

## Components to Create

| File | Description |
|------|-------------|
| `components/layout/MobileSidebar.tsx` | Client Component: hamburger toggle + Sheet overlay for mobile nav |

## Components to Modify

| File | Change |
|------|--------|
| `app/(app)/layout.tsx` | MobileSidebar integration, responsive sidebar |
| `components/task/TaskListContent.tsx` | Conditional card/table layout |
| `components/task/TaskFilters.tsx` | Full-width inputs on mobile |

---

## Not in Scope

- New Dialog/Sheet behavior (keep current)
- Tablet-specific breakpoints (just `md` for now)
- PWA/app installation
- Touch gesture support
