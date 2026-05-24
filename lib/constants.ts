export type WorkspaceRole = "OWNER" | "MEMBER" | "VIEWER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELED";

/** Allowed state transitions for tasks. Key = current status, value = valid targets. */
export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["IN_REVIEW", "CANCELED", "TODO"],
  IN_REVIEW: ["DONE", "IN_PROGRESS", "CANCELED"],
  DONE: ["IN_REVIEW"],
  CANCELED: ["TODO"],
};

export function canCreateTask(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "MEMBER";
}

export function canUpdateTask(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "MEMBER";
}

/**
 * OWNER can delete any task; MEMBER can only delete tasks they created.
 */
export function canDeleteTask(role: WorkspaceRole, creatorId: string, actorId: string): boolean {
  if (role === "OWNER") return true;
  if (role === "MEMBER") return creatorId === actorId;
  return false;
}

/**
 * OWNER can always update status; MEMBER can only update if they are the assignee.
 */
export function canUpdateTaskStatus(
  role: WorkspaceRole,
  assigneeId: string | null,
  actorId: string
): boolean {
  if (role === "OWNER") return true;
  if (role === "MEMBER" && assigneeId === actorId) return true;
  return false;
}
