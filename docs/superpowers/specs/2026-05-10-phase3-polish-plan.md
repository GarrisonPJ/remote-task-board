# Phase 3: Credibility + Demo Experience

**Date:** 2026-05-10
**Review source:** User's three-layer optimization framework
**Focus:** Layer 1 (credibility) + Layer 2 (demo experience)

---

## Decomposition

### Layer 1: Credibility (3-4 days)
Make the project pass professional code review scrutiny.

| WP | Scope | Files |
|----|-------|-------|
| 1.1 | CI reproducibility: `pnpm-lock.yaml` committed, CI uses `--frozen-lockfile` | `.github/workflows/ci.yml` |
| 1.2 | E2E coverage gaps: viewer cannot see create buttons (4 tests), invalid pagination params don't 500 (2 tests), OWNER deletes any task (1 test) | `tests/permission.spec.ts`, `tests/core-flow.spec.ts` |
| 1.3 | Service-layer unit tests: VALID_TRANSITIONS, canDeleteTask, canUpdateTaskStatus, assignee workspace validation | `tests/services/` (new) |
| 1.4 | Permission-aligned UI: VIEWER hides create/edit/delete buttons (4 gaps found) | task detail, project detail, workspace detail pages |

### Layer 2: Demo Experience (3-4 days)
Make the product feel complete in a 5-minute demo walkthrough.

| WP | Scope | Files |
|----|-------|-------|
| 2.1 | Status change control on task detail: show only legal next-status buttons, guard by assignee/OWNER check | `app/(app)/tasks/[taskId]/page.tsx`, new `TaskStatusControl.tsx` |
| 2.2 | Task form upgrades: add assignee picker, due date picker to create/edit form | `TaskForm.tsx`, `task.schema.ts` |
| 2.3 | Dashboard upgrade: stat cards + recent activity sidebar (replace current skeleton) | `app/(app)/dashboard/page.tsx` |
| 2.4 | Task list upgrade: table/list hybrid layout, richer filter bar | `app/(app)/tasks/page.tsx`, `TaskList.tsx` |
| 2.5 | Activity timeline polish: actor avatar, from→to badge, relative time | `app/(app)/tasks/[taskId]/page.tsx` |

### Layer 3: Feature Highlights (deferred)
Not in Phase 3 scope. Pick one (invite links or comments) after Layer 1+2 is complete.

---

## 5 page mockups

Attached: `docs/design-mockup.html` — renders expected post-Phase 3 state for:
1. Dashboard with stats + recent tasks + activity feed
2. Task List with table layout + filter toolbar
3. Task Detail with status control + sidebar layout + activity timeline
4. Workspace Detail with member management section
5. Permission demo: same page shown for OWNER vs MEMBER vs VIEWER
