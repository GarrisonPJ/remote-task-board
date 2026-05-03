# Remote Task Board：TypeScript 全栈简历项目设计文档

> 目标：设计一个适合计算机本科毕业生完成、能放进简历、能对应 Junior / Intern / 初级全栈 / 前端偏全栈 / 测试开发岗位需求的 TypeScript 全栈项目。  
> 项目不追求炫技，追求“完整、可运行、可部署、可测试、可讲清楚”。

---

## 1. 项目定位

### 1.1 项目名称

推荐名称：

```text
Remote Task Board
```

中文描述：

```text
面向远程协作团队的轻量任务管理系统
```

英文描述：

```text
A lightweight task management platform for remote teams.
```

---

## 2. 为什么做这个项目

这个项目适合本科生，不是因为它“高级”，而是因为它能覆盖企业 Junior 岗位最常见的真实需求：

| 企业需求 | 项目如何体现 |
|---|---|
| 能写 TypeScript | 全项目使用 TypeScript，开启 strict |
| 能做前端页面 | React / Next.js 实现 dashboard、表单、列表、筛选 |
| 能调接口 | 前端调用 REST API / Server Actions |
| 能设计数据库 | PostgreSQL + Prisma 建模 User / Workspace / Project / Task |
| 能做 CRUD | 用户、项目、任务、评论等完整增删改查 |
| 能做权限 | owner / member / viewer 基础 RBAC |
| 能处理真实业务状态 | 任务状态流转、优先级、截止日期、负责人 |
| 能写测试 | Playwright 覆盖登录、创建任务、权限校验 |
| 能用 CI | GitHub Actions 自动 typecheck、build、test |
| 能部署 | Vercel / Railway / Render 上线 demo |
| 能写文档 | README、troubleshooting、API docs |
| 能远程协作 | Issue / PR / Changelog / 英文 README |

这个项目不适合展示：

- 高并发
- 分布式系统
- Kubernetes
- 微服务
- 大规模实时协作
- 复杂支付系统
- 复杂 AI Agent
- 复杂区块链合约

这些不是本科初级求职最短路径。

---

## 3. 适配岗位画像

这个项目主要服务以下岗位：

### 3.1 Junior TypeScript Full-stack Developer

对应能力：

- TypeScript
- React / Next.js
- Node.js API
- PostgreSQL
- Prisma
- Auth
- CRUD
- RBAC
- Deployment

### 3.2 React / Next.js Frontend Developer

对应能力：

- Dashboard 页面
- 表单
- 状态管理
- API 集成
- 错误状态
- Loading 状态
- 响应式布局
- 组件复用

### 3.3 QA Automation / SDET Intern

对应能力：

- Playwright
- E2E 测试
- 登录流程测试
- CRUD 流程测试
- 权限测试
- CI 中跑测试

### 3.4 Developer Support / API Support / Integration Engineer

对应能力：

- API 文档
- 错误码设计
- troubleshooting 文档
- 日志与错误处理
- 本地启动说明
- Postman / curl 示例

### 3.5 Web3 / Solana Frontend 的弱关联加分

不是主线，但可以补一个可选模块：

- Web3 Wallet 登录 demo
- Solana 钱包连接
- 链上地址作为用户身份扩展字段

建议：只作为 side feature，不要让它影响主项目完成。

---

## 4. 项目总体架构

### 4.1 推荐技术路线

建议使用：

```text
Next.js App Router + TypeScript + PostgreSQL + Prisma + 自定义 Session + Playwright + GitHub Actions
```

原因：

- Next.js 同时覆盖前端和后端，适合本科生做全栈项目
- TypeScript 统一前后端类型
- PostgreSQL + Prisma 是常见 SaaS 技术组合
- 自定义 Session 能完整展示认证原理，面试时可讲 bcrypt + cookie + middleware 完整链路
- Playwright 与前端 / 测试开发岗位都匹配
- GitHub Actions 能展示工程化

---

## 5. 系统架构图

```mermaid
flowchart TD
    U[User / Interviewer] --> FE[Next.js Frontend]
    FE --> API[Next.js Route Handlers / Server Actions]
    API --> AUTH[Auth Layer]
    API --> SVC[Service Layer]
    SVC --> PRISMA[Prisma ORM]
    PRISMA --> DB[(PostgreSQL)]
    TEST[Playwright E2E Tests] --> FE
    CI[GitHub Actions CI] --> TYPECHECK[Typecheck]
    CI --> BUILD[Build]
    CI --> TEST
    DEPLOY[Vercel / Railway / Render] --> FE
```

---

## 6. 分层设计

