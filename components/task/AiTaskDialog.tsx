"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Check, Undo2 } from "lucide-react";
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

function toDateInputValue(value: string | null | undefined): string | null {
  return value ? value.slice(0, 10) : null;
}

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
      setResult({
        ...json.data,
        dueDate: toDateInputValue(json.data.dueDate),
      });
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
      <DialogTrigger
        render={
          <Button variant="outline" className="gap-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Create
          </Button>
        }
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Task Creator
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Describe the task in natural language. The AI will parse the details automatically.
              <span className="block mt-2 text-xs text-muted-foreground/60">
                Example: <em>"fix login timeout bug, high priority, due next Friday"</em>
              </span>
            </p>

            <div className="relative">
              <textarea
                className="w-full min-h-[100px] rounded-lg border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all resize-none"
                placeholder="Describe your task..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleParse();
                }}
                autoFocus
              />
              <div className="absolute bottom-2 right-2">
                <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  ⌘↵
                </kbd>
              </div>
            </div>

            <Button
              onClick={handleParse}
              disabled={parsing || !text.trim()}
              className="w-full gap-2"
            >
              {parsing ? (
                <>
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Parsing with AI...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  Parse with AI
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <Check className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">
                AI parsed result — review and edit below before creating
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={result.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="mt-1"
                />
                {errors.title && (
                  <p className="text-xs text-destructive mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={result.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="No description parsed"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={result.priority} onValueChange={(v) => updateField("priority", v ?? "MEDIUM")}>
                    <SelectTrigger className="mt-1 min-w-[130px]"><SelectValue /></SelectTrigger>
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
                    className="mt-1 accent-primary [color-scheme:light]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setResult(null)} className="flex-1 gap-2">
                <Undo2 className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleCreate} disabled={creating} className="flex-1 gap-2">
                {creating ? "Creating..." : (
                  <>
                    <Check className="h-4 w-4" />
                    Create Task
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
