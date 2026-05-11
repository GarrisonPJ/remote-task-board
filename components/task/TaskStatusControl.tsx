"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { WorkspaceRole } from "@/types/domain";

const VALID_TRANSITIONS: Record<string, string[]> = {
  TODO: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["IN_REVIEW", "CANCELED", "TODO"],
  IN_REVIEW: ["DONE", "IN_PROGRESS", "CANCELED"],
  DONE: ["IN_REVIEW"],
  CANCELED: ["TODO"],
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  CANCELED: "Canceled",
};

type Props = {
  taskId: string;
  currentStatus: string;
  userId: string;
  assigneeId: string | null;
  userRole: WorkspaceRole;
};

function canChangeStatus(role: WorkspaceRole, assigneeId: string | null, userId: string): boolean {
  if (role === "OWNER") return true;
  if (role === "MEMBER") return assigneeId === userId;
  return false;
}

export function TaskStatusControl({ taskId, currentStatus, userId, assigneeId, userRole }: Props) {
  const router = useRouter();
  const [changing, setChanging] = useState<string | null>(null);

  if (!canChangeStatus(userRole, assigneeId, userId)) return null;

  const targets = VALID_TRANSITIONS[currentStatus];
  if (!targets || targets.length === 0) return null;

  async function handleChange(newStatus: string) {
    setChanging(newStatus);
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Failed to update status");
        return;
      }
      toast.success(`Status changed to ${STATUS_LABELS[newStatus]}`);
      router.refresh();
    } catch {
      toast.error("Network error.");
    } finally {
      setChanging(null);
    }
  }

  return (
    <div className="flex gap-2 items-center p-3 rounded-lg bg-secondary/50 border">
      <span className="text-sm text-muted-foreground">
        Move to:
      </span>
      {targets.map((target) => (
        <Button
          key={target}
          variant={target === "CANCELED" ? "destructive" : "default"}
          size="sm"
          disabled={changing !== null}
          onClick={() => handleChange(target)}
        >
          {changing === target ? "..." : STATUS_LABELS[target]}
        </Button>
      ))}
    </div>
  );
}
