"use client";

import { useOptimistic } from "react";
import type { TaskDTO } from "@/types/domain";

type OptimisticUpdate = { taskId: string; status: string };

export function useOptimisticTask(tasks: TaskDTO[]) {
  return useOptimistic<TaskDTO[], OptimisticUpdate>(
    tasks,
    (state, { taskId, status }) =>
      state.map((t) =>
        t.id === taskId ? { ...t, status } as TaskDTO : t,
      ),
  );
}
