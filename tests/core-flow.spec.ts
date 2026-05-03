/**
 * E2E Test: Core Flow — 正向流程测试
 *
 * 测试覆盖：
 * 1. 注册 → 自动跳转 Dashboard
 * 2. 登录 → 进入 Dashboard
 * 3. 创建 Workspace → 创建 Project → 创建 Task → 修改状态
 * 4. 输入校验：空 title 被拒绝
 *
 * Playwright 基础 API 速查：
 *   page.goto(url)           — 导航到页面
 *   page.getByLabel(text)    — 通过 label 文本找到 input（按 accessible name）
 *   page.getByRole(role, {}) — 通过 ARIA role 找到元素（按钮/链接等）
 *   page.getByText(text)     — 通过文本内容找到元素
 *   page.getByPlaceholder(t) — 通过 placeholder 找到 input
 *   .fill(value)             — 填入文本（自动清除已有内容）
 *   .click()                 — 点击元素
 *   .selectOption(value)     — select 下拉选择
 *   expect(x).toBeVisible()  — 断言元素可见
 *   expect(page).toHaveURL(p)— 断言 URL 匹配
 *
 * 测试使用 seed 数据中的用户：alice@test.com / password123（OWNER）
 *
 * 你参考文档：https://playwright.dev/docs/writing-tests
 */

import { test, expect } from "@playwright/test";

// ============================================================
// 测试 1：用户注册（完整示例）
// ============================================================

test("user can register and be redirected to dashboard", async ({ page }) => {
  // Date.now() 保证每次测试使用不重复的 email
  const email = `test-${Date.now()}@example.com`;

  await page.goto("/register");

  // getByLabel 按 <label> 文本查找关联的 <input>
  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");

  // getByRole 按 ARIA role 查找按钮，name 匹配按钮文本
  await page.getByRole("button", { name: "Create account" }).click();

  // 注册成功 → 重定向到 /dashboard
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText("Dashboard")).toBeVisible();
});

// ============================================================
// TODO: 测试 2 — 登录流程
// ============================================================

/**
 * 使用 seed 账号登录：
 *   email = "alice@test.com", password = "password123"
 *
 * test("user can login with seed account", async ({ page }) => {
 *   await page.goto("/login");
 *   await page.getByLabel("Email").fill("alice@test.com");
 *   await page.getByLabel("Password").fill("password123");
 *   await page.getByRole("button", { name: "Login" }).click();
 *   await expect(page).toHaveURL(/dashboard/);
 * });
 */

// ============================================================
// TODO: 测试 3 — 创建 Workspace → Project → Task 完整流程
// ============================================================

/**
 * 先登录，然后依次创建 workspace、project、task。
 *
 * test("full creation flow: workspace → project → task", async ({ page }) => {
 *   // 1. 登录
 *   // 2. 创建 workspace（点击 "New Workspace" → 填名称 → 提交）
 *   // 3. 创建 project
 *   // 4. 创建 task（填 title → 提交）
 *   // 5. 验证 task 出现在列表中
 * });
 */

// ============================================================
// TODO: 测试 4 — 状态变更
// ============================================================

/**
 * 创建 task 后修改其状态，验证状态更新成功。
 *
 * test("user can change task status", async ({ page }) => {
 *   // 1. 登录并导航到 task 列表
 *   // 2. 点击一个 task
 *   // 3. 修改 status（如 TODO → IN_PROGRESS）
 *   // 4. 验证新状态显示在页面上
 * });
 */

// ============================================================
// TODO: 测试 5 — 输入校验（空 title 被拒绝）
// ============================================================

/**
 * 尝试提交空 title 的 task，验证系统正确拒绝。
 *
 * test("task with empty title is rejected", async ({ page }) => {
 *   // 1. 登录并导航到 task 创建页面
 *   // 2. 不填 title 直接提交
 *   // 3. 验证错误消息出现（toast 或 inline error）
 *   // 4. 验证没有新 task 被创建
 * });
 */
