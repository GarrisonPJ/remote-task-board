# 代码评审问题修复计划

**日期:** 2026-05-10
**来源:** TSasS-review 代码评审报告
**对照文档:** README.md, remote_task_board_project_design.md

## 总体目标

修复评审报告中指出的 7 个问题（4 个 P1 + 3 个 P2），使项目达到可交付状态。

## 修复清单

### P1-1: ZodError 被当成 500 返回

**根因:** `lib/api-response.ts:fail()` 只判断 `AppError`，`ZodError` 落入 catch-all 返回 500。

**修改文件:** `lib/api-response.ts`

**方案:**
- 在 `fail()` 中增加 `error instanceof ZodError` 分支（在 `AppError` 之后、catch-all 之前）
- 返回 `400 VALIDATION_ERROR`，`details` 映射 `error.errors` 的 field/message

**影响:** 全项目 11 处 `.parse()` 调用自动修复，无需逐个改 route handler。

---

### P1-2: CI 手动启动 app 与 Playwright webServer 冲突

**根因:** CI 跑 `pnpm start` 后台启动，Playwright config 的 `webServer` 在 `CI=true` 时也启动。

**修改文件:** `.github/workflows/ci.yml`, `playwright.config.ts`

**方案:**
1. 删除 `.github/workflows/ci.yml` 中手动 `pnpm start &` 步骤
2. 修改 `playwright.config.ts` 的 `webServer.command` 从 `npm run dev` 改为 `pnpm start`
3. CI 流程变为: `build → seed DB → pnpm test:e2e`

---

### P1-3: 注册测试期望直接进 dashboard，但实现跳转 login

**根因:** 注册 API 只创建用户，不创建 session 也不设 cookie。

**修改文件:** `services/auth.service.ts`, `app/api/auth/register/route.ts`

**方案:** 注册即登录
1. `register()` 返回值从 `UserDTO` 改为 `{ user: UserDTO; sessionId: string }`
2. 注册 API 在创建用户后创建 session + 设置 `session_id` httpOnly cookie
3. 行为与 `login` API 对齐

---

### P1-4: removeMember 未校验 memberId 属于当前 workspace（IDOR 风险）

**根因:** target member 查询仅用 `{ id: memberId }`，未带 `workspaceId`。OWNER 可能删除其他 workspace 的成员。

**修改文件:** `services/workspace.service.ts`

**方案:**
- target member 查询改为 `{ id: memberId }` + 校验 `target.workspaceId === workspaceId`
- 不匹配时抛出 `NotFoundError("Member")`

---

### P2-1: viewer 权限测试没有真实 viewer 场景

**根因:** 测试用的是不在任何 workspace 的用户（返回 404），而非 VIEWER 角色（应返回 403）。

**修改文件:** `tests/permission.spec.ts`

**方案:** 重写 viewer 测试
1. OWNER 登录 → 创建 workspace + project
2. 注册 viewer 用户
3. OWNER 通过 API 添加 viewer 为 VIEWER 角色
4. viewer 登录 → 尝试 POST create task → 期望 `403 Forbidden`

---

### P2-2: 任务筛选、搜索、分页 UI 未接入

**根因:** `TaskFilters` 和 `Pagination` 组件已定义但未被任何页面引用。`TasksPage` 仅读取部分 search params，忽略 `tasks.meta`。

**修改文件:** `app/(app)/tasks/page.tsx`

**方案:**
1. 读取 `q`/`priority`/`assigneeId` search params
2. 导入并渲染 `TaskFilters` 组件
3. 从 `tasks.meta` 读取分页信息，渲染 `components/ui/pagination.tsx`

---

### P2-3: ActivityLog 未返回到 DTO，也未展示在详情页

**根因:** `TaskDTO` 无 `activityLogs` 字段；`getTaskById()` 从 DB 查了 activityLogs 但 DTO 映射时丢弃；详情页无 UI。

**修改文件:** `types/domain.ts`, `services/task.service.ts`, `app/(app)/tasks/[taskId]/page.tsx`

**方案:**
1. `TaskDTO` 增加 `activityLogs?: ActivityLogDTO[]`
2. `getTaskById()` DTO 映射时包含 activityLogs
3. 任务详情页底部渲染 Activity 时间线

---

## 修复顺序

```
P1-1 → P1-2 → P1-3 → P1-4 → P2-1 → P2-2 → P2-3
```

P1 优先保证正确性和安全性，P2 补齐功能完整性。

## 验证

| 步骤 | 命令 | 预期 |
|------|------|------|
| 类型检查 | `pnpm typecheck` | 零错误 |
| 构建 | `pnpm build` | 通过 |
| E2E 测试 | `pnpm test:e2e` | 11/11 通过 |
| 手动 - 注册 | 注册新用户 | 直接进入 dashboard |
| 手动 - 任务列表 | 打开任务列表页 | 显示搜索/筛选/分页 |
| 手动 - 任务详情 | 打开任务详情页 | 底部显示活动日志时间线 |
