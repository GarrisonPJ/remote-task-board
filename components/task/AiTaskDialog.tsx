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
              {parsing ? "Parsing AI..." : "Parse with AI"}
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
                  <Select value={result.priority} onValueChange={(v) => updateField("priority", v ?? "MEDIUM")}>
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
