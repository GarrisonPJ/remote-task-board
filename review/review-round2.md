# Remote Task Board — 第二轮深度 Review

> 基于当前代码库实际状态的逐文件审查。聚焦：角色权限设计合理性、前端页面细节问题、简历展示项目完整度。

---

## 📊 与上次 Review 对比

项目已有**重大升级**，上次 Review 的许多短板已解决：

| 维度 | 上次（v1） | 现在（v2） | 状态 |
|------|-----------|-----------|------|
| 数据模型 | 单表 Task + User，无 Workspace | 7 表：User/Session/Workspace/WorkspaceMember/Project/Task/ActivityLog/Comment | ✅ 已解决 |
| 角色 | 仅 ADMIN/MEMBER | OWNER/MEMBER/VIEWER，per-workspace | ✅ 已解决 |
| 权限 | 无任务级权限 | creatorId + 状态机 + 权限函数 | ✅ 已解决 |
| 认证 | NextAuth v5 beta | 自研 Session auth（cookie + PostgreSQL） | ✅ 更可控 |
| Activity Log | 无 | ActivityLog 表 + 状态转换记录 | ✅ 已解决 |
| 评论 | 无 | Comment 模块 | ✅ 已解决 |
| 状态机 | 无限制转换 | 严格 state machine（5 状态，受控转换） | ✅ 已解决 |
| Suspense/Loading | 无 | Dashboard/Tasks/Projects 均有 loading.tsx | ✅ 已解决 |
| Error Boundary | 无 | dashboard/error.tsx + 全局 error.tsx | ✅ 已解决 |
| ADR 文档 | 无 | 6 篇 ADR + architecture.md + api.md | ✅ 已解决 |

> [!TIP]
> 项目已经从「中等偏上」提升到了「明显出众」的水平。以下是剩余需要打磨的问题。

---

## 🔴 Critical Bugs（必须修复）

### Bug 1：`lib/authorization.ts` 是死代码

[authorization.ts](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/lib/authorization.ts) 中定义了完整的声明式权限策略（`can()` / `authorize()` / `POLICY` map），但 **全局没有任何文件 import 或使用它**。

实际使用的权限逻辑分散在：
- [lib/constants.ts](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/lib/constants.ts) — `canCreateTask`, `canDeleteTask`, `canUpdateTaskStatus`
- `workspace.service.ts` — 内联 `canManageWorkspace()`
- `project.service.ts` — 内联权限检查

**面试风险**：面试官看到一个设计精良但从未被调用的 authorization.ts，会质疑你是否真正理解了自己的代码。

**建议**：
- 方案 A：将 `lib/constants.ts` 中的权限函数迁移为调用 `authorize()` → 真正使用集中化策略
- 方案 B：删除 `lib/authorization.ts`，承认 `constants.ts` 就是你的权限层 → 至少保持一致性

---

### Bug 2：Activity Log API 缺少 OWNER-only 权限检查

