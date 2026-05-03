/**
 * E2E Test: Permission — 权限拦截测试
 *
 * 测试覆盖：
 * 1. MEMBER 不能删除别人的任务
 * 2. VIEWER 不能创建任务
 *
 * Seed 账号：
 *   alice@test.com / password123 — OWNER
 *   bob@test.com / password123   — MEMBER
 *
 * 权限测试模式：
 *   - 用 alice 创建 task
 *   - 用 bob 登录尝试删除 alice 的 task → 应该被拒绝
 *   - 验证错误提示出现
 *
 * browser context 隔离：
 *   Playwright 默认每个 test 是独立的 browser context（无共享 cookie）。
 *   不同 test 之间可以登录不同用户而互不影响。
 *
 * 如果需要同一个 test 中用两个用户，可以创建两个 page（两个 tab），
 * 或使用 { browser } fixture 手动创建 new context。
 *
 * 你参考文档：https://playwright.dev/docs/auth
 */

import { test, expect } from "@playwright/test";

// ============================================================
// TODO: 测试 1 — MEMBER 不能删除别人创建的任务
// ============================================================

/**
 * 步骤：
 * 1. 用 alice（OWNER）登录，创建 task
 * 2. 用 bob（MEMBER）登录
 * 3. bob 尝试删除 alice 的 task
 * 4. 验证操作被拒绝（404 或 403 或错误提示）
 *
 * 提示：可以在同一个 test 中用两个 page 对象：
 *
 * test("member cannot delete another user's task", async ({ browser }) => {
 *   const alicePage = await browser.newPage();
 *   const bobPage = await browser.newPage();
 *
 *   // alice 登录并创建 task
 *   await alicePage.goto("/login");
 *   // ...
 *
 *   // bob 登录并尝试删除
 *   await bobPage.goto("/login");
 *   // ...
 * });
 */

// ============================================================
// TODO: 测试 2 — VIEWER 不能创建任务
// ============================================================

/**
 * 步骤：
 * 1. 创建一个 VIEWER 角色的测试用户（或使用 seed 数据预设）
 * 2. 用 VIEWER 登录
 * 3. 尝试访问创建 task 的 API 或页面
 * 4. 验证被拒绝
 *
 * 提示：可以直接发 POST /api/tasks 请求并检查响应：
 *
 * const res = await page.request.post("/api/tasks", {
 *   data: { projectId: "...", title: "should fail" }
 * });
 * expect(res.status()).toBe(403);
 */
