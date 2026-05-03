/**
 * E2E Test: Task Status — 状态流转测试
 *
 * 验证状态机规则（设计文档 Section 8.4）：
 *
 * 合法流转：
 *   TODO → IN_PROGRESS, CANCELED
 *   IN_PROGRESS → IN_REVIEW, CANCELED, TODO
 *   IN_REVIEW → DONE, IN_PROGRESS, CANCELED
 *   DONE → IN_REVIEW
 *   CANCELED → TODO
 *
 * 非法流转（应被拒绝）：
 *   DONE → TODO（必须经过 IN_REVIEW）
 *   DONE → CANCELED
 *
 * 状态校验在 task.service.ts 的 VALID_TRANSITIONS 表中实现。
 */

import { test, expect } from "@playwright/test";

// ============================================================
// TODO: 测试 1 — 完整正向流转路径
// ============================================================

/**
 * 测试 TODO → IN_PROGRESS → IN_REVIEW → DONE 的完整路径。
 *
 * test("task can flow through all valid statuses", async ({ page }) => {
 *   // 1. 登录 + 创建 task（初始状态 TODO）
 *   // 2. 改状态 TODO → IN_PROGRESS，验证成功
 *   // 3. 改状态 IN_PROGRESS → IN_REVIEW，验证成功
 *   // 4. 改状态 IN_REVIEW → DONE，验证成功
 * });
 */

// ============================================================
// TODO: 测试 2 — 非法流转被拒绝
// ============================================================

/**
 * 尝试 DONE → TODO，验证被状态机拒绝。
 *
 * 实现方式 1（UI 测试）：
 *   - 如果 UI 中的状态选择器只显示合法选项 → 验证 DONE 时看不到 TODO 选项
 *
 * 实现方式 2（API 测试）：
 *   - 直接用 page.request.patch 发非法请求
 *   - 验证返回 400 错误
 *
 * API 测试示例：
 * test("cannot transition DONE directly to TODO", async ({ page, request }) => {
 *   // 先登录获取 session（或用 API key）
 *   // 发 PATCH /api/tasks/:id/status { status: "TODO" }
 *   // 期望 400 + INVALID_TRANSITION 错误码
 *
 *   const res = await request.patch(`/api/tasks/${taskId}/status`, {
 *     data: { status: "TODO" }
 *   });
 *   expect(res.status()).toBe(400);
 *   const body = await res.json();
 *   expect(body.error.code).toBe("INVALID_TRANSITION");
 * });
 */

// ============================================================
// TODO: 测试 3 — CANCELED 可以重新打开为 TODO
// ============================================================

/**
 * test("canceled task can be reopened", async ({ page }) => {
 *   // 1. 创建 task（TODO）
 *   // 2. TODO → CANCELED
 *   // 3. CANCELED → TODO（合法流转）
 *   // 4. 验证状态变为 TODO
 * });
 */