[api/activity/route.ts](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/app/api/activity/route.ts) 返回 Activity Log 给 **所有 workspace 成员**（包括 MEMBER 和 VIEWER），但 [CONTEXT.md](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/CONTEXT.md#L78) 明确写道：

> "The Activity Log. It's only visible to **OWNERs**."

而 `lib/authorization.ts` 的 POLICY 也定义了 `activity:view → OWNER only`。

**代码 vs 文档不一致** — 面试时被追问 RBAC 实现细节时会暴露。

**建议**：在 Activity API 的查询中加入 `members: { some: { userId: user.id, role: "OWNER" } }` 过滤。

---

### Bug 3：Dark Mode 定义了但无法激活

[globals.css](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/app/globals.css) 中定义了完整的 `.dark` 主题变量，但：

- ❌ 没有 `next-themes` 的 `ThemeProvider` 包裹整个应用
- ❌ 没有暗色模式切换按钮
- ⚠️ [sonner.tsx](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/components/ui/sonner.tsx) 调用了 `useTheme()` 但没有 Provider → 运行时可能报错或永远返回 system

**建议**：
- 添加 `next-themes` 的 ThemeProvider
- 在 Sidebar Footer 或 Header 中添加 ThemeToggle 按钮
- 或者：如果不打算支持暗色模式，删除 `.dark` 变量和 `sonner.tsx` 的 `useTheme()`，避免「半成品」印象

---

### Bug 4：CONTEXT.md 中 Priority 包含 `NONE`，但 Schema 和 Zod 中不存在

[CONTEXT.md](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/CONTEXT.md#L40) 写道：

> Priority: One of `NONE`, `LOW`, `MEDIUM`, `HIGH`, `URGENT`.

但 [schema.prisma](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/prisma/schema.prisma#L143-L148) 的 `TaskPriority` 枚举只有 `LOW | MEDIUM | HIGH | URGENT`，没有 `NONE`。

**建议**：从 CONTEXT.md 中删除 `NONE`，与代码保持一致。

---

## 🟡 权限设计审查

### 权限模型整体评估：✅ 设计合理

当前的三角色模型 (OWNER / MEMBER / VIEWER) per-workspace 是合理的：

```
OWNER  → 全权限：CRUD 任何资源 + 管理成员 + Activity Log
MEMBER → 创建/编辑任务，删除自己创建的任务，变更自己被分配的任务状态
VIEWER → 只读，不能修改任何东西
```

**亮点**：
- ✅ `creatorId` 字段支持任务级别的删除权限
- ✅ 状态变更绑定 assignee（只有被分配者能改状态）— 合理且有深度
- ✅ 前端 UI 层正确隐藏了无权操作按钮
- ✅ 后端 service 层独立做权限校验（不依赖前端）

### 权限设计中的可改进点

| # | 问题 | 严重程度 | 说明 |
|---|------|---------|------|
| 1 | CONTEXT.md 与代码矛盾：状态变更权限 | ⚠️ 中 | CONTEXT.md Line 60 说 "any Member can update any Task's Status"，但代码限制为仅 assignee 可改状态。代码（更严格）是对的，文档需更新 |
| 2 | `authorization.ts` 死代码 | 🔴 高 | 见 Bug 1 |
| 3 | Activity API 权限缺失 | 🔴 高 | 见 Bug 2 |
| 4 | 无法提升/降级成员角色 | 💡 低 | OWNER 无法将 MEMBER 提升为 OWNER 或降级为 VIEWER。当前通过删除+重新邀请实现，可接受但不优雅 |
| 5 | Comment 删除级联问题 | ⚠️ 中 | `Comment.user` 没有 `onDelete` 行为（默认 Restrict）。如果删除有评论的用户，会报外键约束错误。应加 `onDelete: SetNull` 并让 `userId` 为可选 |
| 6 | OWNER 可以自我移除 | 💡 低 | 如果 workspace 有多个 OWNER，任何 OWNER 可以移除自己。虽然有「最后一个 OWNER 不能移除」的保护，但仍可能导致意外 |

---

## 🟠 前端页面细节问题

### 问题 1：下拉框弹出选项与触发器错位（用户已知问题）

**根因分析**：

Select 组件使用 `@base-ui/react/select`，渲染到 Portal。[SelectContent](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/components/ui/select.tsx#L60-L97) 默认启用了 `alignItemWithTrigger = true`，这会让选中的 item 对齐到触发器位置，而非整个下拉框顶部对齐。

当选中项不在列表顶部时，弹出框会向上偏移以对齐选中项，**导致视觉上的错位**。

**修复方案**（二选一）：
- 方案 A（推荐）：在所有使用 `<SelectContent>` 的地方加 `alignItemWithTrigger={false}`，使下拉框始终从触发器底部弹出
- 方案 B：保留对齐行为，但检查是否因为 `sideOffset={4}` 和 sidebar 的 `overflow: hidden` 叠加导致被裁切

**涉及文件**：
- [TaskFilters.tsx](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/components/task/TaskFilters.tsx)（3 个 Select）
- [TaskForm.tsx](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/components/task/TaskForm.tsx)（2 个 Select）
- [AiTaskDialog.tsx](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/components/task/AiTaskDialog.tsx)

---

### 问题 2：侧边栏只有一个 Dashboard 导航（用户已知问题）

[SidebarNav.tsx](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/components/layout/SidebarNav.tsx#L11-L13):

```typescript
const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];
```

只有一个导航项，视觉上非常空旷。但项目实际上有 `/tasks`、`/workspaces/:id`、`/projects/:id` 等页面。

**建议添加的导航项**：

```typescript
const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks",     label: "All Tasks",  icon: ListTodo },
];
```

以及将 Workspace 列表动态渲染到侧边栏中（每个 workspace 作为可展开的子菜单，包含其 projects）。或者至少添加一个 "Workspaces" 导航入口。

**参考布局**：
```
📋 Dashboard
📝 All Tasks
──────────────
🏢 WORKSPACES
  ├ Workspace A
  └ Workspace B
──────────────
[+ New Workspace]
──────────────
👤 User Info
🚪 Sign Out
```

---

### 问题 3：注册页面与登录页面视觉不一致

| 维度 | [Login](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/app/(auth)/login/page.tsx) | [Register](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/app/(auth)/register/page.tsx) |
|------|------|----------|
| 背景 | 渐变背景 `from-[#0D9488]/08 via-background to-[#EA580C]/05` | 纯白背景 `flex min-h-screen items-center justify-center` |
| 卡片阴影 | `shadow-[0_8px_30px_rgba(13,148,136,0.12)]` | 无自定义阴影 |
| Logo 图标 | ✅ 有圆形图标 | ❌ 没有 |
| 动画 | `animate-slide-up stagger-1` | ❌ 没有 |
| Loading 状态 | Spinner 组件 | 纯文字 "Creating account..." |

**建议**：将注册页的 UI 与登录页保持一致（渐变背景、logo、动画、spinner）。

---

### 问题 4：TaskForm 描述字段用的是单行 `<Input>` 而非 `<textarea>`

[TaskForm.tsx L122-L128](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/components/task/TaskForm.tsx#L122-L128)：

```tsx
<Input
  placeholder="Enter description (optional)"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

任务描述通常是多行文本，应该用 `<textarea>` 或多行 Input。

---

### 问题 5：TaskDeleteButton 使用原生 `window.confirm()`

[TaskDeleteButton.tsx L17](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/components/task/TaskDeleteButton.tsx#L17)：

```tsx
if (!window.confirm("Are you sure you want to delete this task?")) return;
```

原生浏览器 confirm 对话框与精心设计的 UI 风格不一致。应使用项目已有的 Dialog 组件实现自定义确认弹窗。

---

### 问题 6：日期输入强制 light color scheme

[TaskForm.tsx L171](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/components/task/TaskForm.tsx#L171)：

```tsx
className="accent-primary [color-scheme:light]"
```

硬编码 `[color-scheme:light]` 意味着即使实现暗色模式，date picker 也不会跟随切换。

---

### 问题 7：Header 始终显示 "Remote Task Board"，不随页面变化

[app/(app)/layout.tsx L49](file://wsl.localhost/Ubuntu-24.04/home/garry/Project/remote-task-board/app/(app)/layout.tsx#L49):

```tsx
<h1 className="text-lg font-semibold">Remote Task Board</h1>
```

Header 标题与 Sidebar 品牌名重复，且不反映当前页面上下文。可以改为面包屑或当前页面标题。

---

### 问题 8：开放注册，无安全保护

注册 API (`POST /api/auth/register`) 完全开放：
- ❌ 无邀请码 / 邀请链接
- ❌ 无频率限制 (Rate Limiting)
- ❌ 无 CAPTCHA
- ❌ 无邮箱验证

对于一个展示 RBAC 权限模型的项目，开放注册本身是合理的（demo 需要）。但面试官可能追问安全考虑。

**建议**：至少在 README 的 "Security Considerations" 或 "Known Limitations" 部分提及这些是有意的设计取舍（demo 项目），而非安全疏忽。

---

### 问题 9：Dialog 最大宽度过小

Dialog 组件 `sm:max-w-sm`（384px），对于包含两列表单（如 AiTaskDialog 的 `grid-cols-2 gap-4`）会显得局促。建议对表单类 Dialog 使用 `sm:max-w-md`（448px）或 `sm:max-w-lg`（512px）。

---

### 问题 10：无 Workspace Detail 的 Error Boundary

`app/(app)/workspaces/[workspaceId]/` 有 `loading.tsx` 但 **没有 `error.tsx`**。如果 workspace 加载失败，会冒泡到上层的通用 error boundary，体验不如专用的。

---

## 🟢 简历展示维度——还缺什么

### 当前项目已具备的简历亮点

| 亮点 | 面试话术 |
|------|---------|
| ✅ 多租户 Workspace 隔离 | "通过 Prisma join-chain 实现数据隔离，无需 RLS" |
| ✅ 自研 Session Auth | "不依赖 NextAuth/Auth0，完全掌控认证流程" |
| ✅ RBAC 三角色模型 | "OWNER/MEMBER/VIEWER per-workspace，含任务级权限" |
| ✅ 状态机 | "5 状态严格转换，Prisma $transaction 保证原子性" |
| ✅ SSR + Suspense Streaming | "Server Component + Suspense 渐进渲染" |
| ✅ React Query + 乐观更新 | "状态变更使用 optimistic mutation + rollback" |
| ✅ 6 篇 ADR 文档 | "每个重大技术决策都有文档化的权衡分析" |
| ✅ 结构化 API 响应 | "统一 `{ success, data?, error? }` 格式" |
| ✅ E2E + Unit 测试 | "Playwright 真实 PostgreSQL + Vitest 单元测试" |
| ✅ AI 任务创建 | "集成 AI 自动生成任务描述" |

### 仍缺少的简历加分项

| # | 缺失项 | 面试价值 | 难度 | 建议 |
|---|--------|---------|------|------|
| 1 | **暗色模式切换** | ⭐⭐⭐ | 低（2h） | CSS 变量已写好，只差 ThemeProvider + 按钮 |
| 2 | **修复权限层不一致** | ⭐⭐⭐⭐⭐ | 低（2h） | 让 `authorization.ts` 真正被使用，或删除它 |
| 3 | **侧边栏导航丰富化** | ⭐⭐⭐⭐ | 中（4h） | 添加 Tasks/Workspaces 导航 + workspace 列表 |
| 4 | **修复下拉框错位** | ⭐⭐⭐ | 低（1h） | `alignItemWithTrigger={false}` |
| 5 | **删除确认改为 Dialog** | ⭐⭐ | 低（1h） | 用现有 Dialog 组件替换 `window.confirm` |
| 6 | **注册页 UI 对齐登录页** | ⭐⭐⭐ | 低（1h） | 添加渐变背景、logo、动画 |
| 7 | **描述字段改为 textarea** | ⭐⭐ | 低（0.5h） | 替换 `<Input>` 为 `<textarea>` |
| 8 | **测试覆盖率 badge** | ⭐⭐⭐⭐ | 中（3h） | Vitest coverage + README badge |
| 9 | **README 运行截图/GIF** | ⭐⭐⭐⭐⭐ | 低（1h） | 录屏 → GIF，嵌入 README |
| 10 | **修复 CONTEXT.md 矛盾** | ⭐⭐⭐ | 低（0.5h） | 移除 `NONE` + 修正状态变更描述 |

---

## 📋 推荐执行顺序

### 第一批（2-3 小时，解决所有 Critical Bugs + 高价值快速修复）

1. ~~`lib/authorization.ts`~~ → 要么整合到 service 层真正使用，要么删除
2. `GET /api/activity` → 添加 `role: "OWNER"` 过滤
3. CONTEXT.md → 修正 Priority (`NONE`) 和 Status 变更描述
4. Select 下拉框 → `alignItemWithTrigger={false}`
5. 注册页 → 对齐登录页 UI
6. `window.confirm` → 改为 Dialog 组件

### 第二批（3-4 小时，提升视觉完整度）

7. 暗色模式 → ThemeProvider + 切换按钮
8. 侧边栏 → 添加 Tasks + Workspaces 动态导航
9. TaskForm 描述字段 → textarea
10. Header → 显示当前页面上下文而非固定标题

### 第三批（面试前锦上添花）

11. 测试覆盖率 badge
12. README 运行截图/GIF
13. Workspace error.tsx

---

## 🎯 更新后的面试追问预判

| 面试官问题 | 当前回答能力 |
|-----------|-------------|
| "你的权限模型怎么设计的？" | ✅ 可以详细回答三角色 + 任务级权限 + 状态机。**但需修复 authorization.ts 死代码问题** |
| "为什么不用 NextAuth？" | ✅ 有 ADR-0001 详细解释 |
| "为什么不用 WebSocket？" | ✅ 有 ADR-0005，且 React Query 乐观更新补偿 |
| "多租户数据隔离怎么做的？" | ✅ 有 ADR-0003，Prisma join-chain |
| "状态机怎么实现的？" | ✅ 代码 + 文档都完整 |
| "暗色模式支持吗？" | ⚠️ CSS 写了但没激活 → 需修复 |
| "测试覆盖率多少？" | ⚠️ 没有 coverage 数据 → 需补充 |
| "AI 功能是怎么集成的？" | ✅ AiTaskDialog 存在 |
| "这个 authorization.ts 为什么没被用到？" | 🔴 **无法回答** → 必须修复 |

---

## 💡 简历写法建议（v2 版）

### ✅ 推荐写法

> **Remote Task Board** — 多租户实时任务管理平台
> - 基于 **Next.js 16 + React 19 + TypeScript strict** 构建全栈应用，采用 **App Router + Server Components + Suspense Streaming** 实现渐进式渲染
> - 设计 **多租户 Workspace 架构**，通过 **Prisma join-chain** 实现数据隔离，支持 **RBAC 三角色权限模型**（OWNER/MEMBER/VIEWER）+ 任务级操作权限
> - 实现 **Task 状态机**（5 状态严格转换），使用 **Prisma $transaction** 保证状态变更与 Activity Log 的原子一致性
> - 自研 **Session Auth**（bcryptjs + httpOnly Cookie + PostgreSQL），不依赖第三方认证服务，实现即时登出
> - 采用 **React Query 乐观更新** + **结构化 API 响应** + **Error Boundary** 三层防御，确保交互流畅与错误可恢复
> - 搭建 **Playwright E2E（真实 PostgreSQL）** + **Vitest 单元测试** + **GitHub Actions CI** 自动化质量保障
> - 撰写 **6 篇 ADR** 文档化核心技术决策（自研 Auth、join-chain 隔离、Route Handlers over Server Actions 等）
