"use client";

import { useState, useEffect } from "react";
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
import type { TaskDTO, TaskPriority } from "@/types/domain";

type TaskFormProps = {
  projectId: string;
  task?: TaskDTO;
  workspaceId?: string;
  onSuccessAction?: () => void;
};

type MemberOption = { id: string; name: string; email: string };

export function TaskForm({ projectId, task, workspaceId, onSuccessAction }: TaskFormProps) {
  const router = useRouter();
  const isEdit = !!task;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string>(task?.assignee?.id ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? "");
  const [members, setMembers] = useState<MemberOption[]>([]);

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/workspaces/${workspaceId}/members`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setMembers(json.data.map((m: { user: MemberOption }) => m.user));
      })
      .catch(() => {});
  }, [workspaceId]);

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const input: CreateTaskInput = {
        projectId,
        title,
        description: description || undefined,
        priority,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
      };

      const url = isEdit ? `/api/tasks/${task.id}` : "/api/tasks";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const json = await res.json();

      if (!json.success) {
        const failMsg = isEdit ? "Failed to update task" : "Failed to create task";
        toast.error(json.error?.message ?? failMsg);
        return;
      }

      toast.success(isEdit ? "Task updated!" : "Task created!");

      if (!isEdit) {
        setTitle("");
        setDescription("");
        setPriority("MEDIUM");
      }

      onSuccessAction?.();
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Title *</label>
        <Input
          required
          placeholder="Enter task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Input
          placeholder="Enter description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Priority</label>
        <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
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

      {members.length > 0 && (
        <div>
          <label className="text-sm font-medium">Assignee</label>
          <Select value={assigneeId} onValueChange={(v) => setAssigneeId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Due Date</label>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting
          ? (isEdit ? "Updating..." : "Creating...")
          : (isEdit ? "Update Task" : "Create Task")}
      </Button>
    </form>
  );
}
