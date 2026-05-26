"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { canUpdateTaskPriority } from "@/lib/constants";
import type { WorkspaceRole } from "@/lib/constants";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

type Props = {
  taskId: string;
  currentPriority: string;
  userRole: WorkspaceRole;
};

export function TaskPriorityControl({ taskId, currentPriority, userRole }: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const priorityMutation = useMutation({
    mutationFn: async (newPriority: string) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to update priority");
      return json.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      router.refresh();
    },
    onSuccess: () => {
      toast.success("Priority updated");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    }
  });

  if (!canUpdateTaskPriority(userRole)) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm text-muted-foreground">
        Move to:
      </span>
      {PRIORITIES.map((p) => {
        if (p === currentPriority) return null;
        return (
          <Button
            key={p}
            variant={p === "URGENT" ? "destructive" : "outline"}
            size="sm"
            disabled={priorityMutation.isPending}
            onClick={() => priorityMutation.mutate(p)}
          >
            {p}
          </Button>
        );
      })}
    </div>
  );
}
