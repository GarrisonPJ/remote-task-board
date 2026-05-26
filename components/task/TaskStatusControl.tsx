"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { VALID_TRANSITIONS, canUpdateTaskStatus, STATUS_LABELS } from "@/lib/constants";
import type { WorkspaceRole, TaskStatus } from "@/lib/constants";

type Props = {
  taskId: string;
  currentStatus: string;
  userId: string;
  assigneeId: string | null;
  userRole: WorkspaceRole;
};

export function TaskStatusControl({ taskId, currentStatus, userId, assigneeId, userRole }: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();

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
    onMutate: async (newStatus) => {
      // Cancel outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot previous data for rollback
      const previousQueries = queryClient.getQueriesData({ queryKey: ["tasks"] });

      // Optimistically update all task list caches
      queryClient.setQueriesData({ queryKey: ["tasks"] }, (old: unknown) => {
        if (!old || typeof old !== "object") return old;

        // Handle PaginatedResponse shape: { items: TaskDTO[], meta: ... }
        if ("items" in old && Array.isArray((old as Record<string, unknown>).items)) {
          return {
            ...old,
            items: (old as { items: Array<Record<string, unknown>> }).items.map((t) =>
              t.id === taskId ? { ...t, status: newStatus } : t,
            ),
          };
        }

        return old;
      });

      return { previousQueries };
    },
    onError: (err: Error, _newStatus, context) => {
      // Rollback on failure
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(err.message);
    },
    onSettled: () => {
      // Refetch to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      router.refresh();
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
          {STATUS_LABELS[target]}
        </Button>
      ))}
    </div>
  );
}
