"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type TaskDeleteButtonProps = {
  taskId: string;
};

export function TaskDeleteButton({ taskId }: TaskDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!json.success) {
        toast.error(json.error?.message ?? "Failed to delete task");
        return;
      }

      toast.success("Task deleted!");
      router.push("/dashboard");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  );
}
