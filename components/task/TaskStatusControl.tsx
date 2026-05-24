"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { VALID_TRANSITIONS, canUpdateTaskStatus } from "@/lib/constants";
import type { WorkspaceRole, TaskStatus } from "@/lib/constants";

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

export function TaskStatusControl({ taskId, currentStatus, userId, assigneeId, userRole }: Props) {
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to update status");
      return json.data;
    },
    onSuccess: (_data, newStatus) => {
      toast.success(`Status changed to ${STATUS_LABELS[newStatus]}`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  if (!canUpdateTaskStatus(userRole, assigneeId, userId)) return null;

  const targets = VALID_TRANSITIONS[currentStatus as TaskStatus];
  if (!targets || targets.length === 0) return null;

  async function handleChange(newStatus: string) {
    statusMutation.mutate(newStatus);
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm text-muted-foreground">
        Move to:
      </span>
      {targets.map((target) => (
        <Button
          key={target}
          variant={target === "CANCELED" ? "destructive" : "default"}
          size="sm"
          disabled={statusMutation.isPending}
          onClick={() => handleChange(target)}
        >
          {statusMutation.isPending && statusMutation.variables === target ? <><Spinner className="h-3.5 w-3.5" /> {STATUS_LABELS[target]}</> : STATUS_LABELS[target]}
        </Button>
      ))}
    </div>
  );
}
