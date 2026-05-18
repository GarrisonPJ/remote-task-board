# Design Decisions & UX Enhancement Plan

> Generated: 2026-05-17
> Source: UI/UX Pro Max evaluation + implementation history
> Context: Resume portfolio project — Remote Task Board (Next.js 16, shadcn/ui, Tailwind v4, TanStack Query)

---

## 1. Design System (Finalized)

### 1.1 Color Palette — Teal Productivity

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| Primary | `#0D9488` | `#2DD4BF` | Buttons, links, active states |
| Primary Hover | `#0F766E` | `#5EEAD4` | Button hover |
| On Primary | `#FFFFFF` | `#042F2E` | Text on primary bg |
| Secondary | `#14B8A6` | `#5EEAD4` | Secondary accents |
| Accent | `#EA580C` | `#FB923C` | CTA, highlights |
| Background | `#F0FDFA` | `#0B1D1B` | Page bg |
| Surface | `#FFFFFF` | `#112926` | Cards, panels |
| Surface Alt | `#F8FFFE` | `#16312E` | Table header, nav bar |
| Foreground | `#134E4A` | `#E2F0EE` | Primary text |
| Muted | `#E8F1F4` | `#1A3633` | Subtle bg |
| Muted Foreground | `#64748B` | `#A0B9B6` | Secondary text |
| Border | `#CCFBF1` | `#1E3D39` | Dividers, outlines |
| Destructive | `#DC2626` | `#F87171` | Delete, errors |
| Ring / Focus | `#0D9488` | `#2DD4BF` | Focus ring |

### 1.2 Typography — Plus Jakarta Sans

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Tailwind config */
--font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
```

Weight usage:
- 400 — body text
- 500 — labels, navigation
- 600 — buttons, section titles
- 700 — headings
- 800 — display / hero

### 1.3 Style Direction

| Attribute | Decision |
|-----------|----------|
| Style | Micro-interactions + Friendly SaaS |
| Corners | `border-radius: 10px` (inputs/buttons), `12px` (cards/panels), `16px` (login card) |
| Shadows | `0 1px 2px rgba(13,148,136,0.05)` (sm), `0 4px 12px rgba(13,148,136,0.08)` (md), `0 8px 30px rgba(13,148,136,0.12)` (lg) |
| Icons | Lucide (consistent stroke, SVG only, no emoji) |
| Mode | Full light + dark mode support |
| Anim | 150-300ms micro-interactions, ease-out for enter, ease-in for exit |

---

## 2. Interactive Components — Enhancement Backlog

### Batch P0 (Critical — ~30 min)

#### 2.1 Press Feedback (active:scale)

Add `active:scale-[0.97]` and `transition-all duration-150` to all interactive elements:

- [ ] `components/ui/button.tsx` — shadcn Button
- [ ] `components/task/TaskCard.tsx` — Card wrapper
- [ ] `components/workspace/WorkspaceCard.tsx` — Card wrapper
- [ ] `components/layout/MobileNav.tsx` — hamburger button
- [ ] `app/(app)/layout.tsx` — nav-item links (sidebar)
- [ ] `TaskStatusControl.tsx` — status buttons
- [ ] `pagination` page-btn (if custom)

Pattern:
```tsx
className="... active:scale-[0.97] transition-all duration-150"
```

#### 2.2 prefers-reduced-motion

Add to `app/globals.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

#### 2.3 Sidebar Active Nav State

- [ ] Dashboard link highlights when on `/dashboard`
- [ ] Workspaces link (or general nav) highlights based on pathname
- [ ] Use `usePathname()` in Client Component or pass `pathname` from layout

### Batch P1 (Medium — ~1 hr)

#### 2.4 MobileNav Animation Polish

- [ ] Overlay: add `animate-fade-in` (currently instant show)
- [ ] Sidebar: change `duration-200` linear to `duration-200 ease-out`
- [ ] Close button: add hover scale feedback

#### 2.5 Button Loading Spinner

Unify async button state across:
- [ ] `CreateWorkspaceDialog.tsx` — pending → spinner
- [ ] `CommentForm.tsx` — pending → spinner
- [ ] Login page — pending → spinner

