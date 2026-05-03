/**
 * TaskForm — 创建/编辑任务表单（Client Component）
 *
 * "use client" 模式：
 * - 使用 useState 管理表单字段状态
 * - 提交时调用 fetch("/api/tasks", { method: "POST", body })
 * - 用 try/catch + sonner toast 处理错误
 * - 提交中显示 loading 状态，防止重复提交
 *
 * 你参考文档：
 *   - Next.js → Client Components → Event handlers
 *   - shadcn/ui → Dialog（弹窗表单）, Input, Select, Button
 *   - sonner → toast（错误提示）
 *
 * 表单提交模式：
 *   1. e.preventDefault() — 阻止默认表单提交
 *   2. setIsSubmitting(true) — 显示 loading
 *   3. fetch + JSON.stringify
 *   4. 检查 res.ok，不 ok 时解析错误信息 → toast.error()
 *   5. 成功后 onSuccess() 回调（关闭弹窗 + 刷新列表）
 *   6. finally → setIsSubmitting(false)
 */

"use client";

import { useState, type FormEvent } from "react";
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
import type { CreateTaskInput } from "@/schemas/task.schema";

type TaskFormProps = {
  projectId: string;
  onSuccess?: () => void;
};

export function TaskForm({ projectId, onSuccess }: TaskFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TODO: 用 useState 管理 title, description, priority, assigneeId, dueDate 字段
  // 参考：
  //   const [title, setTitle] = useState("");
  //   const [priority, setPriority] = useState<TaskPriority>("MEDIUM");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: 构造 CreateTaskInput 对象，调用 POST /api/tasks
    // const input: CreateTaskInput = {
    //   projectId,
    //   title,
    //   description: description || undefined,
    //   priority,
    //   assigneeId: assigneeId || null,
    //   dueDate: dueDate || null,
    // };
    //
    // try {
    //   const res = await fetch("/api/tasks", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(input),
    //   });
    //
    //   const json = await res.json();
    //
    //   if (!json.success) {
    //     toast.error(json.error?.message ?? "Failed to create task");
    //     return;
    //   }
    //
    //   toast.success("Task created!");
    //   onSuccess?.();
    //   router.refresh(); // 刷新 Server Component 数据
    // } catch {
    //   toast.error("Network error. Please try again.");
    // } finally {
    //   setIsSubmitting(false);
    // }

    // 临时占位 — 提示用户实现
    toast.info("TaskForm submit — implement the fetch logic above");
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Title *</label>
        <Input
          required
          placeholder="Enter task title"
          // value={title}
          // onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Input
          placeholder="Enter description (optional)"
          // value={description}
          // onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Priority</label>
        <Select defaultValue="MEDIUM">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TODO: 添加 assignee 选择器 + dueDate 日期选择器 */}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating..." : "Create Task"}
      </Button>
    </form>
  );
}