```text
Remote Task Board
├── app/                         # Next.js App Router 页面与 API
│   ├── (auth)/                  # 登录、注册页面
│   ├── dashboard/               # 主工作台
│   ├── workspaces/              # 工作区页面
│   ├── projects/                # 项目页面
│   ├── tasks/                   # 任务页面
│   └── api/                     # Route Handlers
│
├── components/                  # UI 组件
│   ├── ui/                      # 通用基础组件
│   ├── layout/                  # 布局组件
│   ├── workspace/               # 工作区相关组件
│   ├── project/                 # 项目相关组件
│   └── task/                    # 任务相关组件
│
├── lib/                         # 基础设施
│   ├── prisma.ts
│   ├── auth.ts
│   ├── env.ts
│   ├── logger.ts
│   └── errors.ts
│
├── services/                    # 业务逻辑层（直调 Prisma，不单独抽 Repository）
│   ├── workspace.service.ts
│   ├── project.service.ts
│   ├── task.service.ts
│   └── auth.service.ts
│
├── schemas/                     # zod 输入校验
│   ├── auth.schema.ts
│   ├── workspace.schema.ts
│   ├── project.schema.ts
│   └── task.schema.ts
│
├── types/                       # 统一类型定义
│   ├── api.ts
│   ├── domain.ts
│   └── dto.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── tests/
│   ├── auth.spec.ts
│   ├── task.spec.ts
│   ├── permission.spec.ts
│   └── workspace.spec.ts
│
├── docs/
│   ├── api.md
│   ├── troubleshooting.md
│   ├── architecture.md
│   └── decisions.md
│
├── .github/workflows/
│   └── ci.yml
│
├── README.md
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 7. 技术栈设计

| 层 | 技术 | 用途 | 对应企业需求 |
|---|---|---|---|
| Language | TypeScript | 前后端统一类型 | TypeScript 熟练度 |
| Framework | Next.js | 全栈框架 | React / SSR / API |
| UI | Tailwind CSS | 快速构建响应式 UI | 前端交付能力 |
| Component | shadcn/ui | 快速构建响应式 UI | 组件使用能力 |
| Database | PostgreSQL | 关系型数据存储 | SQL / 数据建模 |
| ORM | Prisma | 类型安全数据库访问 | ORM / schema 设计 |
| Auth | 自定义 Session（bcrypt + cookie） | 登录认证 | 认证授权（手写理解深） |
| Validation | zod | 请求参数校验 | 输入校验 / 稳定性 |
| Testing | Playwright | E2E 自动化测试 | QA / SDET 加分 |
| CI | GitHub Actions | 自动检查 | 工程化 |
| Deploy | Vercel + Supabase | 上线 demo | 部署能力 |
| Docs | Markdown | 项目文档 | remote 协作 |

---

## 8. 业务模块设计

### 8.1 Auth 模块

功能：

- 注册（name + email + password，bcrypt 加盐）
- 登录（校验密码，创建 Session）
- 登出（删除 Session）
- 获取当前用户
- Session 校验（middleware 拦截受保护路由）

Session 实现细节：

| 项 | 方案 |
|---|---|
| ID 生成 | `crypto.randomUUID()` |
| 存储 | 数据库 Session 表（userId + expiresAt） |
| Cookie | `httpOnly`, `secure`（生产）, `sameSite: "lax"`, 名 `session_id` |
| 过期 | 7 天，`expiresAt` 字段控制，每次请求不刷新 |
| 登出 | 删除数据库中的 Session 行 + 清除 Cookie |
| Middleware | 保护 `/dashboard`, `/workspaces/*`, `/projects/*`, `/tasks/*`, `/api/*`（auth/register/login 除外） |

企业需求对应：

| 功能 | 企业需求 |
|---|---|
| 登录注册 | 基础认证能力 |
| Session | Web 应用真实业务需要 |
| 当前用户 API | 前后端联调 |
| 输入校验 | 安全意识 |

---

### 8.2 Workspace 模块

功能：

- 创建 workspace
- 查看用户加入的 workspace
- 邀请成员
- 移除成员
- 切换 workspace

企业需求对应：

| 功能 | 企业需求 |
|---|---|
| Workspace | SaaS 多租户思维 |
| 成员管理 | 团队协作业务 |
| 权限判断 | RBAC 基础 |
| 数据隔离 | 企业后台常见需求 |

---

### 8.3 Project 模块

功能：

- 创建项目
- 编辑项目
- 删除项目
- 查看项目列表
- 项目归属于 workspace

企业需求对应：

| 功能 | 企业需求 |
|---|---|
| 项目 CRUD | 后台系统核心能力 |
| 列表页 | 管理系统常见页面 |
| 数据关联 | 数据库关系设计 |
| 权限校验 | 企业业务规则 |

---

### 8.4 Task 模块

功能：

- 创建任务
- 编辑任务
- 删除任务
- 修改任务状态
- 指派负责人
- 设置优先级
- 设置截止日期
- 搜索任务
- 筛选任务
- 分页

企业需求对应：

| 功能 | 企业需求 |
|---|---|
| 任务 CRUD | 最常见业务开发 |
| 状态流转 | 业务状态机基础 |
| 搜索筛选 | 后台系统高频需求 |
| 分页 | 真实数据列表处理 |
| 指派负责人 | 关联关系处理 |
| 优先级 / 截止日期 | 真实产品逻辑 |

#### 状态机规则

```text
TODO → IN_PROGRESS, CANCELED
IN_PROGRESS → IN_REVIEW, CANCELED, TODO
IN_REVIEW → DONE, IN_PROGRESS, CANCELED
DONE → IN_REVIEW（驳回重审）
CANCELED → TODO（重新打开）
```

非法流转示例：DONE 不能直接跳到 TODO，必须先回 IN_REVIEW。
状态校验在 TaskService 中通过转换表实现，不在 Route Handler 层。

---

### 8.5 Comment 模块（MVP 不做）

功能：

- 给任务添加评论
- 删除自己的评论
- 查看任务评论

决策：Comment 模块在 MVP 阶段不做。Task 详情页的填充将由 Activity Log 时间线替代。

---

### 8.6 Activity Log（MVP 做，仅状态变更）

功能：

- 记录任务状态变更（旧状态 → 新状态）
- Task 详情页展示最近 10 条变更时间线

不包含的功能（后续可加）：

- 任务创建/删除记录
- 负责人变更记录
- 项目级活动流

企业需求对应：

| 功能 | 企业需求 |
|---|---|
| 审计日志 | 企业系统常见要求 |
| 可追踪性 | 运维 / 支持 / 协作 |
| 时间线展示 | 前端数据展示 |

---

## 9. 推荐 MVP 范围

### 必做

```text
1. 用户登录 / 注册（自定义 Session）
2. Workspace 创建和列表
3. Project CRUD
4. Task CRUD
5. Task 状态流转（含状态机规则）
6. Task 搜索 / 筛选 / 分页
7. owner / member / viewer 权限（含 assignee 特殊权限）
8. Activity Log（仅状态变更）
9. PostgreSQL + Prisma
10. Playwright E2E 测试（4 条）
11. GitHub Actions CI
12. 线上部署
13. README + troubleshooting
```

### 可选

```text
1. 邀请链接
2. 邮件通知
3. 拖拽看板
4. Web3 钱包登录
```

### 不建议做

```text
1. 实时多人协作
2. WebSocket 在线状态
3. 微服务
4. Kubernetes
5. 支付订阅
6. AI Agent
7. 复杂权限系统
8. 多数据库
```

---

## 10. 数据库设计

### 10.1 ERD

```mermaid
erDiagram
    User ||--o{ WorkspaceMember : joins
    Workspace ||--o{ WorkspaceMember : has
    Workspace ||--o{ Project : contains
    Project ||--o{ Task : contains
    User ||--o{ Task : assigned
    User ||--o{ Task : created
    Task ||--o{ ActivityLog : logs
    User ||--o{ ActivityLog : triggers

    User {
        string id
        string name
        string email
        string passwordHash
        datetime createdAt
        datetime updatedAt
    }

    Workspace {
        string id
        string name
        datetime createdAt
        datetime updatedAt
    }

    WorkspaceMember {
        string id
        string workspaceId
        string userId
        string role
        datetime createdAt
    }

    Project {
        string id
        string workspaceId
        string name
        string description
        datetime createdAt
        datetime updatedAt
    }

    Task {
        string id
        string projectId
        string title
        string description
        string status
        string priority
        string creatorId
        string assigneeId
        datetime dueDate
        datetime createdAt
        datetime updatedAt
    }

    ActivityLog {
        string id
        string taskId
        string actorId
        string action
        string metadata
        datetime createdAt
    }
```

---

## 11. Prisma Schema 示例

```prisma
model User {
  id           String            @id @default(cuid())
  name         String
  email        String            @unique
  passwordHash String
  memberships  WorkspaceMember[]
  assignedTasks Task[]           @relation("TaskAssignee")
  createdTasks  Task[]           @relation("TaskCreator")
  activityLogs ActivityLog[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Workspace {
  id        String            @id @default(cuid())
  name      String
  members   WorkspaceMember[]
  projects  Project[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model WorkspaceMember {
  id          String        @id @default(cuid())
  workspaceId String
  userId      String
  role        WorkspaceRole @default(MEMBER)

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([workspaceId, userId])
}

model Project {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  description String?

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  tasks     Task[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Session {
  id        String   @id
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime

  createdAt DateTime @default(now())

  @@index([userId])
}

model Task {
  id          String       @id @default(cuid())
  projectId   String
  title       String
  description String?
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  assigneeId  String?
  creatorId   String
  dueDate     DateTime?

  project  Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee User?   @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  creator  User    @relation("TaskCreator", fields: [creatorId], references: [id])

  activityLogs ActivityLog[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([creatorId])
  @@index([projectId, status, assigneeId])
}

model ActivityLog {
  id         String     @id @default(cuid())
  taskId     String
  actorId    String
  fromStatus TaskStatus?
  toStatus   TaskStatus

  task  Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  actor User @relation(fields: [actorId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([taskId, createdAt])
}

enum WorkspaceRole {
  OWNER
  MEMBER
  VIEWER
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
  CANCELED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

---

## 12. 统一类型定义

### 12.1 通用 API 响应

```ts
export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginationMeta;
};
```

---

### 12.2 Domain 类型

```ts
export type WorkspaceRole = "OWNER" | "MEMBER" | "VIEWER";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "CANCELED";

export type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export type UserDTO = {
  id: string;
  name: string;
  email: string;
};

export type WorkspaceDTO = {
  id: string;
  name: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
};

export type ProjectDTO = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskDTO = {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  creatorId: string;
  assignee?: UserDTO | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
};
```

---

## 13. 输入类型与 zod Schema

### 13.1 Auth Schema

```ts
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

---

### 13.2 Workspace Schema

```ts
import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(80),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(80),
});

export const addWorkspaceMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["MEMBER", "VIEWER"]).default("MEMBER"),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>;
```

---

### 13.3 Project Schema

```ts
import { z } from "zod";

export const createProjectSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
```

---

### 13.4 Task Schema

```ts
import { z } from "zod";

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELED"]),
});

export const listTasksQuerySchema = z.object({
  projectId: z.string().optional(),
  workspaceId: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
```

> **assignee 校验规则：** `createTask` 和 `updateTask` 中传入的 assigneeId 必须在 Service 层校验：先通过 projectId 找到 workspace，再检查 assigneeId 是否为该 workspace 的 member。防止将任务指派给外部用户导致权限污染。`creatorId` 不从客户端接收，由 `requireUser()` 自动注入。

---

## 14. API 路由设计

数据流边界规则：

| 场景 | 数据获取方式 |
|---|---|
| 页面首屏渲染（dashboard、workspace、project、task list） | Server Component → Service（直调 Prisma） |
| 筛选 / 分页 / 搜索 | URL search params → 触发 Server Component 重新渲染 |
| 写操作（create、update、delete） | Client Component → Route Handler → Service |
| 获取当前用户 / Session 校验 | Server Component 直接调用 auth lib |

以下 GET 端点为 API 文档用途和外部客户端预留，页面首屏不经过它们。筛选/分页/搜索通过 URL search params 触发服务端重新渲染，确保 DTO 一致、缓存自然。

> 这是一个简化设计，不是"两套数据流打架"——读走 Server Components，写走 Route Handlers，边界清晰。

### 14.1 Auth API

| Method | Path | 用途 |
|---|---|---|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/auth/me` | 当前用户 |

### 14.2 Workspace API

| Method | Path | 用途 |
|---|---|---|
| GET | `/api/workspaces` | 获取当前用户加入的 workspace |
| POST | `/api/workspaces` | 创建 workspace |
| GET | `/api/workspaces/:workspaceId` | 获取 workspace 详情 |
| PATCH | `/api/workspaces/:workspaceId` | 修改 workspace |
| DELETE | `/api/workspaces/:workspaceId` | 删除 workspace |
| POST | `/api/workspaces/:workspaceId/members` | 添加成员 |
| DELETE | `/api/workspaces/:workspaceId/members/:memberId` | 移除成员 |

### 14.3 Project API

| Method | Path | 用途 |
|---|---|---|
| GET | `/api/projects?workspaceId=xxx` | 获取项目列表 |
| POST | `/api/projects` | 创建项目 |
| GET | `/api/projects/:projectId` | 获取项目详情 |
| PATCH | `/api/projects/:projectId` | 修改项目 |
| DELETE | `/api/projects/:projectId` | 删除项目 |

### 14.4 Task API

| Method | Path | 用途 |
|---|---|---|
| GET | `/api/tasks?projectId=xxx&status=TODO&q=xxx&page=1` | 获取任务列表 |
| POST | `/api/tasks` | 创建任务 |
| GET | `/api/tasks/:taskId` | 获取任务详情 |
| PATCH | `/api/tasks/:taskId` | 更新任务 |
| PATCH | `/api/tasks/:taskId/status` | 更新任务状态 |
| DELETE | `/api/tasks/:taskId` | 删除任务 |

---

## 15. 服务层接口设计

服务层只处理业务逻辑，不直接关心 HTTP。

### 15.1 AuthService

```ts
export interface AuthService {
  register(input: RegisterInput): Promise<UserDTO>;
  login(input: LoginInput): Promise<{
    user: UserDTO;
    token?: string;
  }>;
  getCurrentUser(userId: string): Promise<UserDTO | null>;
}
```

### 15.2 WorkspaceService

```ts
export interface WorkspaceService {
  createWorkspace(input: CreateWorkspaceInput, actorId: string): Promise<WorkspaceDTO>;

  listMyWorkspaces(actorId: string): Promise<WorkspaceDTO[]>;

  getWorkspaceById(workspaceId: string, actorId: string): Promise<WorkspaceDTO>;

  updateWorkspace(
    workspaceId: string,
    input: UpdateWorkspaceInput,
    actorId: string
  ): Promise<WorkspaceDTO>;

  deleteWorkspace(workspaceId: string, actorId: string): Promise<void>;

  addMember(
    workspaceId: string,
    input: AddWorkspaceMemberInput,
    actorId: string
  ): Promise<void>;

  removeMember(
    workspaceId: string,
    memberId: string,
    actorId: string
  ): Promise<void>;
}
```

### 15.3 ProjectService

```ts
export interface ProjectService {
  createProject(input: CreateProjectInput, actorId: string): Promise<ProjectDTO>;

  listProjects(workspaceId: string, actorId: string): Promise<ProjectDTO[]>;

  getProjectById(projectId: string, actorId: string): Promise<ProjectDTO>;

  updateProject(
    projectId: string,
    input: UpdateProjectInput,
    actorId: string
  ): Promise<ProjectDTO>;

  deleteProject(projectId: string, actorId: string): Promise<void>;
}
```

### 15.4 TaskService

```ts
export interface TaskService {
  createTask(input: CreateTaskInput, actorId: string): Promise<TaskDTO>;

  listTasks(
    query: ListTasksQuery,
    actorId: string
  ): Promise<PaginatedResponse<TaskDTO>>;

  getTaskById(taskId: string, actorId: string): Promise<TaskDTO>;

  updateTask(
    taskId: string,
    input: UpdateTaskInput,
    actorId: string
  ): Promise<TaskDTO>;

  updateTaskStatus(
    taskId: string,
    input: UpdateTaskStatusInput,
    actorId: string
  ): Promise<TaskDTO>;

  deleteTask(taskId: string, actorId: string): Promise<void>;
}
```

---

## 16. 权限设计

### 17.1 角色

| 角色 | 权限 |
|---|---|
| OWNER | 管理 workspace、成员、项目、任务 |
| MEMBER | 创建/编辑任务，查看项目 |
| VIEWER | 只读 |

### 17.2 权限矩阵

| 操作 | OWNER | MEMBER | VIEWER |
|---|---:|---:|---:|
| 查看 workspace | 是 | 是 | 是 |
| 修改 workspace | 是 | 否 | 否 |
| 删除 workspace | 是 | 否 | 否 |
| 添加成员 | 是 | 否 | 否 |
| 删除成员 | 是 | 否 | 否 |
| 创建项目 | 是 | 是 | 否 |
| 修改项目 | 是 | 是 | 否 |
| 删除项目 | 是 | 否 | 否 |
| 创建任务 | 是 | 是 | 否 |
| 修改任务 | 是 | 是 * | 否 |
| 删除任务 | 是 | 仅自己创建的 | 否 |
| 查看任务 | 是 | 是 | 是 |
| 修改任务状态 | 是 | 是（assignee 可改） | 否 |

> *MEMBER 可修改任务标题/描述等字段。任务的 assignee 在修改任务状态上有额外权限。实际权限判断逻辑是「role + 是否任务负责人 + 是否任务创建者」组合。

### 16.3 权限函数定义

```ts
export function canManageWorkspace(role: WorkspaceRole): boolean {
  return role === "OWNER";
}

export function canManageMembers(role: WorkspaceRole): boolean {
  return role === "OWNER";
}

export function canCreateProject(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "MEMBER";
}

export function canDeleteProject(role: WorkspaceRole): boolean {
  return role === "OWNER";
}

export function canCreateTask(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "MEMBER";
}

export function canUpdateTask(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "MEMBER";
}

/**
 * MEMBER 只能删除自己创建的任务。
 * 调用方需传入 task.creatorId 来比较。
 */
