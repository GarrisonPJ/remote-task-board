## Agent skills

### Issue tracker

Issues and PRDs live as GitHub issues, managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the default label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: one `CONTEXT.md` at the repo root + `docs/adr/` for architecture decisions. See `docs/agents/domain.md`.

## Tool invocation reporting

When the following tools/skills are used during a task, append a one-line note at the end of your output to make the invocation explicit:

- **Context7 MCP** → `[调用了 Context7 查询文档]`
- **Playwright** → `[使用了 Playwright 浏览器工具]`
- **Frontend Design skill** → `[调用了 Frontend Design]`
- **CronCreate / CronDelete / CronList** → `[设置了定时任务]`
- **WebSearch** → `[执行了 Web 搜索]`
- **其他 MCP** → 按 `[调用了 <名称>]` 格式类推

例外：当 `caveman` skill 激活时，以 caveman 的精简规则为准，不强制输出此报告。
