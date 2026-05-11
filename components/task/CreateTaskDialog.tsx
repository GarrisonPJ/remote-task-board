"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskForm } from "@/components/task/TaskForm";

type Props = {
  projectId: string;
  workspaceId?: string;
};

export function CreateTaskDialog({ projectId, workspaceId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        + New Task
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <TaskForm projectId={projectId} workspaceId={workspaceId} onSuccessAction={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