export function canDeleteTask(role: WorkspaceRole, creatorId: string, actorId: string): boolean {
  if (role === "OWNER") return true;
  if (role === "MEMBER") return creatorId === actorId;
  return false;
}

/**
 * MEMBER + assignee 可以修改任务状态。
 * 调用方需传入 task.assigneeId 来校验。
 */
export function canUpdateTaskStatus(role: WorkspaceRole, assigneeId: string | null, actorId: string): boolean {
  if (role === "OWNER") return true;
  if (role === "MEMBER" && assigneeId === actorId) return true;
  return false;
}

export function canViewTask(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "MEMBER" || role === "VIEWER";
}
```

---

## 18. API Handler 统一写法

### 18.1 错误类型

```ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode = 400,
    public details?: unknown
  ) {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super("UNAUTHORIZED", "You must be logged in.", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super("FORBIDDEN", "You do not have permission to perform this action.", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super("NOT_FOUND", `${resource} not found.`, 404);
  }
}
```

### 18.2 API Response Helper

```ts
import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function fail(error: AppError | Error) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected server error.",
      },
    },
    { status: 500 }
  );
}
```

### 18.3 Route Handler 示例

```ts
import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { createTaskSchema } from "@/schemas/task.schema";
import { taskService } from "@/services/task.service";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const input = createTaskSchema.parse(body);

    const task = await taskService.createTask(input, user.id);

    return ok(task, 201);
  } catch (error) {
    return fail(error as Error);
  }
}
```

---

## 19. 前端页面设计

### 19.1 页面结构

```text
/
├── /login
├── /register
├── /dashboard
├── /workspaces/:workspaceId
├── /workspaces/:workspaceId/projects/:projectId
└── /tasks/:taskId
```

### 19.2 Dashboard 页面

内容：

- 当前用户信息
- Workspace 列表
- 最近任务
- 最近活动
- 创建 workspace 按钮

对应企业需求：

- Dashboard 页面开发
- Server Components 数据加载
- Loading / error / empty state
- 真实产品页面思维

数据获取方式：Server Components 直调 Service，不经过 REST API。
错误反馈：统一使用 shadcn/ui 的 sonner toast 组件。
分页交互：传统页码按钮（shadcn/ui Pagination），配合筛选条件保持状态同步。

### 19.3 Project 页面

内容：

- 项目信息
- 任务列表
- 搜索框
- 状态筛选
- 优先级筛选
- 分页
- 创建任务按钮

对应企业需求：

- 管理后台
- 表格 / 列表
- 筛选查询
- 表单弹窗
- 前后端联调

### 19.4 Task Detail 页面

内容：

- 任务标题
- 描述
- 状态
- 优先级
- 负责人
- 截止日期
- 状态变更时间线（Activity Log，最近 10 条）

对应企业需求：

- 详情页
- 数据关联展示
- 表单编辑
- 复杂状态处理

---

## 20. 前端组件设计

```text
components/
├── layout/
│   ├── AppShell.tsx
│   ├── Sidebar.tsx
│   └── Header.tsx
│
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Dialog.tsx
│   ├── Badge.tsx
│   └── EmptyState.tsx
│
├── workspace/
│   ├── WorkspaceSwitcher.tsx
│   ├── WorkspaceCard.tsx
│   └── MemberList.tsx
│
├── project/
│   ├── ProjectCard.tsx
│   ├── ProjectForm.tsx
│   └── ProjectList.tsx
│
└── task/
    ├── TaskList.tsx
    ├── TaskCard.tsx
    ├── TaskForm.tsx
    ├── TaskStatusBadge.tsx
    ├── TaskPriorityBadge.tsx
    ├── TaskFilters.tsx
    └── TaskPagination.tsx
