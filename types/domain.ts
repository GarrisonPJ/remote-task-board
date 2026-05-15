export type WorkspaceRole = "OWNER" | "MEMBER" | "VIEWER";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "CANCELED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type UserDTO = {
  id: string;
  name: string;
  email: string;
};

export type WorkspaceDTO = {
  id: string;
  name: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceMemberDTO = {
  id: string;
  user: UserDTO;
  role: WorkspaceRole;
};

export type ProjectDTO = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskDTO = {
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
};

export type ActivityLogDTO = {
  id: string;
  taskId: string;
  actor: UserDTO;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  createdAt: string;
};

export type CommentDTO = {
  id: string;
  taskId: string;
  user: UserDTO;
  content: string;
  createdAt: string;
};
