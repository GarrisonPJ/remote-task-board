import { z } from "zod";

export const parseTaskSchema = z.object({
  text: z.string().min(1).max(500),
  projectId: z.string().min(1),
});

export type ParseTaskInput = z.infer<typeof parseTaskSchema>;

export const taskParseResultSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional().nullable(),
});