```

---

## 21. 前端 API Client 设计

```ts
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error?.message ?? "Request failed");
  }

  return json.data as T;
}
```

### 21.1 Task Client

```ts
export const taskApi = {
  list(query: ListTasksQuery) {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });

    return apiFetch<PaginatedResponse<TaskDTO>>(`/api/tasks?${params}`);
  },

  create(input: CreateTaskInput) {
    return apiFetch<TaskDTO>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update(taskId: string, input: UpdateTaskInput) {
    return apiFetch<TaskDTO>(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  updateStatus(taskId: string, input: UpdateTaskStatusInput) {
    return apiFetch<TaskDTO>(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  remove(taskId: string) {
    return apiFetch<void>(`/api/tasks/${taskId}`, {
      method: "DELETE",
    });
  },
};
```

---

## 22. 模块交互图

### 22.1 创建任务流程

```mermaid
sequenceDiagram
    actor User
    participant UI as TaskForm
    participant API as POST /api/tasks
    participant Auth as requireUser
    participant Service as TaskService
    participant DB as PostgreSQL

    User->>UI: Fill task form
    UI->>API: POST task input
    API->>Auth: Check session
    Auth-->>API: current user
    API->>API: zod validate input
    API->>Service: createTask(input, actorId)
    Service->>Service: check permission (join membership)
    Service->>DB: query membership
    DB-->>Service: role
    Service->>Service: verify role >= MEMBER
    Service->>DB: insert task
    DB-->>Service: task row
    Service-->>API: TaskDTO
    API-->>UI: ApiResponse<TaskDTO>
    UI-->>User: Show new task
```

### 22.2 更新任务状态流程

```mermaid
sequenceDiagram
    actor User
    participant UI as TaskStatusSelect
    participant API as PATCH /api/tasks/:id/status
    participant Service as TaskService
    participant DB as PostgreSQL

    User->>UI: Change status
    UI->>API: PATCH status
    API->>Service: updateTaskStatus(taskId, status, actorId)
    Service->>Service: find task
    Service->>DB: query task
    DB-->>Service: task
    Service->>Service: check permission (role + assignee)
    Service->>Service: validate status transition
    Service->>DB: update task
    Service->>DB: insert activity log
    Service-->>API: updated task
    API-->>UI: ApiResponse<TaskDTO>
```

> **事务要求：** 更新任务状态和写入 Activity Log 必须包裹在同一个 Prisma 事务中（`$transaction`），避免任务更新成功但日志未写入的不一致状态。

### 22.3 CI 流程图

```mermaid
flowchart LR
    PR[Pull Request] --> INSTALL[pnpm install]
    INSTALL --> TYPECHECK[pnpm typecheck]
    TYPECHECK --> LINT[pnpm lint]
    LINT --> BUILD[pnpm build]
    BUILD --> E2E[pnpm test:e2e]
    E2E --> PASS[Mergeable]
```

---

## 23. 测试设计

### 23.1 测试目标

不追求 100% 覆盖率，重点覆盖核心业务路径。

### 23.2 Playwright 测试清单

| 测试文件 | 覆盖内容 |
|---|---|
| `core-flow.spec.ts` | 正向流：注册→登录→创建 workspace→project→task→改状态；输入校验：空 title 被拒 |
| `permission.spec.ts` | member 删除他人项目被拒；viewer 不能创建 task |
| `isolation.spec.ts` | 数据隔离：用户 A 看不到用户 B 的 workspace |
| `task-status.spec.ts` | 状态流转：正向路径 TODO→IN_PROGRESS→IN_REVIEW→DONE；非法流转 DONE→TODO 被拒 |

### 23.3 Auth 测试示例

```ts
import { test, expect } from "@playwright/test";

test("user can register and login", async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText("Dashboard")).toBeVisible();
});
```

### 23.4 Task 测试示例

```ts
import { test, expect } from "@playwright/test";

test("user can create and update a task", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("demo@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();

  await page.goto("/dashboard");

  await page.getByRole("button", { name: "New Task" }).click();
  await page.getByLabel("Title").fill("Prepare remote interview");
  await page.getByLabel("Description").fill("Review project architecture.");
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page.getByText("Prepare remote interview")).toBeVisible();

  await page.getByText("Prepare remote interview").click();
  await page.getByLabel("Status").selectOption("IN_PROGRESS");

  await expect(page.getByText("IN_PROGRESS")).toBeVisible();
});
```

---

## 24. GitHub Actions CI

```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  typecheck-build-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: remote_task_board_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd="pg_isready -U postgres"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/remote_task_board_test
      AUTH_SECRET: test-secret

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install

      - run: pnpm prisma migrate deploy

      - run: pnpm db:seed

      - run: pnpm typecheck

      - run: pnpm build

      - run: pnpm playwright install --with-deps

      - name: Start app & run E2E tests
        run: |
          pnpm start &> /tmp/next.log &
          npx wait-on http://localhost:3000
          pnpm test:e2e
```

---

## 25. 环境变量设计

```env
DATABASE_URL=postgresql://user:password@localhost:5432/remote_task_board
AUTH_SECRET=replace-me
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 26. package.json scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## 27. README 结构建议

```md
# Remote Task Board

A lightweight task management platform for remote teams.

## Demo

- Live demo:
- GitHub repo:

## Tech Stack

- Next.js
- TypeScript
- PostgreSQL
- Prisma
- 自定义 Session
- Playwright
- GitHub Actions

## Features

- Authentication
- Workspace management
- Project management
- Task CRUD
- Task status workflow
- Role-based access control
- Search, filtering and pagination
- E2E testing
- CI pipeline

## Architecture

Include architecture diagram.

## Database Schema

Include ERD.

## Getting Started

## Environment Variables

## Running Tests

## CI

## Troubleshooting

## Known Limitations

## Future Improvements
```

---

## 28. docs/troubleshooting.md 建议内容

````md
# Troubleshooting

## Database connection failed

Check `DATABASE_URL`.

## Prisma client not generated

Run:

```bash
pnpm prisma:generate
```

## Playwright tests fail locally

Run:

```bash
pnpm playwright install
```

## Auth session is missing

Check `AUTH_SECRET` and app URL configuration.
````

---

## 29. 开发里程碑

### Week 1：项目初始化

目标：

- Next.js + TypeScript 初始化
- Tailwind 配置
- Prisma + PostgreSQL 配置
- 基础目录结构
- README 初版

产出：

```text
项目能启动
数据库能连接
Prisma schema 初版
```

### Week 2：Auth + Workspace

目标：

- 注册 / 登录
- 当前用户
- 创建 workspace
- workspace 列表

产出：

```text
用户能登录
能进入 dashboard
能创建 workspace
```

### Week 3：Project + Task CRUD

目标：

- 项目 CRUD
- 任务 CRUD
- 页面联调

产出：

```text
能完整创建项目和任务
能编辑、删除任务
```

### Week 4：搜索 / 筛选 / 分页

目标：

- task q 搜索
- status 筛选
- priority 筛选
- page/pageSize 分页

产出：

```text
任务列表接近真实后台系统
```

### Week 5：权限控制

目标：

- owner/member/viewer
- API 层权限校验
- 前端按钮权限控制

产出：

```text
不同角色权限不同
可在面试中讲 RBAC
```

### Week 6：测试

目标：

- Playwright 配置
- 3-5 条核心 E2E 测试
- 测试数据 seed

产出：

```text
pnpm test:e2e 能跑通
```

### Week 7：CI + 部署

目标：

- GitHub Actions
- Vercel / Railway / Render 部署
- README 补完整

产出：

```text
线上 demo
CI badge
完整文档
```

### Week 8：简历包装

目标：

- 项目截图
- 英文 README
- PR / issue 整理
- 简历 bullet points

产出：

```text
可投递项目
```

---

## 30. 对应企业需求映射

| 项目内容 | 企业岗位要求 | 说明 |
|---|---|---|
| Next.js 页面 | React / Next.js | 前端岗位核心 |
| TypeScript strict | TypeScript | 初级岗位常见要求 |
| Prisma schema | 数据建模 | 全栈岗位加分 |
| PostgreSQL | SQL / 数据库 | 后端 / 全栈基础 |
| Task CRUD | CRUD | 业务开发基础 |
| Search/filter/pagination | 管理后台 | 企业后台高频需求 |
| RBAC | 权限控制 | SaaS / B2B 常见需求 |
| Auth | 登录认证 | Web 应用必备 |
| Playwright | 自动化测试 | QA/SDET 加分 |
| GitHub Actions | CI/CD | 工程化意识 |
| README | 文档能力 | remote / 出海团队加分 |
| troubleshooting | 支持排查 | Developer Support 加分 |
| 部署 demo | 可交付 | 面试展示有说服力 |
| issue/PR | 远程协作 | remote 岗位加分 |

---

## 31. 简历写法

### 31.1 中文简历项目描述

```text
Remote Task Board｜TypeScript 全栈远程协作任务管理系统

使用 Next.js、TypeScript、PostgreSQL 和 Prisma 独立开发轻量级远程任务管理系统，支持用户认证、Workspace、项目管理、任务 CRUD、状态流转、搜索筛选、分页和角色权限控制。使用 Playwright 编写 E2E 测试覆盖登录、任务创建、状态更新和权限校验流程，并配置 GitHub Actions 在 PR 中自动执行 typecheck、build 和测试。项目已部署线上，并提供完整 README、数据库设计和故障排查文档。
```

### 31.2 英文简历项目描述

```text
Remote Task Board | TypeScript Full-stack Task Management App

Built a lightweight task management platform for remote teams using Next.js, TypeScript, PostgreSQL, and Prisma. Implemented authentication, workspace/project management, task CRUD, status workflow, search/filtering, pagination, and role-based access control. Added Playwright E2E tests for authentication, task creation, status updates, and permission checks, and configured GitHub Actions to run type checking, build, and tests on pull requests. Deployed the app with complete documentation, database schema, and troubleshooting guide.
```

### 31.3 简历 bullet points

```text
- Built a full-stack task management app with Next.js, TypeScript, PostgreSQL and Prisma, covering authentication, project management, task CRUD and RBAC.
- Implemented search, filtering and pagination for task lists to simulate real-world SaaS dashboard workflows.
- Added Playwright E2E tests for login, task creation, status updates and permission checks.
- Configured GitHub Actions CI to run typecheck, build and E2E tests on every pull request.
- Deployed the project and documented setup, database schema, testing and troubleshooting steps.
```

---

## 32. 面试讲解结构

面试官问“介绍一下你的项目”，不要流水账。按这个结构讲：

```text
1. 项目背景：为什么做
2. 技术栈：为什么选 Next.js + TS + PostgreSQL
3. 核心功能：workspace / project / task / RBAC
4. 一个技术难点：权限校验或任务筛选分页
5. 工程化：Playwright + GitHub Actions
6. 部署和文档：线上 demo + README
7. 不足和后续改进
```

---

## 33. 项目不足要能主动说明

不要假装项目完美。可以这样说：

```text
目前项目是面向 Junior 求职的 MVP，没有实现大规模实时协作、复杂通知系统和多租户计费。权限模型覆盖 OWNER / MEMBER / VIEWER 三种角色 + assignee 特殊权限，适合小团队场景。后续可以增加邀请链接、邮件通知、评论模块和更细粒度权限控制。
```

这比吹得很大更可信。

---

## 34. 不建议过度实现的内容

| 不建议内容 | 原因 |
|---|---|
| 微服务 | 本科项目过度复杂 |
| Kubernetes | 和目标岗位不直接匹配 |
| Redis 缓存 | 数据量小，必要性低 |
| WebSocket 实时协作 | 难度高，容易拖垮进度 |
| Stripe 支付 | 求职初期收益低 |
| AI Agent | 容易偏题 |
| Solana 合约 | 不是 TS 全栈主线 |
| 复杂拖拽看板 | UI 时间成本高 |

---

## 35. 最终交付清单

完成后应该有：

```text
1. GitHub repo
2. Live demo
3. README.md
4. docs/architecture.md
5. docs/api.md
6. docs/troubleshooting.md
7. Prisma schema
8. Seed data
9. Playwright tests
10. GitHub Actions CI
11. 截图
12. 简历 bullet points
```

---

## 36. 最简 MVP 检查表

```text
[ ] 用户可以注册 / 登录（自定义 Session）
[ ] 用户可以创建 workspace
[ ] 用户可以创建 project
[ ] 用户可以创建 task
[ ] 用户可以编辑 task
[ ] MEMBER 只能删自己创建的 task
[ ] 用户可以修改 task 状态（状态机规则防止非法流转）
[ ] assignee / OWNER 可以改任务状态
[ ] Activity Log 记录每次状态变更
[ ] 用户可以搜索 task
[ ] 用户可以按状态筛选 task
[ ] 用户可以分页查看 task
[ ] OWNER / MEMBER / VIEWER 权限不同
[ ] MEMBER 不能删不属于自己的 task
[ ] VIEWER 不能创建 task
[ ] 用户 A 看不到用户 B 的 workspace
[ ] README 能让别人本地跑起来
[ ] 数据库 schema 清楚
[ ] 有 4 条 Playwright 测试（core-flow / permission / isolation / task-status）
[ ] GitHub Actions 能跑 typecheck/build/test
[ ] 有线上 demo
```

---

## 37. 结论

这个项目的定位不是“技术最炫”，而是：

```text
一个本科生能实际完成、能部署、能测试、能解释、能对应岗位需求的 TypeScript 全栈项目。
```

最核心的竞争力来自：

```text
TypeScript 全栈闭环
+
真实业务模块
+
权限和数据建模
+
测试和 CI
+
文档和部署
```

这比做一个只有前端页面的 Todo App、一个半成品 Web3 Demo，或者一个无法部署的复杂系统更适合初级求职。

---

## 38. 种子数据设计

```text
用户：
  - alice@test.com / password123  — OWNER 角色，通用测试用户
  - bob@test.com / password123    — MEMBER 角色，跨 workspace 成员

Workspace:
  - "Alice's Workspace" (owner: alice)

WorkspaceMember:
  - alice → OWNER
  - bob → MEMBER

Project:
  - "MVP Features" (在 Alice's Workspace 下)

Task:
  - "Set up CI pipeline" → TODO, HIGH, assignee: alice
  - "Write E2E tests" → IN_PROGRESS, MEDIUM, assignee: bob
  - "Fix login bug" → IN_REVIEW, URGENT, assignee: alice
  - "Deploy to production" → DONE, LOW, assignee: alice
```

Playwright 测试直接使用 seed 用户登录，无需每个测试文件重复注册。

---

## 39. 决策日志（Grilling Session 产出）

以下决策在本设计文档的 grilling session 中逐项确认：

### 架构
- 去掉 Repository 层，Service 直调 Prisma
- 去掉 features/ 目录，只用 components/ 按业务域分组
- Workspace 去掉 ownerId，权限判断统一走 WorkspaceMember.role

### 认证
- 自定义 Session（bcrypt + cookie + middleware），不用 Auth.js

### 数据流
- 页面读数据用 Server Components 直调 Service
- 写操作和客户端交互用 Route Handlers
- 搜索范围限 title，大小写 insensitive（mode: insensitive）
- 数据隔离通过三表 join（Task → Project → WorkspaceMember）保证
- 筛选/分页/搜索通过 URL search params 触发的 Server Component 重新渲染实现
- GET 端点为 API 文档用途预留，页面首屏不经过它们

### 权限
- MEMBER 只能删自己创建的任务（Task 模型加 creatorId 字段）
- 加上 assignee 权限：assignee 可改自己任务的状态
- assigneeId 必须在 Service 层校验是否属于同一 workspace 的 member
- MVP 不做项目修改审核流

### 技术选型
- UI 用 shadcn/ui（含 sonner toast 统一错误提示）
- 数据库用 Supabase，应用部署 Vercel，本地开发 Docker PostgreSQL

### Schema 与模型
- Task 表加 creatorId + @@index([creatorId])
- 去掉 Comment 表（ERD 和 Prisma Schema 同步移除，保持文档与代码一致）
- 添加 Session 表用于自定义登录态管理（httpOnly cookie, sameSite: lax, 7天过期）
- ActivityLog 改用显式的 fromStatus / toStatus 字段，取代通用 action + metadata

### 事务
- 状态更新（update task + insert activity log）必须在 Prisma $transaction 内完成

### CI
- Playwright 测试需要先启动 Next.js app（Playwright config 配 webServer 或 CI 中用 wait-on）
- CI 中先 pnpm build → pnpm start & → wait-on → pnpm test:e2e

### 功能范围
- Comment 模块不做
- Activity Log 做但只录状态变更（不录创建/删除/指派变更）
- 分页用传统页码按钮（shadcn/ui Pagination）
- 筛选 + 分页状态同步

### 测试（4 条 E2E）
1. 正向流程 + 输入校验
2. 权限拦截（member 删他人项目被拒 + viewer 不能创建 task）
3. 数据隔离（用户 A 看不到用户 B 的 workspace）
4. 状态流转 + 非法流转拦截

### 文档
- README 正文用英文，docs/ 用中文
- README 提供中英文两份（README.md / README.zh-CN.md）

### 时间规划
- 8 周，每天 3-4h，不需要砍项预案
- 自定义 Auth 放在 Week 1-2 优先完成

### 定音点
- 面试主推权限系统（RBAC + assignee）
- 备胎方向：测试方法论（4 条分别覆盖功能/权限/隔离/规则）