Pattern (inline svg or use existing shadcn Button with `disabled` + icon):
```tsx
{isPending && <Spinner className="h-4 w-4 animate-spin" />}
```

#### 2.6 Empty State Enhancement

- [ ] `TaskListContent.tsx` — "No tasks found" → illustration + "Create your first task" CTA
- [ ] `TaskList.tsx` — same treatment
- [ ] Dashboard — "No workspaces yet" → illustration + Create Workspace button

### Batch P2 (Nice-to-have — ~1 hr)

#### 2.7 Error Recovery

- [ ] `TaskListContent.tsx` — `refetch()` instead of `window.location.reload()`
- [ ] `CommentList` — add refetch on error
- [ ] Error detail expandable

#### 2.8 Mobile Touch Optimization

- [ ] Hamburger minimum touch area: `p-3` (48×48px)
- [ ] Filter selects: `min-h-[44px]` on mobile
- [ ] MobileNav open → `overscroll-behavior: contain` on body

#### 2.9 Entrance Animations

- [ ] Dashboard stat cards: stagger fade-in-up
- [ ] Task table rows: stagger fade-in (subtle, 30ms per row)
- [ ] Task detail sections: fade-in-up cascade

---

## 3. Current Implementation Status

### Phase 1 ✅ (merged to master)
- [x] Comment module (model, API, components)
- [x] TanStack Query integration (QueryClient, useQuery, useMutation)
- [x] TaskListContent with loading/error/empty states
- [x] TaskStatusControl with useMutation

### Phase 2 ✅ (merged to master)
- [x] MobileNav hamburger + slide-in sidebar
- [x] Responsive layout (hidden md:flex, md:hidden)
- [x] TaskList cards on mobile, TaskTable on desktop
- [x] Responsive filters (full-width on mobile)
- [x] Responsive task detail grid

### Visual Polish ✅ (merged to master, commit ecf5de9)
- [x] :root CSS light theme variables added
- [x] Login page gradient + branding
- [x] Sidebar with logo, avatar, icons
- [x] TaskTable rounded container + styled
- [x] Task detail card sections
- [x] WorkspaceCard hover transition
- [x] LogoutButton with icon

### Interaction Enhancement ⬜ (pending — Batch P0-P2 above)
- [ ] Press feedback (active:scale)
- [ ] prefers-reduced-motion
- [ ] Sidebar active nav state
- [ ] MobileNav animation polish
- [ ] Button loading spinner
- [ ] Empty states with illustrations
- [ ] Error recovery refetch

### Phase 3 ⬜ (pending)
- [ ] Docker packaging
- [ ] Vercel deployment
- [ ] README badges + live demo link
- [ ] Supabase production DB

---

## 4. Key Lessons from Previous Work

### CSS Variable System (Tailwind v4 + shadcn/ui)

The `@theme inline` directive maps Tailwind utility classes to CSS custom properties
(e.g. `bg-background` → `var(--background)`). Both `:root` (light) and `.dark` blocks
**must** be defined, or the app renders as unstyled wireframe.

```css
@theme inline {
  --color-background: var(--background);
  /* ... */
}
:root { /* light values */ }
.dark  { /* dark values */ }
```

### Responsive Strategy

Use Tailwind breakpoint classes for responsive behavior, NOT JS breakpoint detection:

- `hidden md:flex` — hide on mobile, show on desktop
- `md:hidden` — show on mobile only
- `w-full md:max-w-xs` — full width mobile, constrained desktop
- Cards on mobile (`md:hidden`) + Table on desktop (`hidden md:block`) — single data source

### TanStack Query Pattern

```tsx
// Singleton client
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

// Data fetching
const { data, isLoading, error } = useQuery({ queryKey: ["tasks", queryString], queryFn });

// Mutation + cache invalidation
const mutation = useMutation({
  mutationFn: ...,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
});
```

---

## 5. Preview Reference

The visual preview HTML is at `ui-preview.html` in project root. Open in browser
to see the Teal design system applied across all pages.
