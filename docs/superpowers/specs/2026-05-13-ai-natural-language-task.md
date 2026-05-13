# AI Natural Language Task Creation

**Date:** 2026-05-13
**Status:** Design approved

## Overview

Allow users to create tasks via natural language input. AI parses the text into structured fields, user previews and confirms, then task is created via existing API.

## Architecture

Pure additive — zero changes to existing TaskForm, service layer, or task API.

```
User → AiTaskDialog (textarea) → POST /api/ai/parse-task → DeepSeek API
    → structured fields → preview + confirm → POST /api/tasks (existing)
```

## New Files

| File | Purpose |
|------|---------|
| `lib/ai.ts` | DeepSeek client (OpenAI SDK @ `api.deepseek.com`), `parseTask()` function |
| `app/api/ai/parse-task/route.ts` | Route Handler: receives `{ text }`, returns structured task fields |
| `components/task/AiTaskDialog.tsx` | Client component: textarea → parse → preview → confirm |
| `schemas/ai.schema.ts` | Zod: input (`{ text }`) and output (`{ title, priority, ... }`) |

## Design Decisions

- **Provider**: DeepSeek via OpenAI SDK (`api.deepseek.com/v1/chat/completions`)
- **Model**: `deepseek-chat`
- **Response format**: `response_format: { type: "json_object" }`, temperature 0.1
- **UX**: Preview-confirm (AI parses → user reviews → user clicks create)
- **Fallback**: All AI errors fall through to manual form, never block the user
- **DEEPSEEK_API_KEY**: Required env var. If unset, AI button doesn't render.

## Error Handling

| Failure | Behavior |
|---------|----------|
| API key missing | AI button hidden in UI |
| API timeout/fail | Toast "AI parsing failed, use manual form" |
| JSON parse fail | Toast "Could not understand. Try rephrasing." |
| Invalid result | Zod validation on AI output; reject with toast if malformed |

## Verification

- `pnpm typecheck` — zero errors
- `pnpm build` — success
- Manual: type natural language → see parsed result → confirm → task created
