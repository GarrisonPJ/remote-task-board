export type WorkspaceRole = "OWNER" | "MEMBER" | "VIEWER";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "CANCELED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface UserDTO {
  id: string;
  name: string;
  email: string;
}

export interface WorkspaceDTO {
  id: string;
  name: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMemberDTO {
  id: string;
  user: UserDTO;
  role: WorkspaceRole;
}

export interface ProjectDTO {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDTO {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  creatorId: string;
  assignee?: UserDTO | null;
  dueDate?: string | null;
  activityLogs?: ActivityLogDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogDTO {
  id: string;
  taskId: string;
  actor: UserDTO;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  createdAt: string;
}

export interface CommentDTO {
  id: string;
  taskId: string;
  user: UserDTO;
  content: string;
  createdAt: string;
}

// Service return types (named for reuse across callers)
export interface TaskStats {
  total: number;
  openTasks: number;
  inReview: number;
}

export interface TaskDetailResult {
  task: TaskDTO;
  userRole: WorkspaceRole;
}

export interface ProjectDetailResult {
  project: ProjectDTO;
  userRole: WorkspaceRole;
}
