import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(80),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(80),
});

export const addWorkspaceMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["MEMBER", "VIEWER"]).default("MEMBER"),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>;
