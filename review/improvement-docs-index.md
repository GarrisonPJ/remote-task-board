# Remote Task Board — 改进文档总索引

> 综合运用 Superpowers skills 生成的全套改进文档，覆盖架构分析、领域建模、产品需求、工程实施拆解。

---

## 📄 文档清单

| # | 文档 | 运用的 Skill | 用途 |
|---|------|-------------|------|
| 1 | [Architecture Review (HTML)](file:///C:/Users/Garry/.gemini/antigravity/brain/58d82eef-bb76-4e80-9765-17f93c24539f/architecture-review.html) | `/improve-codebase-architecture` | 可视化架构分析报告，5 个 deepening 候选方案 + before/after 图 |
| 2 | [PRD: Resume-Grade Improvements](file:///C:/Users/Garry/.gemini/antigravity/brain/58d82eef-bb76-4e80-9765-17f93c24539f/prd-resume-improvements.md) | `/to-prd` | 产品需求文档，25 条 User Stories + 实现决策 + 测试决策 |
| 3 | [Issues Breakdown](file:///C:/Users/Garry/.gemini/antigravity/brain/58d82eef-bb76-4e80-9765-17f93c24539f/issues-breakdown.md) | `/to-issues` | 10 个垂直切片 Issue，依赖图 + 4 波执行节奏 |
| 4 | [Architecture Decision Records](file:///C:/Users/Garry/.gemini/antigravity/brain/58d82eef-bb76-4e80-9765-17f93c24539f/architecture-decision-records.md) | `/grill-with-docs` | 3 个 ADR：Server Actions、Soketi、Last-Write-Wins |
| 5 | [CONTEXT.md Updates](file:///C:/Users/Garry/.gemini/antigravity/brain/58d82eef-bb76-4e80-9765-17f93c24539f/context-md-updates.md) | `/grill-with-docs` | 领域词汇表更新，新增 5 个术语 + 修正 2 个术语 + 新对话示例 |
| 6 | [Resume Project Review](file:///C:/Users/Garry/.gemini/antigravity/brain/58d82eef-bb76-4e80-9765-17f93c24539f/resume_project_review.md) | — (初始分析) | 简历竞争力评估 + 面试追问预判 |

---

## 🔗 Skills 运用说明

### `/using-superpowers`
作为入口 skill，确保在任何行动前先检查并调用相关 skills。本次综合运用了以下 skills：

### `/improve-codebase-architecture`
**产出**: [architecture-review.html](file:///C:/Users/Garry/.gemini/antigravity/brain/58d82eef-bb76-4e80-9765-17f93c24539f/architecture-review.html)

使用 LANGUAGE.md 定义的架构词汇（Module、Interface、Depth、Seam、Adapter、Leverage、Locality）分析项目，识别了 5 个 deepening 候选：
1. **Task mutation pipeline** — `Strong` 推荐，合并 4 个重复的 auth→validate→persist→broadcast 模式
2. **Sync Event module** — `Strong` 推荐，提取 WebSocket 连接管理，两个 adapter 验证了 seam 的存在
3. **Authorization Policy** — `Worth exploring`，将内联的 role 检查提取为声明式策略
4. **Board module concerns** — `Worth exploring`，通过内部 seam（hooks）分离关注点
5. **Error resilience** — `Strong` 推荐，建立三层防御体系

### `/grill-with-docs`
**产出**: [ADRs](file:///C:/Users/Garry/.gemini/antigravity/brain/58d82eef-bb76-4e80-9765-17f93c24539f/architecture-decision-records.md) + [CONTEXT.md 更新](file:///C:/Users/Garry/.gemini/antigravity/brain/58d82eef-bb76-4e80-9765-17f93c24539f/context-md-updates.md)

在设计决策结晶过程中同步更新文档：
- 当新概念出现（Creator, Viewer, Connection State, Activity Log, Authorization Policy）时，立即更新 CONTEXT.md
- 当决策满足 ADR 三条件（难逆转 + 未来读者会困惑 + 真实权衡）时，创建 ADR
- 发现术语冲突时纠正：**Role** 定义需要扩展以包含 VIEWER

### `/to-prd`
**产出**: [PRD](file:///C:/Users/Garry/.gemini/antigravity/brain/58d82eef-bb76-4e80-9765-17f93c24539f/prd-resume-improvements.md)

综合对话上下文和代码分析，产出 PRD 而非访谈用户。识别了需要构建或修改的主要 module，寻找可独立测试的 deep module 提取机会。使用 CONTEXT.md 词汇贯穿全文。

### `/to-issues`
**产出**: [Issues Breakdown](file:///C:/Users/Garry/.gemini/antigravity/brain/58d82eef-bb76-4e80-9765-17f93c24539f/issues-breakdown.md)

将 PRD 拆解为 10 个 **tracer bullet** 垂直切片（不是水平切片）。每个 Issue 切穿所有集成层（schema → service → component → test）。分为 AFK（可自主完成）和 HITL（需人工确认）两类。提供依赖图和 4 波执行计划。

---

## 📋 推荐阅读顺序

1. **先看** [Architecture Review HTML](file:///C:/Users/Garry/.gemini/antigravity/brain/58d82eef-bb76-4e80-9765-17f93c24539f/architecture-review.html) — 可视化理解当前架构的问题
2. **再看** [CONTEXT.md Updates](file:///C:/Users/Garry/.gemini/antigravity/brain/58d82eef-bb76-4e80-9765-17f93c24539f/context-md-updates.md) — 统一领域语言
3. **然后** [PRD](file:///C:/Users/Garry/.gemini/antigravity/brain/58d82eef-bb76-4e80-9765-17f93c24539f/prd-resume-improvements.md) — 了解完整改进方案
4. **接着** [Issues Breakdown](file:///C:/Users/Garry/.gemini/antigravity/brain/58d82eef-bb76-4e80-9765-17f93c24539f/issues-breakdown.md) — 具体执行计划
5. **最后** [ADRs](file:///C:/Users/Garry/.gemini/antigravity/brain/58d82eef-bb76-4e80-9765-17f93c24539f/architecture-decision-records.md) — 记录技术决策

---

## 🚀 下一步行动

> [!IMPORTANT]
> 所有文档均为规划性质，**没有修改任何源代码**。下一步需要你：

1. **Review 各文档**，确认方向是否符合预期
2. **在 Issues Breakdown 中选择起始 Issue**（推荐从 Wave 1 的 #1, #2, #4, #10 开始）
3. **确认后我可以开始执行代码修改** — 将 ADRs 写入 `docs/adr/`，更新 `CONTEXT.md`，然后按 Issue 顺序实现
