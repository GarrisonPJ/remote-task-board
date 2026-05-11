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
import type { TaskDTO } from "@/types/domain";

type Props = {
  task: TaskDTO;
};

export function TaskEditDialog({ task }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Edit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <TaskForm
          projectId={task.projectId}
          task={task}
          onSuccessAction={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
