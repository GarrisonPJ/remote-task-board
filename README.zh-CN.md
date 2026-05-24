# Remote Task Board

面向远程团队的轻量级任务管理平台。

技术栈：Next.js、TypeScript、PostgreSQL、Prisma。

## 技术栈

| 层级 | 技术 |
|---|---|
| Framework | Next.js App Router |
| Language | TypeScript strict |
| Database | PostgreSQL / Supabase |
| ORM | Prisma |
| Auth | 自定义 Session：bcrypt + httpOnly cookie + DB Session |
| UI | Tailwind CSS + shadcn/ui / Base UI |
| Validation | zod |
| Testing | Vitest + Playwright |
| CI | GitHub Actions |
| Deploy | Vercel + Supabase |

## 功能

- ✅ **用户认证**：注册、登录、登出，Session 存储在数据库中。
- ✅ **Workspace 管理**：创建工作区，管理 OWNER / MEMBER / VIEWER 成员。
- ✅ **项目管理**：在 workspace 下创建和查看项目。
- ✅ **任务 CRUD**：创建、查看、编辑、删除任务。
- ✅ **任务状态流转**：通过状态机限制 TODO / IN_PROGRESS / IN_REVIEW / DONE / CANCELED 的转换，支持 review/reopen 与 cancel/reopen 路径。
- ✅ **搜索 / 筛选 / 分页**：任务列表支持状态、优先级、负责人和标题搜索。
- ✅ **权限控制**：OWNER、MEMBER、VIEWER 以及 assignee 权限分别约束不同操作。
- ✅ **活动日志**：任务状态变更和 ActivityLog 在同一个 Prisma transaction 中写入。
- ✅ **数据隔离**：通过 Task → Project → Workspace → WorkspaceMember 链路校验访问权限。
- ✅ **评论**：OWNER/MEMBER 可发表评论，VIEWER 只读。
- ✅ **可选 AI 创建任务**：配置 `DEEPSEEK_API_KEY` 后可用自然语言解析任务。
- 📋 **后续扩展**：邀请链接、邮件通知、Kanban、完整审计日志。

## 数据流

| 场景 | 数据获取方式 |
|---|---|
| dashboard / workspace / project / task detail 首屏 | Server Component → Service → Prisma |
| task list 筛选、分页、搜索 | URL search params → Client Component → React Query → `GET /api/tasks` |
| 写操作、评论、AI 解析 | Client Component → Route Handler → Service |
| 当前用户 / Session 校验 | Server Component 或 Route Handler 调用 auth lib |

稳定页面读操作走 Server Components。任务列表因为筛选、搜索、分页是 URL 驱动的交互状态，所以使用客户端 React Query 调 `/api/tasks`。写操作和 AI 解析走 Route Handlers，统一做 zod 校验和权限拦截。

## 本地启动

```bash
pnpm install

docker run -d \
  --name rtb-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=remote_task_board \
  -p 5432:5432 \
  postgres:16

cp .env.example .env
# 可选：设置 DEEPSEEK_API_KEY 以启用 AI 创建任务

pnpm prisma:generate
pnpm prisma:migrate
pnpm db:seed
pnpm dev
```

## Demo 账号

| Email | Password | Role |
|---|---|---|
| alice@test.com | password123 | OWNER |
| bob@test.com | password123 | MEMBER |

## 测试

```bash
pnpm test:unit
pnpm test:e2e
```

Playwright 会根据 `playwright.config.ts` 自动启动 Next.js app。CI 使用 PostgreSQL service container，执行迁移、种子数据、typecheck、build 和 E2E。

## 已知不足

- ActivityLog 目前只记录状态变更，不是完整 audit trail。
- 权限模型适合小团队，不覆盖企业级组织层级。
- 评论目前支持创建和列表展示，不支持编辑、删除和楼中楼。
- 未配置 `DEEPSEEK_API_KEY` 时隐藏 AI 创建任务入口。
- 暂无实时协作或 WebSocket presence。

## 后续可扩展

- Workspace 邀请链接。
- 任务分配和状态变化邮件通知。
- 拖拽式 Kanban 看板。
- 完整审计日志。
- 评论编辑 / 删除 / @提醒。
