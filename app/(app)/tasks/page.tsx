import { Suspense } from "react";
import { TaskListContent } from "@/components/task/TaskListContent";
import { TaskTableSkeleton } from "@/components/task/TaskTableSkeleton";

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="space-y-8"><TaskTableSkeleton /></div>}>
      <TaskListContent />
    </Suspense>
  );
}
