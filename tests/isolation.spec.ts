/**
 * E2E Test: Data Isolation — 数据隔离测试
 *
 * 验证核心安全要求：用户 A 看不到用户 B 的 workspace 数据。
 *
 * 数据隔离在 task.service.ts 的 listTasks() 中实现，通过以下 Prisma 过滤：
 *   project: { workspace: { members: { some: { userId: actorId } } } }
 *
 * 测试策略：
 * - 创建两个独立的用户
 * - 每个用户创建一个 workspace
 * - 验证用户 A 无法获取用户 B 的 workspace 数据
 */

import { test, expect } from "@playwright/test";

// ============================================================
// TODO: 测试 1 — 用户 A 看不到用户 B 的 workspace
// ============================================================

/**
 * 步骤：
 * 1. 注册用户 A → 登录 → 创建 workspaceA
 * 2. 注册用户 B → 登录 → 创建 workspaceB
 * 3. 用用户 A 的 session 请求 /api/workspaces
 * 4. 验证返回列表中只有 workspaceA，没有 workspaceB
 *
 * 实现提示：
 *   - 用两个 browser context / page 分别操作两个用户
 *   - 或者用 API 直接请求（page.request.get）
 *
 * test("user A cannot see user B's workspace", async ({ browser }) => {
 *   const ctxA = await browser.newContext();
 *   const ctxB = await browser.newContext();
 *   const pageA = await ctxA.newPage();
 *   const pageB = await ctxB.newPage();
 *
 *   // 注册用户 A
 *   // 注册用户 B
 *   // 验证隔离
 * });
 */

// ============================================================
// TODO: 测试 2 — 未登录用户无法访问受保护页面
// ============================================================

/**
 * 步骤：
 * 1. 不登录直接访问 /dashboard
 * 2. 验证被重定向到 /login
 *
 * test("unauthenticated user is redirected to login", async ({ page }) => {
 *   await page.goto("/dashboard");
 *   await expect(page).toHaveURL(/login/);
 * });
 */
