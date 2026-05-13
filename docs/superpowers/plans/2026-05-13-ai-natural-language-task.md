# AI Natural Language Task Creation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) to implement this plan task-by-task.

**Goal:** Let users type natural language to create tasks, parsed by DeepSeek API with preview-confirm UX.

**Architecture:** Pure additive — 4 new files, zero changes to existing code. DeepSeek via OpenAI SDK.

**Tech Stack:** openai SDK (DeepSeek endpoint), zod, existing TaskForm/TaskDialog patterns.

---

### Task 1: Install dependency + add env var

**Files:**
- Modify: `package.json`
- Modify: `lib/env.ts`

- [ ] **Step 1: Install openai SDK**

```bash
pnpm add openai
```

- [ ] **Step 2: Add DEEPSEEK_API_KEY to env**

In `lib/env.ts`, add after `DATABASE_URL`:
```typescript
DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ?? "",
```

Verify:
```bash
pnpm typecheck
```

- [ ] **Commit**

```bash
git add -A && git commit -m "chore: add openai SDK, DEEPSEEK_API_KEY env var"
```

---

### Task 2: Create ai.schema.ts

**Files:**
- Create: `schemas/ai.schema.ts`

```typescript
import { z } from "zod";

export const parseTaskSchema = z.object({
  text: z.string().min(1).max(500),
  projectId: z.string().min(1),
});

export type ParseTaskInput = z.infer<typeof parseTaskSchema>;

export const taskParseResultSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional().nullable(),
});
```

- [ ] **Verify**

```bash
pnpm typecheck
```

- [ ] **Commit**

```bash
git add schemas/ai.schema.ts && git commit -m "feat: add AI task parsing zod schemas"
```

---

### Task 3: Create lib/ai.ts

**Files:**
- Create: `lib/ai.ts`

```typescript
import OpenAI from "openai";
import { env } from "./env";
import type { ParseTaskInput } from "@/schemas/ai.schema";

const SYSTEM_PROMPT = `You are a task parser. Extract structured task fields from natural language descriptions.
Return ONLY valid JSON, no other text.

{
  "title": "concise task title (required, max 200 chars)",
  "description": "longer description if the user provided details (nullable)",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "dueDate": "ISO date string (YYYY-MM-DD) if a date or deadline is mentioned (nullable)"
}

Rules:
- title is required
- Infer priority from urgency words: "urgent"/"ASAP" → URGENT, "high priority" → HIGH, "low priority" → LOW
- If no priority mentioned, default to MEDIUM
- "next Friday" → compute the actual upcoming Friday's date
- "tomorrow" → tomorrow's date
- "next week" → date 7 days from today
- "by <date>" → parse that date
- If no date mentioned, dueDate is null
- Only output the JSON object, nothing else.`;

export async function parseTask(text: string): Promise<{
  title: string;
  description?: string | null;
  priority: string;
  dueDate?: string | null;
}> {
  if (!env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const client = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: env.DEEPSEEK_API_KEY,
  });

  const response = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from AI");

  return JSON.parse(content);
}
```

- [ ] **Verify**

```bash
pnpm typecheck
```

- [ ] **Commit**

```bash
git add lib/ai.ts && git commit -m "feat: add DeepSeek AI client for task parsing"
```

---

### Task 4: Create Route Handler

**Files:**
- Create: `app/api/ai/parse-task/route.ts`

```typescript
import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { parseTaskSchema, taskParseResultSchema } from "@/schemas/ai.schema";
import { parseTask } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json();
    const input = parseTaskSchema.parse(body);
    const result = await parseTask(input.text);
    const validated = taskParseResultSchema.parse(result);
    return ok(validated);
  } catch (error) {
    return fail(error as Error);
  }
}
```

- [ ] **Verify**

```bash
pnpm typecheck
```

- [ ] **Commit**

```bash
git add app/api/ai/ && git commit -m "feat: add /api/ai/parse-task route handler"
```

---

### Task 5: Create AiTaskDialog component

**Files:**
- Create: `components/task/AiTaskDialog.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  projectId: string;
};

type ParsedResult = {
  title: string;
  description?: string | null;
  priority: string;
  dueDate?: string | null;
};

export function AiTaskDialog({ projectId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleParse() {
    if (!text.trim()) return;
    setParsing(true);
    setErrors({});
    try {
      const res = await fetch("/api/ai/parse-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), projectId }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Failed to parse");
        return;
      }
      setResult(json.data);
    } catch {
      toast.error("AI parsing failed. Use manual form instead.");
    } finally {
      setParsing(false);
    }
  }

  async function handleCreate() {
    if (!result) return;
    if (!result.title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: result.title,
          description: result.description || undefined,
          priority: result.priority,
          dueDate: result.dueDate || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Failed to create task");
        return;
      }
      toast.success("Task created!");
      setOpen(false);
      setText("");
      setResult(null);
      router.refresh();
    } catch {
      toast.error("Network error.");
    } finally {
      setCreating(false);
    }
  }

  function updateField(field: keyof ParsedResult, value: string) {
    if (!result) return;
    setResult({ ...result, [field]: value });
    if (errors[field]) {
      const next = { ...errors };
      delete next[field];
      setErrors(next);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setText(""); setResult(null); } }}>
      <DialogTrigger render={<Button variant="outline">AI Create</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Task Creator</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Describe the task in natural language, for example:
              <br />
              <em>"fix login timeout bug, high priority, due next Friday"</em>
            </p>
            <textarea
              className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Describe your task..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleParse();
              }}
            />
            <Button onClick={handleParse} disabled={parsing || !text.trim()} className="w-full">
              {parsing ? "Parsing..." : "Parse with AI"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-md border bg-secondary/30">
              <p className="text-xs text-muted-foreground mb-2">AI parsed result — you can edit before creating:</p>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={result.title}
                    onChange={(e) => updateField("title", e.target.value)}
                  />
                  {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={result.description ?? ""}
                    onChange={(e) => updateField("description", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={result.priority} onValueChange={(v) => updateField("priority", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={result.dueDate ?? ""}
                    onChange={(e) => updateField("dueDate", e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setResult(null)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleCreate} disabled={creating} className="flex-1">
                {creating ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Verify**

```bash
pnpm typecheck
```

- [ ] **Commit**

```bash
git add components/task/AiTaskDialog.tsx && git commit -m "feat: add AI natural language task dialog"
```

---

### Task 6: Wire AiTaskDialog into project detail page

**Files:**
- Modify: `app/(app)/projects/[projectId]/page.tsx`

Add import:
```typescript
import { AiTaskDialog } from "@/components/task/AiTaskDialog";
```

Replace the CreateTaskDialog line:
```typescript
{userRole !== "VIEWER" && <CreateTaskDialog projectId={projectId} workspaceId={project.workspaceId} />}
```

With:
```typescript
{userRole !== "VIEWER" && (
  <div className="flex gap-2">
    <CreateTaskDialog projectId={projectId} workspaceId={project.workspaceId} />
    <AiTaskDialog projectId={projectId} />
  </div>
)}
```

- [ ] **Verify**

```bash
pnpm typecheck && pnpm build
```

- [ ] **Commit**

```bash
git add -A && git commit -m "feat: wire AI task dialog into project detail page"
```

---

### Task 7: Final verification

- [ ] **Run full test suite**

```bash
pnpm typecheck
pnpm test:unit
pnpm build
```

Expected: all pass.
