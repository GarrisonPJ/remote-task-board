# Remote Task Board — 远程任务管理看板

面向远程协作团队的轻量任务管理系统。

基于 Next.js + TypeScript + PostgreSQL + Prisma 的全栈项目。

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js (App Router) |
| 语言 | TypeScript (strict) |
| 数据库 | PostgreSQL (Supabase) |
| ORM | Prisma |
| 认证 | 自定义 Session（bcrypt + httpOnly cookie，DB 存储） |
| UI | Tailwind CSS + shadcn/ui |
| 校验 | zod |
| 测试 | Playwright |
| CI | GitHub Actions |
| 部署 | Vercel + Supabase |

## 功能

- **用户认证** — 注册、登录、登出（自定义 Session，bcrypt 加盐）
- **Workspace 管理** — 创建工作区并管理成员
- **项目管理** — 在工作区下管理项目
- **任务 CRUD** — 完整的任务增删改查
- **任务状态流转** — 定义状态机转换规则（TODO → IN_PROGRESS → IN_REVIEW → DONE → CANCELED）
- **搜索 / 筛选 / 分页** — 按状态、优先级、负责人筛选，标题搜索，分页展示
- **基于角色的权限控制** — OWNER / MEMBER / VIEWER 三级权限
- **负责人特殊权限** — 任务负责人可修改任务状态
- **活动日志** — 记录每次任务状态变更（Prisma transaction 包裹）
- **数据隔离** — 通过三表 join（Task → Project → WorkspaceMember）保证用户只能访问自己 workspace 的数据

## 数据流

| 场景 | 数据获取方式 |
|---|---|
| 页面首屏渲染（dashboard、workspace、project、task list） | Server Component → Service（直调 Prisma） |
| 筛选 / 分页 / 搜索 | URL search params → 触发 Server Component 重新渲染 |
| 写操作（create、update、delete） | Client Component → Route Handler → Service |
| 获取当前用户 / Session 校验 | Server Component 直接调用 auth lib |

读操作走 Server Components 避免多余网络跳转，写操作走 Route Handlers 统一做 zod 校验和权限拦截。

## 架构

```
Remote Task Board
├── app/                   # Next.js App Router 页面 & API
│   ├── (auth)/            # 登录、注册
│   ├── dashboard/         # 主工作台
│   ├── workspaces/        # 工作区页面
│   ├── projects/          # 项目页面
│   ├── tasks/             # 任务页面
│   └── api/               # Route Handlers（仅写操作）
│
├── components/            # UI 组件（按业务域分组）
│   ├── ui/                # 基础组件（shadcn/ui）
│   ├── layout/            # 布局组件
│   ├── workspace/         # 工作区相关
│   ├── project/           # 项目相关
│   └── task/              # 任务相关
│
├── lib/                   # 基础设施（prisma、auth、env、logger、errors）
├── services/              # 业务逻辑层（直调 Prisma）
├── schemas/               # zod 输入校验
├── types/                 # 统一类型定义
├── prisma/                # Schema & 种子数据
└── tests/                 # Playwright E2E 测试
```

## 数据库 Schema

主要实体：User、Session、Workspace、WorkspaceMember、Project、Task、ActivityLog。

- 权限通过 WorkspaceMember 关联表判断（单一数据源，Workspace 不冗余 ownerId）
- Task 有 `creatorId` 和 `assigneeId`：creator 决定删除权限，assignee 决定状态变更权限
- ActivityLog 使用显式的 `fromStatus` / `toStatus` 字段
- Session 表在服务端存储 session，实现登出失效

## 本地启动

### 前置条件

- Node.js 20+
- pnpm
- Docker（用于本地 PostgreSQL）

### 配置步骤

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/remote-task-board.git
cd remote-task-board

# 2. 安装依赖
pnpm install

# 3. 启动本地 PostgreSQL
docker run -d \
  --name rtb-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=remote_task_board \
  -p 5432:5432 \
  postgres:16

# 4. 复制环境变量
cp .env.example .env

# 5. 生成 Prisma client 并执行迁移
pnpm prisma:generate
pnpm prisma:migrate

# 6. 种子数据
pnpm db:seed

# 7. 启动开发服务器
pnpm dev
```

### 演示账号（种子数据）

| 邮箱 | 密码 | 角色 |
|---|---|---|
| alice@test.com | password123 | OWNER |
| bob@test.com | password123 | MEMBER |

## 运行测试

```bash
pnpm test:e2e          # 无头模式运行 E2E 测试
pnpm test:e2e:ui       # Playwright UI 模式
```

Playwright config 配置了 webServer 自动启动 Next.js。CI 中显式启动应用后再跑测试。

测试覆盖：

| 测试 | 覆盖内容 |
|---|---|
| core-flow | 注册→登录→创建 workspace/project/task→状态变更；空标题被拒 |
| permission | MEMBER 无法删除他人任务；VIEWER 无法创建任务 |
| isolation | 用户 A 无法看到用户 B 的 workspace 数据 |
| task-status | 合法状态转换；非法转换（如 DONE→TODO）被拦截 |

## CI 流程

每次 PR 触发 GitHub Actions：`typecheck → build → seed DB → 启动应用 → Playwright E2E 测试`

CI 使用 PostgreSQL service container，执行迁移和种子数据后，后台启动 Next.js 再跑测试。

## 部署

- **应用：** Vercel（main 分支自动部署）
- **数据库：** Supabase PostgreSQL

## 已知不足

- 活动日志仅记录状态变更，非完整审计追踪
- 权限模型覆盖 OWNER/MEMBER/VIEWER + assignee，适合小团队，不支持企业级组织架构
- 无实时协作 / WebSocket 在线状态
- 未实现评论模块

## 后续可扩展

- 邀请链接
- 邮件通知
- 拖拽看板
- 完整审计日志
- Web3 钱包登录（可选模块）
